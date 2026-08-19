// saleCalculations.js
// Pure calculation + payload-building logic for creating a sale from the
// current POS cart/discount/payment state.
//
// This file is the SINGLE SOURCE OF TRUTH for all order-level money math.
// usePosHooks.js calls calculateOrderTotals()/calculatePaymentSummary() for
// its live on-screen totals, and buildSalePayload() calls the same
// functions when the sale is actually saved — so the number the cashier
// sees can never drift from the number that gets persisted.
//
// Accounting conventions followed throughout:
//   - All currency values are rounded to 2 decimal places (round2) at the
//     point they're finalized, to avoid floating-point drift compounding
//     across line items -> order totals -> payment summary.
//   - No value in this file is ever allowed to go negative (clampNonNegative).
//   - Percentages are capped at 100 — a discount or service charge can't
//     logically exceed 100% of its base.
//   - Order of operations: line subtotal (net of per-line discounts) ->
//     sum to subtotal -> order-level discount + special discount applied
//     against subtotal -> service charge applied against the DISCOUNTED
//     (taxable) base -> delivery fee added flat, undiscounted, untaxed.
//
// Adjustment shape (discount / special_discount / service_charge):
//   { type: 'fixed' | 'percentage', value, amount }
//   - For 'fixed', `value` is a currency amount.
//   - For 'percentage', `value` is the percentage (0-100, capped).
//   There is a single `value` field for both types — no separate
//   `percentage` key. `amount` is always the resolved currency amount.
//
// SNAPSHOT RULE (product AND service lines):
//   product_price/product_cost and service_price/service_cost are captured
//   ONCE, from whatever the cart item is already holding (which was itself
//   captured from the live Product/Service doc at add-to-cart time), and
//   stamped straight into the persisted sale line. This function never goes
//   back to the Product/Service collection to re-fetch a "current" price —
//   that's what keeps a past sale's totals frozen even if someone edits a
//   product's or service's price/cost afterward.

// ---------- Rounding & guards ----------

export const round2 = (num) => {
  const n = Number(num);
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
};

export const clampNonNegative = (num) => {
  const n = Number(num);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
};

// ---------- Adjustments (discount / special discount / service charge) ----------

// Builds a normalized Adjustment object against a base amount:
//   { type: 'fixed'|'percentage', value, amount }
// - type 'fixed': `value` is a currency amount, used directly as `amount`.
// - type 'percentage': `value` is the percentage (0-100, capped), `amount` = base * value / 100.
// `capToBase`: when true (used for discounts), `amount` is capped so a
// discount can never exceed — and therefore invert — the amount it's being
// deducted from.
export const buildAdjustment = (type, rawValue, base, { capToBase = false } = {}) => {
  const safeType = type === "percentage" ? "percentage" : "fixed";
  const safeBase = clampNonNegative(base);
  let value = clampNonNegative(rawValue);

  if (safeType === "percentage") {
    value = Math.min(value, 100); // a percentage can't exceed 100%
    const amount = round2((safeBase * value) / 100);
    return { type: "percentage", value, amount };
  }

  let amount = round2(value);
  if (capToBase) amount = Math.min(amount, safeBase);
  return { type: "fixed", value, amount };
};

// Resolves the currency amount from an Adjustment-like object against a base.
// Accepts both the { type, value, amount } shape (order-level) and the
// per-line { type, value } shape used by product_discount / special_discount.
export const resolveAdjustmentAmount = (adjustment, base) => {
  if (!adjustment) return 0;
  if (typeof adjustment.amount === "number") return round2(adjustment.amount);
  const safeBase = clampNonNegative(base);
  if (adjustment.type === "percentage") {
    const pct = Math.min(clampNonNegative(adjustment.value ?? 0), 100);
    return round2((safeBase * pct) / 100);
  }
  return round2(clampNonNegative(adjustment.value));
};

// ---------- Line items ----------

// Per-line subtotal: (price * qty) minus that line's own product_discount
// and special_discount (both Adjustment objects), floored at 0.
// Works identically for product lines and service lines — both pass in
// item.price/item.qty regardless of what kind of line it is.
export const calculateLineSubtotal = (price, qty, productDiscount, specialDiscount) => {
  const gross = round2(clampNonNegative(price) * clampNonNegative(qty));
  const productDiscountAmount = resolveAdjustmentAmount(productDiscount, gross);
  const specialDiscountAmount = resolveAdjustmentAmount(specialDiscount, gross);
  return round2(Math.max(0, gross - productDiscountAmount - specialDiscountAmount));
};

// Per-line profit: line subtotal minus cost * qty.
export const calculateLineProfit = (lineSubtotal, cost, qty) => {
  return round2(lineSubtotal - clampNonNegative(cost) * clampNonNegative(qty));
};

