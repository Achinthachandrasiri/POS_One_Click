import { SaleCounter } from '../../models/saleCounterModel'

// ---------- Rounding & guards ----------
// Ported verbatim from saleCalculations.js (frontend) so the backend's
// verification math can never silently drift from what the cashier saw
// on screen.

const round2 = (num) => {
  const n = Number(num)
  if (!Number.isFinite(n)) return 0
  return Math.round((n + Number.EPSILON) * 100) / 100
}

const clampNonNegative = (num) => {
  const n = Number(num)
  if (!Number.isFinite(n) || n < 0) return 0
  return n
}

export const generateInvoiceNumber = (storeCode) => {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const stamp = `${String(now.getFullYear()).slice(-2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}`
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0')
  return `${storeCode}-${stamp}-${random}`
}

export const getDateKey = (date) => {
  const d = date || new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
}

export const getNextSaleNumberOfDay = async (storeId, date, session) => {
  const dateKey = getDateKey(date)
  const query = SaleCounter.findOneAndUpdate(
    { store_id: storeId, date_key: dateKey },
    { $inc: { count: 1 } },
    { upsert: true, new: true }
  )
  const counter = session ? await query.session(session) : await query
  return counter.count
}

// ---------- Adjustment resolution ----------
// Resolves the currency amount from an Adjustment-like object
// { type, value, amount } against a base. Trusts `amount` when present
// (it's the frontend's already-computed figure) but recomputes from
// `type`/`value` as a fallback and as the basis for the tamper-check in
// verifySaleTotals below — an attacker patching the IPC payload can set
// `amount` to anything, but can't make `amount` disagree with `type`+`value`
// without the recompute catching it.
export const resolveAdjustmentAmount = (adjustment, base) => {
  if (!adjustment) return 0
  const safeBase = clampNonNegative(base)
  if (adjustment.type === 'percentage') {
    const pct = Math.min(clampNonNegative(adjustment.value ?? 0), 100)
    return round2((safeBase * pct) / 100)
  }
  return round2(clampNonNegative(adjustment.value))
}

// ---------- Line items ----------
// Ported from calculateLineSubtotal/calculateLineProfit in
// saleCalculations.js — identical formula, product and service lines both
// pass price/qty regardless of kind.

export const calculateLineSubtotal = (price, qty, productDiscount, specialDiscount) => {
  const gross = round2(clampNonNegative(price) * clampNonNegative(qty))
  const productDiscountAmount = resolveAdjustmentAmount(productDiscount, gross)
  const specialDiscountAmount = resolveAdjustmentAmount(specialDiscount, gross)
  return round2(Math.max(0, gross - productDiscountAmount - specialDiscountAmount))
}

export const calculateLineProfit = (lineSubtotal, cost, qty) => {
  return round2(lineSubtotal - clampNonNegative(cost) * clampNonNegative(qty))
}

// ---------- Order-level totals ----------
// Ported from calculateOrderTotals in saleCalculations.js. Order of
// operations: line subtotal -> sum to subtotal -> order-level discount +
// special discount capped against subtotal -> service charge on the
// DISCOUNTED (taxable) base -> delivery fee added flat/untaxed.
export const calculateSaleTotals = ({ items, discount, specialDiscount, serviceCharge, deliveryFee }) => {
  const subtotal = round2((items || []).reduce((sum, i) => sum + (Number(i.subtotal) || 0), 0))
  const totalProfit = round2((items || []).reduce((sum, i) => sum + (Number(i.product_profit) || 0), 0))

  const discountAmount = resolveAdjustmentAmount(discount, subtotal)
  const specialDiscountAmount = resolveAdjustmentAmount(specialDiscount, subtotal)
  const cappedDiscountTotal = Math.min(subtotal, round2(discountAmount + specialDiscountAmount))

  const taxableBase = round2(Math.max(0, subtotal - cappedDiscountTotal))
  const serviceChargeAmount = resolveAdjustmentAmount(serviceCharge, taxableBase)

  const deliveryFeeValue = round2(clampNonNegative(deliveryFee))

  const totalAmount = round2(
    Math.max(0, subtotal - cappedDiscountTotal + serviceChargeAmount + deliveryFeeValue)
  )

  return {
    subtotal,
    totalProfit,
    discountAmount: cappedDiscountTotal,
    taxableBase,
    serviceChargeAmount,
    deliveryFeeValue,
    totalAmount
  }
}

