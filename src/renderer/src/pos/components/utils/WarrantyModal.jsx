// WarrantyModal.jsx
// Pure UI layout only. All state/handlers are passed in as props from
// usePosHooks via mainScreen.jsx (same pattern as Header/ProductPannel/etc).
//
// Exception: the serial number input and selected warranty type are LOCAL,
// UI-only state — reset each time the modal opens — same pattern used for
// the quick-add customer form inside BillingPannel.jsx's CustomerModal.
//
// Triggered from CartLine's onWarrantyClick(_id). usePosHooks is responsible
// for tracking which cart item id the modal is currently open for, and for
// fetching warrantyTypes (via warrantyType:getAll IPC) once on mount.

import { useState, useEffect } from "react";
import { FiShield, FiX, FiCheck } from "react-icons/fi";

const coverageLabels = {
  repair: "Repair",
  replacement: "Replacement",
  refund: "Refund",
  repair_or_replacement: "Repair or replacement",
};

const WarrantyModal = ({
  open,
  onClose,
  cartItem, // { _id, name, price, warranty } — the line this modal is editing
  warrantyTypes = [], // [{ _id, warranty_name, coverage_type, terms }]
  warrantyTypesLoading = false,
  warrantyTypesError = null,
  onConfirm, // (cartItemId, { warranty_type_id, warranty_name, coverage_type, terms, serial_number }) => void
  onRemoveWarranty, // (cartItemId) => void — clears warranty already on the line
  submitting = false,
}) => {
  const [selectedTypeId, setSelectedTypeId] = useState(null);
  const [serialNumber, setSerialNumber] = useState("");

  useEffect(() => {
    if (open) {
      setSelectedTypeId(cartItem?.warranty?.warranty_type_id || null);
      setSerialNumber(cartItem?.warranty?.serial_number || "");
    }
  }, [open, cartItem]);

  if (!open) return null;

  const selectedType = warrantyTypes.find((w) => w._id === selectedTypeId) || null;

  const handleConfirm = () => {
    if (!selectedType || !cartItem?._id) return;
    onConfirm?.(cartItem._id, {
      warranty_type_id: selectedType._id,
      warranty_name: selectedType.warranty_name,
      coverage_type: selectedType.coverage_type,
      terms: selectedType.terms || "",
      serial_number: serialNumber.trim(),
    });
  };

  const handleRemove = () => {
    if (!cartItem?._id) return;
    onRemoveWarranty?.(cartItem._id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg bg-[#1a6b7a]/10 text-[#1a6b7a]">
              <FiShield size={16} />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[#0f172a]">Add warranty</h3>
              {cartItem?.name && (
                <p className="text-[12px] text-slate-500 truncate">{cartItem.name}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* Warranty type list */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
          {warrantyTypesLoading ? (
            <div className="text-xs text-slate-400 text-center py-6">Loading warranty types...</div>
          ) : warrantyTypesError ? (
            <div className="text-xs text-red-500 text-center py-6">{warrantyTypesError}</div>
          ) : warrantyTypes.length === 0 ? (
            <div className="text-xs text-slate-400 text-center py-6">
              No warranty types found. Add one from the Warranties module first.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {warrantyTypes.map((w) => {
                const isSelected = w._id === selectedTypeId;
                return (
                  <button
                    key={w._id}
                    type="button"
                    onClick={() => setSelectedTypeId(w._id)}
                    className={`text-left px-3 py-2.5 rounded-lg border-2 transition-colors ${
                      isSelected
                        ? "border-[#1a6b7a] bg-[#1a6b7a]/5"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-[#0f172a] truncate">
                        {w.warranty_name}
                      </span>
                      {isSelected && (
                        <span className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-[#1a6b7a] text-white">
                          <FiCheck size={11} />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] px-2 py-[1px] rounded-full bg-slate-100 text-slate-600">
                        {coverageLabels[w.coverage_type] || w.coverage_type}
                      </span>
                    </div>
                    {w.terms && (
                      <p className="text-[12px] text-slate-500 mt-1.5 line-clamp-2">{w.terms}</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Optional serial number */}
          <div className="mt-3">
            <label className="text-[12px] text-slate-600 mb-1 block">
              Serial / IMEI number (optional)
            </label>
            <input
              type="text"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="e.g. SN-00123456"
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-[#2699aa]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-3 border-t border-slate-100">
          {cartItem?.warranty?.warranty_type_id ? (
            <button
              type="button"
              onClick={handleRemove}
              disabled={submitting}
              className="text-sm px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-60"
            >
              Remove warranty
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedType || submitting}
              className="text-sm px-4 py-2 rounded-lg bg-[#1a6b7a] text-white disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Add warranty"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarrantyModal;