// Builds every cart line into a Sale-model-shaped item.
//
// A cart line is a SERVICE line if it carries `service_id`, and a PRODUCT
// line otherwise (carrying `product_id`) — same presence-based distinction
// used in the Sale schema itself, so there's nothing to keep in sync between
// the two. Whichever kind it is, the *other* id is explicitly set to null
// so a saved line never accidentally ends up looking like both.
//
// Money math (subtotal/profit) is identical for both kinds — only the
// name/price/cost fields it gets written into, and which structural fields
// (variation/batch/store) get attached, differ.
export const buildSaleLineItems = (cartItems) => {
  return (cartItems || []).map((item) => {
    const productDiscount = item.product_discount || { type: "fixed", value: 0 };
    const specialDiscount = item.special_discount || { type: "fixed", value: 0 };
    const qty = clampNonNegative(item.qty);
    const lineSubtotal = calculateLineSubtotal(item.price, qty, productDiscount, specialDiscount);
    const lineProfit = calculateLineProfit(lineSubtotal, item.cost, qty);

    const sharedFields = {
      qty,
      product_discount: productDiscount,
      special_discount: specialDiscount,
      warranty: item.warranty || undefined,
      subtotal: lineSubtotal,
      product_profit: lineProfit,
    };

    const isServiceLine = !!item.service_id;

    if (isServiceLine) {
      return {
        ...sharedFields,
        product_id: null,
        service_id: item.service_id,
        // Snapshot captured from item.price/item.cost, which were set on
        // the cart line at add-to-cart time — never re-read from the live
        // Service collection here.
        service: {
          service_name: item.name,
          service_price: item.price,
          service_cost: item.cost,
        },
      };
    }

    return {
      ...sharedFields,
      product_id: item.product_id,
      service_id: null,
      product_name: item.name,
      product_price: item.price,
      product_cost: item.cost,
      batch_number: item.batch_id ? item.batch_number : null,
      variation_id: item.variation_id,
      variation_name: item.variation_name,
      structure: item.structure,
      batch_tracking: !!item.batch_tracking,
    };
  });
};

// ---------- Order-level totals ----------

// Computes the full order-level breakdown from line items + the
// discount/service-charge/delivery inputs. This is the ONE place that
// formula lives — both usePosHooks (live display) and buildSalePayload
// (save) call this, so they can never disagree.
export const calculateOrderTotals = ({
  lineItems = [],
  discountType = "fixed",
  discountValue = 0,
  specialDiscountValue = 0,
  taxType = "fixed",
  taxValue = 0,
  deliveryFee = 0,
}) => {
  const subtotal = round2(lineItems.reduce((sum, i) => sum + (Number(i.subtotal) || 0), 0));
  const totalProfit = round2(lineItems.reduce((sum, i) => sum + (Number(i.product_profit) || 0), 0));

  // Order-level discount and special/manager discount are each capped
  // individually against subtotal, then the combined total is capped again
  // as a final safety net — a bill can never go negative from discounts alone.
  const discountAdj = buildAdjustment(discountType, discountValue, subtotal, { capToBase: true });
  const specialDiscountAdj = buildAdjustment("fixed", specialDiscountValue, subtotal, { capToBase: true });
  const discountAmount = Math.min(subtotal, round2(discountAdj.amount + specialDiscountAdj.amount));

  // Service charge is calculated on the DISCOUNTED (taxable) base, not the
  // raw subtotal — standard retail invoicing order of operations.
  const taxableBase = round2(Math.max(0, subtotal - discountAmount));
  const serviceChargeAdj = buildAdjustment(taxType, taxValue, taxableBase);

  const deliveryFeeValue = round2(clampNonNegative(deliveryFee));

  const totalAmount = round2(
    Math.max(0, subtotal - discountAmount + serviceChargeAdj.amount + deliveryFeeValue)
  );

  return {
    subtotal,
    totalProfit,
    discount: discountAdj,
    specialDiscount: specialDiscountAdj,
    discountAmount,
    taxableBase,
    serviceCharge: serviceChargeAdj,
    serviceChargeAmount: serviceChargeAdj.amount,
    deliveryFeeValue,
    totalAmount,
  };
};

// ---------- Payment / balance ----------

const PAYMENT_KEY_MAP = { cash: "cash", card: "card", bank: "bank_transfer" };

