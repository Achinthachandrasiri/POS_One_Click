// SaleConfirmModal.jsx
// Pure UI layout only. All state/handlers are passed in as props from
// usePosHooks via mainScreen.jsx (same pattern as WarrantyModal /
// ProductVariationModal).
//
// Shown after onSaveWithBill/onSaveWithoutBill build a pendingSale
// ({ payload, totals, printBill }) in usePosHooks. Confirming here is the
// ONLY point that actually calls the sale:create IPC (via onConfirm ->
// onConfirmSale -> persistSale(pendingSale.payload)) — nothing before this
// modal has touched the backend yet.
//
// Renders primarily from pendingSale.payload rather than pendingSale.totals:
// payload is the exact, complete, backend-shaped object that gets sent over
// IPC (subtotal, total_amount, discount, service_charge, special_discount,
// delivery_fee, payment_status, payments, due_amount, change_amount,
// total_profit, items) — so what the cashier reviews here is guaranteed to
// match what's persisted, with zero risk of drifting from a differently-
// shaped `totals` display object.

import { FiCheckCircle, FiX, FiAlertCircle } from "react-icons/fi";

const money = (n) => `Rs ${(Number(n) || 0).toFixed(2)}`;

const paymentTypeLabels = {
  cash: "Cash",
  card: "Card",
  bank_transfer: "Bank transfer",
  cheque: "Cheque",
};

const paymentStatusLabels = {
  paid: "Paid",
  unpaid: "Unpaid",
  partial: "Partial",
};

const adjustmentLabel = (adj) => {
  if (!adj || !adj.amount) return null;
  const suffix = adj.type === "percentage" ? ` (${adj.value}%)` : "";
  return `${money(adj.amount)}${suffix}`;
};

const lineItemLabel = (item) => {
  if (item.service_id) return item.service?.service_name || "Service";
  return item.product_name || "Product";
};

const SaleConfirmModal = ({
  isOpen,
  pendingSale, // { payload, totals, printBill } | null
  onClose,
  onConfirm,
  submitting = false,
  submitError = null,
  fieldErrors = null,
}) => {
  if (!isOpen || !pendingSale) return null;

  const { payload, printBill } = pendingSale;
  const items = payload?.items || [];
  const payments = payload?.payments || [];

  const discountLabel = adjustmentLabel(payload?.discount);
  const specialDiscountLabel = adjustmentLabel(payload?.special_discount);
  const serviceChargeLabel = adjustmentLabel(payload?.service_charge);

  const fieldErrorEntries = fieldErrors ? Object.entries(fieldErrors) : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg bg-[#1a6b7a]/10 text-[#1a6b7a]">
              <FiCheckCircle size={16} />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[#0f172a]">Confirm sale</h3>
              <p className="text-[12px] text-slate-500">
                {printBill ? "Will print a bill on save" : "Save only — no bill"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            disabled={submitting}
            className="shrink-0 text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 disabled:opacity-60"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
          {/* Error banner */}
          {submitError && (
            <div className="mb-3 flex items-start gap-2 rounded-lg bg-red-50 text-red-600 text-[12px] px-3 py-2">
              <FiAlertCircle size={14} className="shrink-0 mt-[1px]" />
              <span>{submitError}</span>
            </div>
          )}
          {fieldErrorEntries.length > 0 && (
            <div className="mb-3 rounded-lg bg-red-50 text-red-600 text-[12px] px-3 py-2">
              <div className="flex items-start gap-2">
                <FiAlertCircle size={14} className="shrink-0 mt-[1px]" />
                <div className="flex flex-col gap-0.5">
                  {fieldErrorEntries.map(([field, message]) => (
                    <span key={field}>{message}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="flex flex-col gap-1.5">
            {items.map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-slate-700 truncate">
                  {lineItemLabel(item)} <span className="text-slate-400">x{item.qty}</span>
                </span>
                <span className="text-slate-600 shrink-0">{money(item.subtotal)}</span>
              </div>
            ))}
          </div>

          {/* Totals breakdown */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="text-slate-700">{money(payload?.subtotal)}</span>
            </div>
            {discountLabel && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Discount</span>
                <span className="text-red-500">-{discountLabel}</span>
              </div>
            )}
            {specialDiscountLabel && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Special discount</span>
                <span className="text-red-500">-{specialDiscountLabel}</span>
              </div>
            )}
            {serviceChargeLabel && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Service charge</span>
                <span className="text-slate-700">+{serviceChargeLabel}</span>
              </div>
            )}
            {!!payload?.delivery_fee && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Delivery fee</span>
                <span className="text-slate-700">+{money(payload.delivery_fee)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm font-semibold pt-1">
              <span className="text-[#0f172a]">Total</span>
              <span className="text-[#0f172a]">{money(payload?.total_amount)}</span>
            </div>
          </div>

          {/* Payment breakdown */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Payment status</span>
              <span className="text-slate-700">
                {paymentStatusLabels[payload?.payment_status] || payload?.payment_status}
              </span>
            </div>
            {payments.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-500">{paymentTypeLabels[p.type] || p.type}</span>
                <span className="text-slate-700">{money(p.value)}</span>
              </div>
            ))}
            {!!payload?.change_amount && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Change</span>
                <span className="text-emerald-600">{money(payload.change_amount)}</span>
              </div>
            )}
            {!!payload?.due_amount && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Due</span>
                <span className="text-red-500">{money(payload.due_amount)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-sm px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="text-sm px-4 py-2 rounded-lg bg-[#1a6b7a] text-white disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Confirm sale"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaleConfirmModal;
