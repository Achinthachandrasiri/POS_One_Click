// BillingPannel.jsx
// Pure UI layout only. All state/handlers are passed in as props from usePosHooks via mainScreen.jsx.
// No logic lives here — except the quick-add customer form's own local input
// state, which is UI-only and reset each time the modal opens.

import { useState, useEffect } from "react";
import CartLine from "./CartLine";

// Blocks characters that would let a number input accept a negative value
// or scientific notation (-, +, e/E) at the keystroke level — belt-and-braces
// alongside the numeric clamping that already happens in usePosHooks.
const blockInvalidNumberKeys = (e) => {
  if (["-", "+", "e", "E"].includes(e.key)) e.preventDefault();
};

// ── Quick-add customer modal ──
const CustomerModal = ({ open, onClose, onSubmit, submitting, fieldErrors }) => {
  const [form, setForm] = useState({ name: "", mobileNumber: "", nicNumber: "", address: "" });

  useEffect(() => {
    if (open) setForm({ name: "", mobileNumber: "", nicNumber: "", address: "" });
  }, [open]);

  if (!open) return null;

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-4">
        <h3 className="text-sm font-semibold text-[#0f172a] mb-3">New customer</h3>

        {fieldErrors?._general && (
          <p className="text-xs text-red-500 mb-2">{fieldErrors._general}</p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
          <div>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Full name"
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-[#2699aa]"
            />
            {fieldErrors?.name && <p className="text-[11px] text-red-500 mt-0.5">{fieldErrors.name}</p>}
          </div>

          <div>
            <input
              type="text"
              value={form.mobileNumber}
              onChange={(e) => handleChange('mobileNumber', e.target.value)}
              placeholder="Mobile number (07XXXXXXXX)"
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-[#2699aa]"
            />
            {fieldErrors?.mobileNumber && <p className="text-[11px] text-red-500 mt-0.5">{fieldErrors.mobileNumber}</p>}
          </div>

          <div>
            <input
              type="text"
              value={form.nicNumber}
              onChange={(e) => handleChange('nicNumber', e.target.value)}
              placeholder="NIC number"
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-[#2699aa]"
            />
            {fieldErrors?.nicNumber && <p className="text-[11px] text-red-500 mt-0.5">{fieldErrors.nicNumber}</p>}
          </div>

          <div>
            <input
              type="text"
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Address"
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-[#2699aa]"
            />
            {fieldErrors?.address && <p className="text-[11px] text-red-500 mt-0.5">{fieldErrors.address}</p>}
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="text-sm px-4 py-2 rounded-lg bg-[#1a6b7a] text-white disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const BillingPannel = ({
  customerSearchTerm,
  onCustomerSearchChange,
  filteredCustomers = [],
  customersLoading = false,
  customersError = null,
  selectedCustomer,
  onSelectCustomer,
  onClearCustomer,
  onNewCustomerClick,
  isCustomerModalOpen,
  onCloseCustomerModal,
  onCreateCustomer,
  customerFormErrors,
  customerFormSubmitting,
  cartItems = [],
  onIncreaseQty,
  onDecreaseQty,
  onRemoveItem,
  onWarrantyClick,
  onQtyChange,
  subtotal = 0,
  totalItems = 0,
  discount,
  discountType,
  onDiscountChange,
  onDiscountTypeToggle,
  specialDiscount,
  isSpecialDiscountUnlocked,
  onSpecialDiscountClick,
  tax,
  taxType,
  onTaxChange,
  onTaxTypeToggle,
  deliveryFee,
  onDeliveryFeeChange,
  totalDue = 0,
  onClearAll,
}) => {
  const safeCartItems = cartItems || [];
  const showResults = !selectedCustomer && customerSearchTerm?.trim();

  // "Clear all" wipes the entire in-progress sale (cart, customer, discount,
  // service charge, delivery fee, payments — see usePosHooks' onReset), so
  // it's confirmed before firing rather than acting on a single click.
  const handleClearAll = () => {
    if (!onClearAll) return;
    if (window.confirm("Clear the entire bill? This removes all cart items, the selected customer, and any discount/service charge/delivery/payment amounts entered.")) {
      onClearAll();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Customer strip - fixed height */}
      <div className="shrink-0 flex items-center gap-2 mx-3 mt-3 mb-2">
        <div className="flex-1 min-w-0 relative">
          {selectedCustomer ? (
            <div className="flex items-center gap-2 border-2 border-[#1a6b7a] rounded-xl pl-3 pr-2 py-0.5">
              <div className="flex-1 min-w-0">
                <p className="flex items-center gap-2 text-sm text-[#0f172a] truncate">
                  <span className="font-medium truncate">{selectedCustomer.name}</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-500 shrink-0">
                    {selectedCustomer.mobileNumber}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={onClearCustomer}
                aria-label="Clear selected customer"
                className="shrink-0 text-slate-400 hover:text-slate-600 text-2xl leading-none px-1"
              >
                ×
              </button>
              <button
                onClick={onNewCustomerClick}
                disabled
                className="text-[12px] px-2 py-2 border border-[#0f172a] bg-[#0f172a] text-slate-100 rounded-lg shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:border-slate-400"
              >
                + Add
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 border-2 border-slate-400 rounded-xl pl-2.5 py-0">
              <input
                type="text"
                value={customerSearchTerm}
                onChange={(e) => onCustomerSearchChange(e.target.value)}
                placeholder="Search customer (name / phone)"
                className="text-sm text-slate-700 placeholder:text-slate-500 flex-1 outline-none bg-transparent py-2.5"
              />
              <button
                onClick={onNewCustomerClick}
                disabled={!!customerSearchTerm?.trim()}
                className="text-[12px] px-2 py-[10px] border border-[#0f172a] bg-[#0f172a] text-slate-100 rounded-r-[11px] shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:border-slate-400"
              >
                + Add
              </button>
            </div>
          )}

          {showResults && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
              {customersLoading ? (
                <div className="text-xs text-slate-400 text-center py-3">Loading customers...</div>
              ) : customersError ? (
                <div className="text-xs text-red-500 text-center py-3">{customersError}</div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-3">No customers found</div>
              ) : (
                filteredCustomers.map((c) => (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => onSelectCustomer(c)}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50"
                  >
                    <p className="text-sm text-slate-700 truncate">{c.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{c.mobileNumber}</p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleClearAll}
          className="shrink-0 text-[12px] px-3 py-[11px] border-2 border-red-400 text-red-500 rounded-xl hover:bg-red-50"
        >
          Clear all
        </button>
      </div>

      {/* Cart - flex-1, takes remaining space */}
      <div className="flex-1 min-h-0 flex flex-col mx-3 mb-2 border border-slate-200 rounded-lg overflow-hidden">
        <div className="grid grid-cols-[1.6fr_0.9fr_0.9fr_auto_auto] px-2.5 py-1.5 bg-slate-50 text-[12px] text-slate-800 shrink-0 gap-2">
          <span>Item</span>
          <span>Qty</span>
          <span className="text-right">Total</span>
          <span></span>
          <span></span>
        </div>
        <div
          dir="ltr"
          className="flex-1 min-h-0 overflow-y-auto
            [&::-webkit-scrollbar]:w-1
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-slate-300
            [&::-webkit-scrollbar-thumb]:rounded-full
            hover:[&::-webkit-scrollbar-thumb]:bg-slate-400"
        >
          {safeCartItems.length === 0 ? (
            <div dir="ltr" className="h-full flex items-center justify-center text-xs text-slate-500">
              Cart is empty — scan or select a product to begin
            </div>
          ) : (
            safeCartItems.map((item) => (
              <CartLine
                key={item._id}
                item={item}
                onIncreaseQty={onIncreaseQty}
                onDecreaseQty={onDecreaseQty}
                onRemove={onRemoveItem}
                onWarrantyClick={onWarrantyClick}
                onQtyChange={onQtyChange}
              />
            ))
          )}
        </div>
      </div>

      {/* Totals - shrink-0, sized to its own content (this is the ONLY totals block) */}
      <div className="shrink-0 mx-3 mb-3">
        <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-300 flex flex-col gap-1.5">
          <div className="flex justify-between text-sm text-[#0f172a]">
            <span>Subtotal</span>
            <span>Rs {subtotal.toFixed(2)}</span>
          </div>

          {/* Discount / Service charge / Delivery - one row, three columns */}
          <div className="grid grid-cols-3 gap-2">
            {/* Discount */}
            <div className="flex flex-col gap-1">
              <span className="text-[12px] text-slate-900">Discount</span>

              <div className="flex border-2 border-slate-500 rounded-lg overflow-hidden">
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => onDiscountChange(e.target.value)}
                  onKeyDown={blockInvalidNumberKeys}
                  placeholder="0"
                  className="w-full min-w-0 text-xs text-right px-1.5 py-3 outline-none"
                />

                <button
                  onClick={() =>
                    discountType !== "fixed" && onDiscountTypeToggle()
                  }
                  className={`px-4 text-[12px] shrink-0 border-l border-slate-500 outline-none ${discountType === "fixed"
                    ? "bg-[#0f172a] text-white"
                    : "text-slate-800"
                    }`}
                >
                  Rs
                </button>

                <button
                  onClick={() =>
                    discountType !== "percentage" && onDiscountTypeToggle()
                  }
                  className={`px-4 text-[12px] shrink-0 border-l border-slate-500 outline-none  ${discountType === "percentage"
                    ? "bg-[#0f172a] text-white"
                    : "text-slate-800"
                    }`}
                >
                  %
                </button>
              </div>
            </div>

            {/* Service charge */}
            <div className="flex flex-col gap-1">
              <span className="text-[12px] text-slate-900">Service charge</span>

              <div className="flex border-2 border-slate-500 rounded-lg overflow-hidden">
                <input
                  type="number"
                  min="0"
                  value={tax}
                  onChange={(e) => onTaxChange(e.target.value)}
                  onKeyDown={blockInvalidNumberKeys}
                  placeholder="0"
                  className="w-full min-w-0 text-xs text-right px-1.5 py-3 outline-none"
                />

                <button
                  onClick={() => taxType !== "fixed" && onTaxTypeToggle()}
                  className={`px-4 text-[12px] shrink-0 border-l border-slate-500 outline-none ${taxType === "fixed"
                    ? "bg-[#0f172a] text-white"
                    : "text-slate-800"
                    }`}
                >
                  Rs
                </button>

                <button
                  onClick={() => taxType !== "percentage" && onTaxTypeToggle()}
                  className={`px-4 text-[12px] shrink-0 border-l border-slate-500 outline-none  ${taxType === "percentage"
                    ? "bg-[#0f172a] text-white"
                    : "text-slate-800"
                    }`}
                >
                  %
                </button>
              </div>
            </div>

            {/* Delivery fee */}
            <div className="flex flex-col gap-1">
              <span className="text-[12px] text-slate-900">Delivery fee</span>

              <input
                type="number"
                min="0"
                value={deliveryFee}
                onChange={(e) => onDeliveryFeeChange(e.target.value)}
                onKeyDown={blockInvalidNumberKeys}
                placeholder="0"
                className="w-full text-xs text-right border-2 border-slate-500 rounded-lg px-1.5 py-3 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-slate-200 pt-2 mt-1">
            <span className="text-sm font-medium text-[#0f172a]">Total due</span>
            <span className="text-xl font-medium text-[#0f172a]">
              Rs {totalDue.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <CustomerModal
        open={isCustomerModalOpen}
        onClose={onCloseCustomerModal}
        onSubmit={onCreateCustomer}
        submitting={customerFormSubmitting}
        fieldErrors={customerFormErrors}
      />
    </div>
  );
};

export default BillingPannel;
