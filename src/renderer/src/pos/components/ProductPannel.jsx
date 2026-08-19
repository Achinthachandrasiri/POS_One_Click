// ProductPannel.jsx
// Pure UI layout only. All state/handlers are passed in as props from usePosHooks via mainScreen.jsx.
// No logic lives here.

import { useState, useRef, useEffect } from "react";

// Normalizes option objects that may come in as { value, label } or { _id, name }
const optValue = (o) => o.value ?? o._id ?? '';
const optLabel = (o) => o.label ?? o.name ?? 'Unnamed';

// Searchable dropdown — used for brand/category, which can have long lists.
// Click to open, type to filter, click an option (or "All") to select.
const SearchableFilterSelect = ({ placeholder, value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selectedOption = options.find((o) => optValue(o) === value);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const filteredOptions = options.filter((o) =>
    optLabel(o).toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-full border shadow-sm outline-none min-w-[120px] max-w-[200px] text-left ${selectedOption
          ? "bg-[#1a6b7a] text-white font-medium border-[#1a6b7a]"
          : "bg-white text-slate-600 border-slate-300"
          }`}
      >
        <span className="truncate flex-1">
          {selectedOption ? optLabel(selectedOption) : placeholder}
        </span>
        {selectedOption && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              handleSelect(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
                handleSelect(null);
              }
            }}
            className="shrink-0 leading-none text-lg hover:opacity-70 cursor-pointer"
            aria-label={`Clear ${placeholder} filter`}
          >
            ×
          </span>
        )}
      </button>

      {open && (
        <div className="absolute z-20 top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${placeholder.toLowerCase()}...`}
            className="w-full text-sm px-3 py-2 border-b border-slate-100 outline-none"
          />
          <div className="max-h-48 overflow-y-auto">
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={`w-full text-left text-sm px-3 py-2 hover:bg-slate-50 ${!value ? "text-[#1a6b7a] font-medium" : "text-slate-600"
                }`}
            >
              All {placeholder.toLowerCase()}s
            </button>
            {filteredOptions.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-3">No matches</div>
            ) : (
              filteredOptions.map((o) => (
                <button
                  key={optValue(o)}
                  type="button"
                  onClick={() => handleSelect(optValue(o))}
                  className={`w-full text-left text-sm px-3 py-2 hover:bg-slate-50 truncate ${value === optValue(o) ? "text-[#1a6b7a] font-medium" : "text-slate-600"
                    }`}
                >
                  {optLabel(o)}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Products / Services tab toggle. Sits above the filter row so switching
// tabs doesn't shift the search bar's position.
const CatalogTabToggle = ({ activeTab, onChange }) => {
  const tabs = [
    { key: 'products', label: 'Products' },
    { key: 'services', label: 'Services' },
  ];

  return (
    <div className="inline-flex items-center bg-slate-100 rounded-full p-1 shrink-0 w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`text-sm px-4 py-1.5 rounded-full transition-colors ${activeTab === tab.key
            ? "bg-[#0f172a] text-white font-medium shadow-sm"
            : "text-slate-500 hover:text-slate-700"
            }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

const ProductPannel = ({
  searchTerm,
  onSearchChange,
  onScanInput,
  warehouseOptions = [],
  brandOptions = [],
  categoryOptions = [],
  supplierOptions = [],
  activeFilters,
  onFilterChange,
  products = [],
  productsLoading = false,
  productsError = null,
  onProductClick,
  catalogTab = 'products',
  onCatalogTabChange,
  services = [],
  servicesLoading = false,
  servicesError = null,
  onServiceClick,
}) => {
  const isServicesTab = catalogTab === 'services';

  const items = isServicesTab ? services : products;
  const itemsLoading = isServicesTab ? servicesLoading : productsLoading;
  const itemsError = isServicesTab ? servicesError : productsError;
  const onItemClick = isServicesTab ? onServiceClick : onProductClick;

  const hasActiveFilters = isServicesTab
    ? !!activeFilters?.category
    : !!(activeFilters?.warehouse || activeFilters?.brand || activeFilters?.category || activeFilters?.supplier);

  const clearFilters = () => {
    onFilterChange('category', null);
    if (!isServicesTab) {
      onFilterChange('warehouse', null);
      onFilterChange('brand', null);
      onFilterChange('supplier', null);
    }
  };

  return (
    <div className="p-3 border-r border-slate-200 h-full min-h-0 min-w-0 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        {/* Products / Services toggle */}
        <CatalogTabToggle activeTab={catalogTab} onChange={onCatalogTabChange} />

        {/* Scan / search bar */}
        <div className="flex items-center gap-2 border-2 border-slate-400 rounded-xl px-5 py-2.5 bg-slate-50 flex-1 min-w-0">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onScanInput(searchTerm);
            }}
            placeholder={isServicesTab ? "Search services" : "Search or scan product"}
            className="text-sm text-slate-700 placeholder:text-slate-400 flex-1 outline-none bg-transparent min-w-0"
          />
          <span className="text-[12px] text-slate-400 border border-slate-300 rounded px-1.5 shrink-0">
            F2
          </span>
        </div>
      </div>

      {/* Filter row — Category filter applies to both tabs; Brand/Supplier/
          Store only make sense for products (services have no store, brand,
          or supplier relationship), so they're hidden on the Services tab. */}
      <div className="flex items-center gap-1.5 mb-3 flex-wrap shrink-0">
        {!isServicesTab && (
          <SearchableFilterSelect
            placeholder="Store"
            value={activeFilters?.warehouse}
            options={warehouseOptions}
            onChange={(v) => onFilterChange('warehouse', v)}
          />
        )}
        {!isServicesTab && (
          <SearchableFilterSelect
            placeholder="Brand"
            value={activeFilters?.brand}
            options={brandOptions}
            onChange={(v) => onFilterChange('brand', v)}
          />
        )}
        <SearchableFilterSelect
          placeholder="Category"
          value={activeFilters?.category}
          options={categoryOptions}
          onChange={(v) => onFilterChange('category', v)}
        />
        {!isServicesTab && (
          <SearchableFilterSelect
            placeholder="Supplier"
            value={activeFilters?.supplier}
            options={supplierOptions}
            onChange={(v) => onFilterChange('supplier', v)}
          />
        )}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm px-3 py-2 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-200 shrink-0"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Grid - scrollable, always 4 equal columns, square cards, thin scrollbar on the left */}
      <div
        dir="rtl"
        className="grid grid-cols-4 gap-2 overflow-y-auto overflow-x-hidden flex-1 min-h-0 min-w-0 content-start auto-rows-min
          [&::-webkit-scrollbar]:w-0.5
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-slate-300
          [&::-webkit-scrollbar-thumb]:rounded-full
          hover:[&::-webkit-scrollbar-thumb]:bg-slate-400"
      >
        {itemsLoading ? (
          <div dir="ltr" className="col-span-4 text-xs text-slate-400 text-center py-6">
            {isServicesTab ? "Loading services..." : "Loading products..."}
          </div>
        ) : itemsError ? (
          <div dir="ltr" className="col-span-4 text-xs text-red-500 text-center py-6">
            {itemsError}
          </div>
        ) : items.length === 0 ? (
          <div dir="ltr" className="col-span-4 text-xs text-slate-400 text-center py-6">
            {isServicesTab ? "No services found" : "No products found"}
          </div>
        ) : (
          items.map((item) => (
            <button
              key={item._id}
              dir="ltr"
              onClick={() => onItemClick(item)}
              className="group relative aspect-square w-full min-w-0 flex flex-col text-left border border-slate-200 rounded-xl bg-white hover:border-[#2699aa] hover:shadow-md transition-all overflow-hidden"
            >
              {/* Image / icon area */}
              <div className="relative flex-1 min-h-0 bg-slate-50 overflow-hidden">
                {isServicesTab ? (
                  // Services have no image and no stock — show a wrench/service
                  // glyph in place of the product photo/qty badge combo.
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="w-8 h-8"
                    >
                      <path d="M14.7 6.3a4 4 0 0 1-5.34 5.34l-4.9 4.9a1.5 1.5 0 0 0 2.12 2.12l4.9-4.9a4 4 0 0 1 5.34-5.34l-2.83 2.83-1.42-1.42 2.83-2.83z" />
                    </svg>
                  </div>
                ) : item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="w-8 h-8"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                  </div>
                )}

                {/* Qty badge — products only. Services have no stock concept, so
                    no badge is shown for them (real unit symbol for measurable
                    products, e.g. kg/L; falls back to "Qty" otherwise). */}
                {!isServicesTab && (
                  <span className="absolute top-1.5 right-1.5 text-[12px] font-medium bg-[#0f172a] text-slate-100 rounded-full px-2 py-0.5 shadow-sm">
                    {item.qty ?? item.stock_qty ?? 0} {item.unit_id?.symbol || item.unit_symbol || 'Qty'}
                  </span>
                )}
              </div>

              {/* Details footer */}
              <div className="shrink-0 px-2 py-1.5 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-700 leading-snug line-clamp-2 break-words">
                  {item.name}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11px] text-slate-600 truncate">
                    {item.code || item.sku || "—"}
                  </span>
                  <span className="text-sm font-semibold text-[#1a6b7a] shrink-0">
                    Rs {(item.price || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductPannel;