// Splits payments into due (customer still owes) vs change (cashier owes
// customer back), from the total across all payment methods vs totalDue.
//   total 6000, paid 5000  -> dueAmount 1000, changeAmount 0
//   total 6000, paid 10000 -> dueAmount 0,    changeAmount 4000
//
// IMPORTANT — payments vs totalPaid are deliberately NOT the same number
// when the customer overpays:
//   - `totalPaid` is the raw, un-capped sum of every payment-method input
//     exactly as typed (this becomes `amount_given` on the payload — what
//     was actually physically handed over).
//   - `payments` (returned array) is capped so it never sums to more than
//     `totalDue` — anything tendered beyond the bill is change, not an
//     "applied" payment. The backend's validatePaymentSum requires
//     payments[] to sum to EXACTLY total_amount for a 'paid' sale, so
//     without this cap, any cash-with-change scenario (customer hands over
//     more than the bill) would submit payments[] summing to MORE than
//     total_amount and get rejected with "Paid amount does not match the
//     total amount for a fully paid sale" — this cap is the fix for that.
// Capping walks payment legs in the order Object.entries gives
// paymentAmounts (cash, card, bank — matching PayingPannel's PAYMENT_TYPES
// order) and allocates each leg up to whatever balance is still
// remaining; any leg that would push the running total past totalDue is
// truncated to exactly the remaining balance, and anything after that is
// dropped from `payments` entirely (it's pure change).
export const calculatePaymentSummary = (paymentAmounts = {}, totalDue = 0) => {
  const rawPayments = Object.entries(paymentAmounts)
    .map(([key, value]) => ({ key, type: PAYMENT_KEY_MAP[key] ?? key, value: clampNonNegative(value) }))
    .filter((p) => p.value > 0);

  const totalPaid = round2(rawPayments.reduce((sum, p) => sum + p.value, 0));
  const safeTotalDue = round2(clampNonNegative(totalDue));

  let remaining = safeTotalDue;
  const payments = rawPayments
    .map((p) => {
      const applied = round2(Math.min(p.value, Math.max(0, remaining)));
      remaining = round2(Math.max(0, remaining - applied));
      return { key: p.key, type: p.type, value: applied };
    })
    .filter((p) => p.value > 0);

  const dueAmount = round2(Math.max(0, safeTotalDue - totalPaid));
  const changeAmount = round2(Math.max(0, totalPaid - safeTotalDue));

  const paymentStatus = totalPaid <= 0 ? "unpaid" : dueAmount > 0 ? "partial" : "paid";

  return { payments, totalPaid, dueAmount, changeAmount, paymentStatus };
};

// ---------- Payload assembly ----------

// Assembles the full payload matching the Sale model, from the POS state.
//
// IMPORTANT: this returns { payload, totals } as two SEPARATE objects —
// never one merged object. `payload` is exactly what's safe to send to
// window.api.sale.create() / persist on the Sale document. `totals` is the
// same orderTotals breakdown for the UI (confirmation popup, receipt
// preview, etc.) to read without recalculating. Nothing in `totals` should
// ever be spread or attached onto `payload` — every value it holds already
// exists on `payload` in the Sale-model shape (discount, special_discount,
// service_charge, subtotal, total_amount, total_profit, delivery_fee), plus
// `taxableBase`, which is display-only and intentionally not persisted.
// If taxableBase ever needs to be persisted, add a real `taxable_base`
// field to saleModel.js and map it explicitly below — don't reach for
// _totals as a shortcut.
export const buildSalePayload = ({
  session,
  selectedCustomer,
  cartItems,
  discount,
  discountType,
  specialDiscount,
  tax,
  taxType,
  deliveryFee,
  paymentAmounts,
  note,
}) => {
  const lineItems = buildSaleLineItems(cartItems);

  const orderTotals = calculateOrderTotals({
    lineItems,
    discountType,
    discountValue: discount,
    specialDiscountValue: specialDiscount,
    taxType,
    taxValue: tax,
    deliveryFee,
  });

  const paymentSummary = calculatePaymentSummary(paymentAmounts, orderTotals.totalAmount);

  const payload = {
    store_id: session?.store_id,
    store_code: session?.store_code,
    device_id: session?.device_id,
    cash_session_id: session?._id,
    device_timestamp: new Date(),
    customer_id: selectedCustomer?._id ?? null,
    discount: orderTotals.discount,
    special_discount: orderTotals.specialDiscount,
    service_charge: orderTotals.serviceCharge,
    delivery_fee: orderTotals.deliveryFeeValue,
    payment_status: paymentSummary.paymentStatus,
    payments: paymentSummary.payments.map(({ type, value }) => ({ type, value })),
    amount_given: paymentSummary.totalPaid,
    due_amount: paymentSummary.dueAmount,
    change_amount: paymentSummary.changeAmount,
    credit_recovery_deadline: null, // TODO: no UI input for this yet
    note,
    subtotal: orderTotals.subtotal,
    total_amount: orderTotals.totalAmount,
    total_profit: orderTotals.totalProfit,
    items: lineItems,
  };

  return { payload, totals: orderTotals };
};

// Called on Save / Save with bill. IPC integration comes later — for now
// this just logs the assembled payload and totals so the calculation
// logic can be verified against the UI's cart/discount/tax inputs.
//
// Only `payload` ever goes to IPC/persistence. `totals` is returned
// alongside it purely for callers (confirmation popup, receipt preview)
// that want the breakdown without recalculating — it must never be merged
// into `payload` before being handed to window.api.sale.create().
export const createSale = (saleArgs, { printBill } = {}) => {
  const { payload, totals } = buildSalePayload(saleArgs);
  console.log(`[createSale] printBill=${printBill}`, payload, totals);
  return { payload, totals };
};
