// ProductVariationModal.jsx
import { useState, useEffect, useMemo } from "react";

const buildSelectableOptions = (product) => {
  if (!product) return [];
  const variations = product.variations || [];

  if (product.batch_tracking) {
    return variations.flatMap((v) =>
      (v.batches || [])
        .filter((b) => b.status !== "inactive")
        .map((b) => ({
          key: `${v._id}_${b._id}`,
          variation_id: v._id,
          variation_name: v.name,
          batch_id: b._id,
          batch_number: b.batch_number,
          price: b.price,
          cost: b.cost,
          stock: b.stock,
          discount_type: b.discount_type,
          discount_value: b.discount_value,
          expiry_date: b.expiry_date,
        }))
    );
  }

  return variations.map((v) => ({
    key: v._id,
    variation_id: v._id,
    variation_name: v.name,
    batch_id: null,
    batch_number: null,
    price: v.price,
    cost: v.cost,
    stock: v.stock,
    discount_type: v.discount_type,
    discount_value: v.discount_value,
    expiry_date: null,
  }));
};

const ProductVariationModal = ({ isOpen, product, onClose, onConfirm }) => {
  const [selected, setSelected] = useState({}); // { [optionKey]: qty }

  const options = useMemo(() => buildSelectableOptions(product), [product]);
  const showGroups = product?.structure === "variable";

  const grouped = useMemo(() => {
    const map = new Map();
    options.forEach((opt) => {
      if (!map.has(opt.variation_id)) {
        map.set(opt.variation_id, { name: opt.variation_name, items: [] });
      }
      map.get(opt.variation_id).items.push(opt);
    });
    return Array.from(map.values());
  }, [options]);

  useEffect(() => {
    if (isOpen) setSelected({});
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const toggleOption = (opt) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[opt.key] != null) delete next[opt.key];
      else next[opt.key] = 1;
      return next;
    });
  };

  const changeQty = (opt, qty) => {
    setSelected((prev) => ({
      ...prev,
      [opt.key]: Math.max(1, Math.min(opt.stock || 1, Number(qty) || 1)),
    }));
  };

  const selectedCount = Object.keys(selected).length;

  const handleConfirm = () => {
    const items = options
      .filter((opt) => selected[opt.key] != null)
      .map((opt) => ({ ...opt, qty: selected[opt.key] }));
    if (items.length === 0) return;
    onConfirm(items);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-800">{product.name}</h2>
            <p className="text-sm text-slate-600">
              {product.batch_tracking ? "Select batch(es)" : "Select variation(s)"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-3xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {options.length === 0 ? (
            <div className="text-sm text-slate-600 text-center py-8">
              No {product.batch_tracking ? "batches" : "variations"} available
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.name} className="mb-3 last:mb-0">
                {showGroups && (
                  <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    {group.name}
                  </p>
                )}
                <div className="space-y-1.5">
                  {group.items.map((opt) => {
                    const isChecked = selected[opt.key] != null;
                    const outOfStock = !opt.stock || opt.stock <= 0;
                    return (
                      <div
                        key={opt.key}
                        onClick={() => !outOfStock && toggleOption(opt)}
                        className={`flex items-center gap-3 border rounded-xl px-3 py-2 ${isChecked ? "border-[#1a6b7a] bg-[#1a6b7a]/5" : "border-slate-200"
                          } ${outOfStock ? "opacity-50" : "cursor-pointer"}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={outOfStock}
                          onChange={() => toggleOption(opt)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 accent-[#1a6b7a] shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">
                            {opt.batch_number ? `Batch ${opt.batch_number}` : opt.variation_name}
                          </p>
                          <p className="text-sm text-slate-600">
                            Rs {(opt.price || 0).toFixed(2)} · Stock: {opt.stock ?? 0}
                            {opt.expiry_date
                              ? ` · Exp: ${new Date(opt.expiry_date).toLocaleDateString()}`
                              : ""}
                          </p>
                        </div>
                        {isChecked && (
                          <input
                            type="number"
                            min={1}
                            max={opt.stock || 1}
                            value={selected[opt.key]}
                            onChange={(e) => changeQty(opt, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-14 text-sm text-center border border-slate-300 rounded-lg py-1 outline-none shrink-0"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="text-sm px-4 py-2 rounded-full text-slate-500 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={selectedCount === 0}
            className="text-sm px-5 py-2 rounded-full bg-[#1a6b7a] text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#2699aa]"
          >
            Add {selectedCount > 0 ? `${selectedCount} item${selectedCount > 1 ? "s" : ""}` : ""} to cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductVariationModal;