// Tolerance for floating-point drift between the frontend's computed
// figures and the backend's recompute — anything beyond this is treated as
// tampering or a genuine calculation-logic mismatch, not rounding noise.
const TOTALS_TOLERANCE = 0.01

// Recomputes line items + order totals server-side from the raw inputs
// (price/qty/discount definitions) and compares against what the client
// submitted. Returns { valid, recomputed, mismatches } — `recomputed` is
// what actually gets persisted (never the client's raw subtotal/profit
// figures), `mismatches` lists any field that disagreed beyond tolerance.
export const verifyAndRecomputeSale = (data) => {
  const mismatches = []

  const recomputedItems = (data.items || []).map((item, i) => {
    const subtotal = calculateLineSubtotal(
      item.product_id ? item.product_price : item.service?.service_price,
      item.qty,
      item.product_discount,
      item.special_discount
    )
    const cost = item.product_id ? item.product_cost : item.service?.service_cost
    const product_profit = calculateLineProfit(subtotal, cost, item.qty)

    if (typeof item.subtotal === 'number' && Math.abs(item.subtotal - subtotal) > TOTALS_TOLERANCE) {
      mismatches.push(`items[${i}].subtotal`)
    }

    return { ...item, subtotal, product_profit }
  })

  const totals = calculateSaleTotals({
    items: recomputedItems,
    discount: data.discount,
    specialDiscount: data.special_discount,
    serviceCharge: data.service_charge,
    deliveryFee: data.delivery_fee
  })

  if (typeof data.subtotal === 'number' && Math.abs(data.subtotal - totals.subtotal) > TOTALS_TOLERANCE) {
    mismatches.push('subtotal')
  }
  if (typeof data.total_amount === 'number' && Math.abs(data.total_amount - totals.totalAmount) > TOTALS_TOLERANCE) {
    mismatches.push('total_amount')
  }
  if (typeof data.total_profit === 'number' && Math.abs(data.total_profit - totals.totalProfit) > TOTALS_TOLERANCE) {
    mismatches.push('total_profit')
  }

  return {
    valid: mismatches.length === 0,
    mismatches,
    recomputedItems,
    totals
  }
}

export const validatePaymentSum = (payments, totalAmount, paymentStatus) => {
  const paidSum = round2((payments || []).reduce((sum, p) => sum + (p.value || 0), 0))
  const safeTotal = round2(clampNonNegative(totalAmount))

  if (paymentStatus === 'paid' && Math.abs(paidSum - safeTotal) > TOTALS_TOLERANCE) {
    return { valid: false, error: 'Paid amount does not match the total amount for a fully paid sale.' }
  }
  if (paymentStatus === 'partial' && paidSum >= safeTotal) {
    return { valid: false, error: 'Partial payment must be less than the total amount.' }
  }
  if (paymentStatus === 'unpaid' && paidSum > 0) {
    return { valid: false, error: 'Unpaid sales should not include any payment amount.' }
  }

  return { valid: true, paidSum, dueAmount: round2(Math.max(safeTotal - paidSum, 0)) }
}

export const buildReceiptPayload = (sale) => ({
  invoice_number: sale.invoice_number,
  sale_date: sale.sale_date,
  cashier_name: sale.cashier_name,
  customer_name: sale.customer_name,
  items: sale.items.map((i) => ({
    name: i.service_id ? i.service?.service_name : i.product_name,
    qty: i.qty,
    price: i.service_id ? i.service?.service_price : i.product_price,
    subtotal: i.subtotal
  })),
  subtotal: sale.subtotal,
  discount: sale.discount,
  service_charge: sale.service_charge,
  special_discount: sale.special_discount,
  delivery_fee: sale.delivery_fee,
  total_amount: sale.total_amount,
  payments: sale.payments,
  amount_given: sale.amount_given,
  change_amount: sale.change_amount,
  due_amount: sale.due_amount
})
