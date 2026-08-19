// CartLine.jsx
// Pure UI layout only. All state/handlers are passed in as props from usePosHooks via BillingPannel.jsx.
// No logic lives here.
//
// item shape: { _id, name, price, qty, warranty: null | { warranty_type_id, warranty_name, coverage_type, terms, serial_number } }
// qty can transiently be "" (empty string) while the cashier is mid-edit in the
// qty input — usePosHooks.onQtyChange allows this, and onBlur here snaps it
// back to a valid number (min 1) once the input loses focus.

import { FiPlus, FiMinus, FiX, FiShield } from "react-icons/fi";

const CartLine = ({
  item,
  onIncreaseQty,
  onDecreaseQty,
  onRemove,
  onWarrantyClick,
  onQtyChange,
}) => {
  // Guard against a malformed/undefined item so a bad cart entry can't crash
  // the whole billing panel — render nothing for that row instead.
  if (!item) return null;

  const {
    _id,
    name = "",
    price = 0,
    qty = 1,
    warranty = null,
  } = item;

  const safeQty = qty === "" ? "" : Number(qty) || 0;
  const lineTotal = price * (Number(qty) || 0);
  const hasWarranty = !!warranty?.warranty_name;

  const handleQtyInputChange = (e) => {
    onQtyChange?.(_id, e.target.value);
  };

  const handleQtyBlur = (e) => {
    const parsed = Math.max(1, Number(e.target.value) || 1);
    onQtyChange?.(_id, parsed);
  };

  return (
    <div
      dir="ltr"
      className={`grid grid-cols-[1.6fr_0.9fr_0.9fr_auto_auto] items-center px-2.5 py-2 gap-2 border-b border-slate-100 last:border-b-0 ${hasWarranty ? "bg-blue-50" : ""
        }`}
    >
      {/* Item name + unit price */}
      <div className="flex flex-col min-w-0">
        <span className="text-sm text-slate-800 truncate" title={name}>
          {name}
        </span>
        <span className="text-[12px] text-slate-600 mt-0.5 px-2 py-[1px] rounded-xl bg-slate-100 shrink-0 w-fit">
          Rs {price.toFixed(2)}
        </span>
      </div>

      {/* Qty controls */}
      <div className="flex items-center gap-1 min-w-0">
        <button
          onClick={() => onDecreaseQty?.(_id)}
          className="w-7 h-[28px] shrink-0 flex items-center justify-center rounded border bg-[#0f172a] border-[#0f172a] text-slate-100 hover:bg-slate-700"
        >
          <FiMinus size={12} />
        </button>

        <input
          type="text"
          inputMode="numeric"
          value={safeQty}
          onChange={handleQtyInputChange}
          onBlur={handleQtyBlur}
          className="w-12 text-sm text-center border border-slate-300 rounded outline-none focus:ring-2 focus:ring-gray-400 py-[3.5px]"
        />

        <button
          onClick={() => onIncreaseQty?.(_id)}
          className="w-7 h-[28px] shrink-0 flex items-center justify-center rounded border bg-[#0f172a] border-[#0f172a] text-slate-100 hover:bg-slate-700"
        >
          <FiPlus size={12} />
        </button>
      </div>

      {/* Line total */}
      <span className="text-sm text-right text-[#0f172a]">
        Rs {lineTotal.toFixed(2)}
      </span>

      {/* Warranty */}
      <button
        onClick={() => onWarrantyClick?.(_id)}
        title={warranty?.warranty_name ? warranty.warranty_name : "Add warranty"}
        className={`w-6 h-6 shrink-0 flex items-center bg-blue-50 text-blue-500 justify-center rounded ${hasWarranty
          ? "bg-blue-50 text-[#1a6b7a]"
          : "text-slate-600 hover:text-[#1a6b7a] hover:bg-slate-100"
          }`}
      >
        <FiShield size={14} />
      </button>

      {/* Remove */}
      <button
        onClick={() => onRemove?.(_id)}
        className="w-6 h-6 shrink-0 flex items-center justify-center rounded bg-red-50 text-red-500 hover:text-red-600 hover:bg-red-100"
        title="Remove item"
      >
        <FiX size={14} />
      </button>
    </div>
  );
};

export default CartLine;
