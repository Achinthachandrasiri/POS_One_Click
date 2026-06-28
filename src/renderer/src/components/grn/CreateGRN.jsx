import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

// ─────────────────────────────────────────────────────────────
// INITIAL STATE SHAPES
// ─────────────────────────────────────────────────────────────
const initialBatch = (defaults = {}) => ({
  batch_number: '',
  cost: defaults.cost ?? '',
  price: defaults.price ?? '',
  discount_type: 'none',
  discount_value: '',
  quantity: '',
  expiry_date: ''
})

// ─────────────────────────────────────────────────────────────
// A product line added to the GRN table
// ─────────────────────────────────────────────────────────────
const initialProductLine = (product, variation = null, batches = []) => {
  const isVariable = product.structure === 'variable'
  const isBatch = product.batch_tracking

  const singleVar = !isVariable ? product.variations?.[0] : null
  const targetVar = variation || singleVar

  const existingStock = targetVar && !isBatch ? (targetVar.stock ?? 0) : null
  const existingBatches = targetVar && isBatch ? (targetVar.batches || []) : []

  return {
    product_id: product._id,
    product_name: product.name,
    product_code: product.code,
    structure: product.structure,
    batch_tracking: isBatch,
    variation_id: variation?._id || '',
    variation_name: variation?.name || '',
    _variationOptions: isVariable
      ? product.variations.map((v) => ({
        _id: v._id,
        name: v.name,
        stock: v.stock,
        batches: v.batches,
        cost: v.cost,
        price: v.price
      }))
      : [],

    _existingStock: existingStock,
    _existingBatches: existingBatches,

    cost: !isBatch ? (targetVar?.cost ?? '') : '',
    price: !isBatch ? (targetVar?.price ?? '') : '',

    quantity: '',
    batches: isBatch ? batches : [],
    wholesale_enabled: false
  }
}

// ─────────────────────────────────────────────────────────────
// Initial Form
// ─────────────────────────────────────────────────────────────
const initialForm = () => ({
  store_id: '',
  supplier_id: '',
  date: new Date().toISOString().slice(0, 10),
  invoice_number: '',
  payment_status: 'unpaid',
  payment_type: 'cash',
  cheque_details: { cheque_number: '', due_date: '', holder_name: '' },
  products: []
})

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
const C = {
  brand: '#1a6b7a',
  textPrimary: 'text-gray-900',
  labelText: 'text-gray-700',
  errorText: 'text-red-600'
}

// ─────────────────────────────────────────────────────────────
// SHARED PRIMITIVES
// ─────────────────────────────────────────────────────────────
const Field = ({ label, error, required, hint, children }) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label className={`text-xs font-semibold ${C.labelText} flex items-center gap-1`}>
        {label}
        {required && <span className="text-red-500 text-sm leading-none">*</span>}
      </label>
    )}
    {hint && <p className="text-xs text-gray-400 -mt-1">{hint}</p>}
    {children}
    {error && (
      <p className={`text-xs font-medium ${C.errorText} flex items-center gap-1`}>
        <i className="fas fa-exclamation-circle text-[11px]" />{error}
      </p>
    )}
  </div>
)

// ─────────────────────────────────────────────────────────────
// Input class
// ─────────────────────────────────────────────────────────────
const inputCls = (err) =>
  `border-2 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none w-full transition-colors ${err
    ? 'border-red-500 focus:border-red-600 bg-red-50'
    : `border-gray-300 focus:border-[#1a6b7a] ${C.textPrimary}`
  }`

// ─────────────────────────────────────────────────────────────
// Select class
// ─────────────────────────────────────────────────────────────
const selectCls = (err) => `${inputCls(err)} cursor-pointer`

// ─────────────────────────────────────────────────────────────
// Sections
// ─────────────────────────────────────────────────────────────
const Section = ({ title, icon, children, accent }) => (
  <div className={`bg-white border ${accent ? 'border-[#1a6b7a]' : 'border-gray-200'} rounded-2xl mb-4 shadow-sm overflow-hidden`}>
    <div className={`px-5 py-3 border-b ${accent ? 'bg-[#f0f9fb] border-[#c8e8ed]' : 'bg-gray-50 border-gray-100'} flex items-center gap-2`}>
      {icon && <i className={`fas fa-${icon} text-[#1a6b7a] text-sm`} />}
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</p>
    </div>
    <div className="p-5">{children}</div>
  </div>
)

// ─────────────────────────────────────────────────────────────
// Dicount Feild
// ─────────────────────────────────────────────────────────────
const DiscountField = ({ discountType, discountValue, onTypeChange, onValueChange, valueError }) => {
  const hasDiscount = discountType !== 'none'
  const suffix = discountType === 'percent' ? '%' : discountType === 'fixed' ? 'Rs' : null
  return (
    <Field label="Discount" error={valueError}>
      <div className={`flex w-full border-2 rounded-lg overflow-hidden transition-colors ${valueError ? 'border-red-500' : 'border-gray-300 focus-within:border-[#1a6b7a]'}`}>
        <select
          value={discountType}
          onChange={(e) => onTypeChange(e.target.value)}
          className={`flex-shrink-0 bg-gray-50 border-r-2 border-gray-200 text-xs font-medium text-gray-700 px-2 py-2 focus:outline-none cursor-pointer hover:bg-gray-100 ${hasDiscount ? 'w-[48%]' : 'w-full border-r-0'}`}
        >
          <option value="none">No discount</option>
          <option value="percent">Percent (%)</option>
          <option value="fixed">Fixed (Rs)</option>
        </select>
        {hasDiscount && (
          <div className="flex items-center flex-1 relative">
            {suffix && <span className="pl-2 text-gray-400 text-xs font-medium flex-shrink-0 select-none">{suffix}</span>}
            <input
              type="number" min="0"
              max={discountType === 'percent' ? 100 : undefined}
              step={discountType === 'percent' ? '1' : '0.01'}
              value={discountValue}
              onChange={(e) => onValueChange(e.target.value)}
              placeholder={discountType === 'percent' ? '0' : '0.00'}
              className="w-full bg-white text-xs text-gray-900 px-2 py-2 focus:outline-none"
            />
          </div>
        )}
      </div>
    </Field>
  )
}

// ─────────────────────────────────────────────────────────────
// LINE TOTAL HELPER
// ─────────────────────────────────────────────────────────────
const calcLineTotal = (cost, quantity, discount_type, discount_value) => {
  let total = (cost || 0) * (quantity || 0)
  if (discount_type === 'percent' && discount_value) total -= total * (discount_value / 100)
  else if (discount_type === 'fixed' && discount_value) total -= discount_value
  return Math.max(total, 0)
}

const num = (v) => (v === '' || v == null ? null : Number(v))

// ─────────────────────────────────────────────────────────────
// PRODUCT SEARCH BAR (shared, sits above the table)
// ─────────────────────────────────────────────────────────────
const ProductSearchBar = ({ allProducts, onAdd, storeId, loadingProducts }) => {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const disabled = !storeId || loadingProducts

  const filtered = useMemo(() => {
    if (!query.trim()) return allProducts.slice(0, 50)
    const q = query.toLowerCase()
    return allProducts.filter((p) => {
      const brand = (typeof p.brand_id === 'object' ? p.brand_id?.name : '') || ''
      const supplier = (typeof p.supplier_id === 'object' ? p.supplier_id?.name : '') || ''
      return (
        p.name?.toLowerCase().includes(q) ||
        p.code?.toLowerCase().includes(q) ||
        brand.toLowerCase().includes(q) ||
        supplier.toLowerCase().includes(q)
      )
    }).slice(0, 40)
  }, [query, allProducts])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const select = (product) => {
    onAdd(product)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <div className={`flex items-center border-2 rounded-xl overflow-hidden transition-colors shadow-sm ${disabled ? 'border-gray-200 bg-gray-50 cursor-not-allowed' : 'border-gray-300 focus-within:border-[#1a6b7a] bg-white'
        }`}>
        <span className="pl-4 text-gray-400 flex-shrink-0">
          {loadingProducts
            ? <i className="fas fa-spinner fa-spin text-[#1a6b7a] text-base" />
            : <i className={`fas fa-search text-base ${disabled ? 'text-gray-300' : 'text-gray-400'}`} />
          }
        </span>
        <input
          type="text"
          value={query}
          disabled={disabled}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => { if (!disabled) setOpen(true) }}
          placeholder={
            !storeId
              ? 'Select a store first to search products…'
              : loadingProducts
                ? 'Loading products…'
                : 'Search product by name, code, brand or supplier to add…'
          }
          className={`flex-1 px-3 py-3 text-sm bg-transparent focus:outline-none placeholder-gray-400 ${disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-900'
            }`}
          autoComplete="off"
        />
        {query && !disabled && (
          <button type="button" onClick={() => { setQuery(''); setOpen(false) }}
            className="pr-4 text-gray-400 hover:text-gray-600">
            <i className="fas fa-times text-sm" />
          </button>
        )}
      </div>

      {open && !disabled && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-white border-2 border-[#1a6b7a]/20 rounded-xl shadow-2xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="px-4 py-4 text-sm text-gray-400 text-center">
              <i className="fas fa-box-open mr-2" />No products found
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
              {filtered.map((p) => {
                const brand = (typeof p.brand_id === 'object' ? p.brand_id?.name : '') || ''
                const supplier = (typeof p.supplier_id === 'object' ? p.supplier_id?.name : '') || ''
                return (
                  <button
                    key={p._id}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); select(p) }}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#f0f9fb] transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 truncate">{p.name}</span>
                        <span className="text-xs text-gray-400 font-mono flex-shrink-0">{p.code}</span>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-3 mt-0.5">
                        {brand && <span><i className="fas fa-tag mr-1 text-[10px] text-gray-400" />{brand}</span>}
                        {supplier && <span><i className="fas fa-truck mr-1 text-[10px] text-gray-400" />{supplier}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {p.batch_tracking && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">BATCH</span>
                      )}
                      {p.structure === 'variable' && (
                        <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">VARIABLE</span>
                      )}
                      <span className="text-[10px] text-[#1a6b7a] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        + Add
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// BATCH INPUT ROW (inside expanded batch section)
// ─────────────────────────────────────────────────────────────
const BatchInputRow = ({ batch, bIdx, prodIdx, onChange, onRemove, canRemove, fieldErrors, existingBatches = [] }) => {
  const bp = `products[${prodIdx}].batches[${bIdx}]`
  const u = (key, val) => onChange(prodIdx, bIdx, key, val)

  // Fill batch number (and optionally cost/price) from an existing batch
  const fillFromExisting = (batchNumber) => {
    const found = existingBatches.find((b) => b.batch_number === batchNumber)
    u('batch_number', batchNumber)
    if (found) {
      if (found.cost != null && found.cost !== '') u('cost', found.cost)
      if (found.price != null && found.price !== '') u('price', found.price)
    }
  }

  return (
    <div className="grid grid-cols-12 gap-2 items-start py-2 border-b border-gray-100 last:border-0">
      {/* Batch # */}
      <div className="col-span-2">
        {existingBatches.length > 0 ? (
          <div className="flex flex-col gap-1">
            <input
              type="text"
              list={`batch-list-${prodIdx}-${bIdx}`}
              value={batch.batch_number}
              onChange={(e) => fillFromExisting(e.target.value)}
              placeholder="Batch # or pick↓"
              className={`${inputCls(fieldErrors[`${bp}.batch_number`])} text-sm py-1.5`}
            />
            <datalist id={`batch-list-${prodIdx}-${bIdx}`}>
              {existingBatches.map((b) => (
                <option key={b.batch_number} value={b.batch_number}>
                  {b.batch_number} (stock: {b.stock ?? 0})
                </option>
              ))}
            </datalist>
          </div>
        ) : (
          <input
            type="text"
            value={batch.batch_number}
            onChange={(e) => u('batch_number', e.target.value)}
            placeholder="Batch #"
            className={`${inputCls(fieldErrors[`${bp}.batch_number`])} text-sm py-1.5`}
          />
        )}
        {fieldErrors[`${bp}.batch_number`] && (
          <p className="text-[12px] text-red-500 mt-0.5">{fieldErrors[`${bp}.batch_number`]}</p>
        )}
      </div>
      {/* Qty */}
      <div className="col-span-2">
        <input
          type="number"
          min="0"   // ← Enforce positive
          value={batch.quantity}
          onChange={(e) => u('quantity', e.target.value)}
          placeholder="Qty"
          className={`${inputCls(fieldErrors[`${bp}.quantity`])} text-sm py-1.5`}
        />
        {fieldErrors[`${bp}.quantity`] && (
          <p className="text-[12px] text-red-500 mt-0.5">{fieldErrors[`${bp}.quantity`]}</p>
        )}
      </div>
      {/* Cost */}
      <div className="col-span-2">
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-[11px]">Rs</span>
          <input
            type="number" min="0" step="0.01"
            value={batch.cost}
            onChange={(e) => u('cost', e.target.value)}
            placeholder="0.00"
            className={`${inputCls(fieldErrors[`${bp}.cost`])} text-sm py-1.5 pl-7`}
          />
        </div>
        {fieldErrors[`${bp}.cost`] && (
          <p className="text-[12px] text-red-500 mt-0.5">{fieldErrors[`${bp}.cost`]}</p>
        )}
      </div>
      {/* Price */}
      <div className="col-span-2">
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-[11px]">Rs</span>
          <input
            type="number" min="0" step="0.01"
            value={batch.price}
            onChange={(e) => u('price', e.target.value)}
            placeholder="0.00"
            className={`${inputCls(fieldErrors[`${bp}.price`])} text-sm py-1.5 pl-7`}
          />
        </div>
        {fieldErrors[`${bp}.price`] && (
          <p className="text-[10px] text-red-500 mt-0.5">{fieldErrors[`${bp}.price`]}</p>
        )}
      </div>
      {/* Expiry */}
      <div className="col-span-2">
        <input
          type="date"
          value={batch.expiry_date}
          onChange={(e) => u('expiry_date', e.target.value)}
          className={`${inputCls(false)} text-sm py-1.2`}
        />
      </div>
      {/* Discount */}
      <div className="col-span-2">
        <div className={`flex w-full border-2 py-[3.5px] rounded-lg overflow-hidden transition-colors ${fieldErrors[`${bp}.discount_value`] ? 'border-red-500' : 'border-gray-300 focus-within:border-[#1a6b7a]'}`}>
          <select
            value={batch.discount_type}
            onChange={(e) => u('discount_type', e.target.value)}
            className="bg-gray-50 border-r border-gray-200 text-[13px] font-medium text-gray-700 px-1.5 py-1.5 focus:outline-none cursor-pointer w-[55%]"
          >
            <option value="none">None</option>
            <option value="percent">%</option>
            <option value="fixed">Rs</option>
          </select>
          {batch.discount_type !== 'none' ? (
            <input
              type="number" min="0"
              value={batch.discount_value}
              onChange={(e) => u('discount_value', e.target.value)}
              placeholder="0"
              className="w-full text-[11px] text-gray-900 px-2 py-1.5 focus:outline-none bg-white"
            />
          ) : (
            <span className="flex-1 px-2 py-1.5 text-[12px] text-gray-300 select-none">—</span>
          )}
        </div>
        {fieldErrors[`${bp}.discount_value`] && (
          <p className="text-[10px] text-red-500 mt-0.5">{fieldErrors[`${bp}.discount_value`]}</p>
        )}
      </div>
      {/* Remove */}
      <div className="col-span-1 flex items-center justify-center pt-0.5">
        {canRemove ? (
          <button
            type="button"
            onClick={() => onRemove(prodIdx, bIdx)}
            className="text-red-400 hover:text-red-600 transition-colors p-1"
            title="Remove batch"
          >
            <i className="fas fa-trash text-sm" />
          </button>
        ) : (
          <span className="w-6" />
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// EXISTING BATCHES MINI TABLE (read-only)
// ─────────────────────────────────────────────────────────────
const ExistingBatchesTable = ({ batches }) => {
  if (!batches || batches.length === 0) return (
    <p className="text-xs text-gray-400 italic py-1">No existing batches.</p>
  )
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 mt-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold">
            <th className="text-left px-2 py-1.5">Batch #</th>
            <th className="text-right px-2 py-1.5">Stock</th>
            <th className="text-right px-2 py-1.5">Price</th>
            <th className="text-center px-2 py-1.5">Expiry</th>
            <th className="text-center px-2 py-1.5">Status</th>
          </tr>
        </thead>
        <tbody>
          {batches.map((b, i) => {
            const expiry = b.expiry_date ? new Date(b.expiry_date) : null
            const expired = expiry && expiry < new Date()
            return (
              <tr key={i} className="border-b border-gray-100 last:border-0">
                <td className="px-2 py-1.5 font-mono font-semibold text-gray-800">{b.batch_number}</td>
                <td className={`px-2 py-1.5 text-right font-bold ${b.stock <= 5 ? 'text-red-500' : 'text-emerald-600'}`}>{b.stock ?? '-'}</td>
                <td className="px-2 py-1.5 text-right text-gray-600">Rs {(b.price ?? 0).toLocaleString()}</td>
                <td className={`px-2 py-1.5 text-center ${expired ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                  {expiry ? expiry.toLocaleDateString() : '—'}{expired && ' ⚠'}
                </td>
                <td className="px-2 py-1.5 text-center">
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${b.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {b.status || 'active'}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PRODUCTS TABLE
// ─────────────────────────────────────────────────────────────
const ProductsTable = ({
  lines, onRemove, onChange, onSelectVariation,
  onManageBatches, fieldErrors
}) => {
  const scrollRef = useRef(null)
  const rowRefs = useRef([])
  const [focusedIdx, setFocusedIdx] = useState(null)

  const handleKeyDown = (e) => {
    if (!['ArrowDown', 'ArrowUp'].includes(e.key)) return
    // Only hijack arrow keys when not inside an input/select
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return
    e.preventDefault()
    const total = lines.length
    if (total === 0) return
    const next = e.key === 'ArrowDown'
      ? (focusedIdx === null ? 0 : Math.min(focusedIdx + 1, total - 1))
      : (focusedIdx === null ? total - 1 : Math.max(focusedIdx - 1, 0))
    setFocusedIdx(next)
    rowRefs.current[next]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }

  if (lines.length === 0) return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
      <i className="fas fa-boxes-stacked text-3xl mb-3 opacity-40" />
      <p className="text-sm font-medium">No products added yet</p>
      <p className="text-xs mt-1">Use the search bar above to add products</p>
    </div>
  )

  return (
    <div
      className="border-2 border-gray-200 rounded-xl overflow-visible focus:outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Table header — sticky, never scrolls */}
      <div className="grid grid-cols-12 gap-3 px-4 py-2.5 bg-white border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wide">
        <div className="col-span-3">Product</div>
        <div className="col-span-1">Variation</div>
        <div className="col-span-2 text-center">Current stock</div>
        <div className="col-span-2 text-center">Cost</div>
        <div className="col-span-1 text-center">New qty</div>
        <div className="col-span-2 text-center">Line total</div>
        <div className="col-span-1 text-center">Remove</div>
      </div>

      {/* Scrollable rows — mouse-wheel scrollable, no visible scrollbar */}
      <style>{`
        .grn-product-rows { max-height: 260px; overflow-y: auto; scrollbar-width: none; -ms-overflow-style: none; }
        .grn-product-rows::-webkit-scrollbar { display: none; }
      `}</style>
      <div ref={scrollRef} className="grn-product-rows rounded-b-xl">
        {/* Rows */}
        {lines.map((line, idx) => {
          const pp = `products[${idx}]`
          const isBatch = line.batch_tracking
          const isVariable = line.structure === 'variable'
          const lineTotal = !isBatch
            ? calcLineTotal(num(line.cost), num(line.quantity), line.discount_type, num(line.discount_value))
            : line.batches.reduce((s, b) => s + calcLineTotal(num(b.cost), num(b.quantity), b.discount_type, num(b.discount_value)), 0)

          return (
            <div
              key={idx}
              ref={(el) => { rowRefs.current[idx] = el }}
              onClick={() => setFocusedIdx(idx)}
              className={`border-b border-gray-200 last:border-0 cursor-default transition-colors ${focusedIdx === idx ? 'ring-2 ring-inset ring-[#1a6b7a]/30 bg-[#f0f9fb]' : isBatch ? 'bg-blue-50/30' : 'bg-white'
                }`}
            >
              {/* Main row */}
              <div className="grid grid-cols-12 gap-3 px-4 py-3 items-center">
                {/* Product name + code */}
                <div className="col-span-3 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{line.product_name}</p>
                      <p className="text-xs text-gray-400 font-mono">{line.product_code}</p>
                    </div>
                  </div>
                  {fieldErrors[`${pp}.product_id`] && (
                    <p className="text-[10px] text-red-500 mt-0.5">{fieldErrors[`${pp}.product_id`]}</p>
                  )}
                </div>

                {/* Variation select */}
                <div className="col-span-1">
                  {isVariable ? (
                    <div>
                      <select
                        value={line.variation_id}
                        onChange={(e) => onSelectVariation(idx, e.target.value)}
                        className={`${selectCls(fieldErrors[`${pp}.variation_id`])} text-xs py-1.5`}
                      >
                        <option value="">— pick —</option>
                        {line._variationOptions.map((v) => (
                          <option key={v._id} value={v._id}>{v.name}</option>
                        ))}
                      </select>
                      {fieldErrors[`${pp}.variation_id`] && (
                        <p className="text-[10px] text-red-500 mt-0.5">{fieldErrors[`${pp}.variation_id`]}</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </div>

                {/* Current stock */}
                <div className="col-span-2 text-center">
                  {isBatch ? (
                    <button
                      type="button"
                      onClick={() => onManageBatches(idx)}
                      className="text-xs font-semibold text-[#1a6b7a] hover:underline flex items-center gap-1 mx-auto"
                    >
                      <i className="fas fa-layer-group text-[10px]" />
                      {line._existingBatches?.length || 0} batch{line._existingBatches?.length !== 1 ? 'es' : ''}
                    </button>
                  ) : line._existingStock !== null ? (
                    <span className={`text-sm font-bold ${line._existingStock <= 5 ? 'text-red-500' : 'text-emerald-600'}`}>
                      {line._existingStock}
                      {line._existingStock <= 5 && <span className="text-[10px] font-normal text-red-400 ml-1">low</span>}
                    </span>
                  ) : isVariable && !line.variation_id ? (
                    <span className="text-xs text-gray-400">select var.</span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </div>

                {/* Cost (only for non-batch products — batch lines capture cost per batch below) */}
                <div className="col-span-2">
                  {!isBatch ? (
                    <div>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-[11px]">Rs</span>
                        <input
                          type="number" min="0" step="0.01"
                          value={line.cost}
                          onChange={(e) => onChange(idx, 'cost', e.target.value)}
                          placeholder="0.00"
                          className={`${inputCls(fieldErrors[`${pp}.cost`])} text-sm py-1.5 pl-7`}
                        />
                      </div>
                      {fieldErrors[`${pp}.cost`] && (
                        <p className="text-[10px] text-red-500 mt-0.5">{fieldErrors[`${pp}.cost`]}</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 text-center block">per batch</span>
                  )}
                </div>

                {/* Quantity (only for non-batch products) */}
                <div className="col-span-1">
                  {!isBatch ? (
                    <div>
                      <input
                        type="number" min="1"
                        value={line.quantity}
                        onChange={(e) => onChange(idx, 'quantity', e.target.value)}
                        placeholder="0"
                        className={`${inputCls(fieldErrors[`${pp}.quantity`])} text-sm py-1.5 text-center`}
                      />
                      {fieldErrors[`${pp}.quantity`] && (
                        <p className="text-[10px] text-red-500 mt-0.5 text-center">{fieldErrors[`${pp}.quantity`]}</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 text-center block">
                      {line.batches.reduce((s, b) => s + (num(b.quantity) || 0), 0) || '—'} (batches)
                    </span>
                  )}
                </div>

                {/* Line total */}
                <div className="col-span-2 text-center">
                  <span className="text-sm font-bold text-[#1a6b7a]">
                    Rs {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Remove */}
                <div className="col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => onRemove(idx)}
                    className="text-red-400 hover:text-red-600 transition-colors p-1"
                    title="Remove product"
                  >
                    <i className="fas fa-trash text-sm" />
                  </button>
                </div>
              </div>

              {/* Batch section — expanded for batch-tracked products */}
              {isBatch && line._batchExpanded && (
                <div className="px-4 pb-4">
                  {/* Existing batches (read-only) */}
                  {line._existingBatches?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                        <i className="fas fa-history text-gray-400" />Existing batches (read-only)
                      </p>
                      <ExistingBatchesTable batches={line._existingBatches} />
                    </div>
                  )}

                  {/* New batches to receive */}
                  <div className="bg-white border-2 border-[#2699aa] rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-[#2699aa] uppercase tracking-wide flex items-center gap-1.5">
                        <i className="fas fa-plus-circle text-[#2699aa]" />Batches to receive
                      </p>
                      {line._existingBatches?.length > 0 && (
                        <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 flex items-center gap-1">
                          <i className="fas fa-lightbulb text-[9px]" />
                          Pick an existing batch # to restock it
                        </span>
                      )}
                    </div>

                    {/* Batch column headers */}
                    <div className="grid grid-cols-12 gap-2 px-0 pb-1 text-[12px] font-bold text-gray-500 uppercase tracking-wide">
                      <div className="col-span-2">Batch #*</div>
                      <div className="col-span-2">Qty*</div>
                      <div className="col-span-2">Cost*</div>
                      <div className="col-span-2">Price*</div>
                      <div className="col-span-2">Expiry</div>
                      <div className="col-span-2">Discount</div>
                      <div className="col-span-1"></div>
                    </div>

                    {fieldErrors[`${pp}.batches`] && (
                      <p className="text-xs text-red-500 mb-2 flex items-center gap-1">
                        <i className="fas fa-exclamation-circle text-[11px]" />{fieldErrors[`${pp}.batches`]}
                      </p>
                    )}

                    {line.batches.map((batch, bIdx) => (
                      <BatchInputRow
                        key={bIdx}
                        batch={batch}
                        bIdx={bIdx}
                        prodIdx={idx}
                        onChange={onBatchChange}
                        onRemove={onRemoveBatch}
                        canRemove={line.batches.length > 1}
                        fieldErrors={fieldErrors}
                        existingBatches={line._existingBatches || []}
                      />
                    ))}

                    <button
                      type="button"
                      onClick={() => onAddBatch(idx)}
                      className="mt-2 text-sm font-semibold text-[#2699aa] hover:text-[#1a3d4d] flex items-center gap-1.5"
                    >
                      <i className="fas fa-plus" />Add another batch
                    </button>

                    {/* Batch line total */}
                    {lineTotal > 0 && (
                      <div className="mt-2 pt-2 border-t border-amber-100 flex justify-end">
                        <span className="text-xs text-gray-500">Line total: </span>
                        <span className="text-xs font-bold text-[#1a6b7a] ml-1">
                          Rs {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>{/* end scroll wrapper */}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// BATCH ENTRY MODAL — popup for receiving batches on a batch-tracked product
// ─────────────────────────────────────────────────────────────
const BatchEntryModal = ({ open, mode, productName, productCode, structure, variationOptions, singleExistingBatches, initialVariationId, initialBatches, onCancel, onSave
}) => {
  const [variationId, setVariationId] = useState(initialVariationId || '')
  const [batches, setBatches] = useState(initialBatches?.length ? initialBatches : [initialBatch()])

  // Most recent existing batch's cost/price — used to pre-fill a fresh batch row
  const latestBatchDefaults = (batchList) => {
    if (!batchList || batchList.length === 0) return { cost: '', price: '' }
    const last = batchList[batchList.length - 1]
    return { cost: last.cost ?? '', price: last.price ?? '' }
  }

  // Reset on open: restore an in-progress edit as-is, or seed a fresh add with last-known cost/price
  useEffect(() => {
    if (!open) return
    setVariationId(initialVariationId || '')
    if (initialBatches?.length) {
      setBatches(initialBatches)
    } else if (structure !== 'variable') {
      setBatches([initialBatch(latestBatchDefaults(singleExistingBatches))])
    } else {
      setBatches([initialBatch()])
    }
  }, [open, initialVariationId, initialBatches, structure, singleExistingBatches])

  // Variable structure: once a variation is picked, seed cost/price from that variation's
  // most recent batch — only while the first row is still untouched
  useEffect(() => {
    if (!open || structure !== 'variable' || !variationId || mode !== 'create') return
    setBatches((prev) => {
      if (prev.length !== 1) return prev
      const row = prev[0]
      const pristine = !row.batch_number && row.cost === '' && row.price === '' && row.quantity === ''
      if (!pristine) return prev
      const variation = variationOptions.find((v) => v._id === variationId)
      const defaults = latestBatchDefaults(variation?.batches)
      return [{ ...row, cost: defaults.cost, price: defaults.price }]
    })
  }, [variationId, open, structure, mode, variationOptions])

  if (!open) return null

  const isVariable = structure === 'variable'
  const selectedVariation = variationOptions.find((v) => v._id === variationId)
  const existingBatches = isVariable ? (selectedVariation?.batches || []) : (singleExistingBatches || [])
  const readyForBatches = !isVariable || !!variationId

  const updateBatch = (idx, key, val) => {
    setBatches((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [key]: val }
      return next
    })
  }
  // Carry the previous row's cost/price forward — batches on the same invoice are usually priced the same
  const addRow = () => setBatches((prev) => {
    const last = prev[prev.length - 1]
    return [...prev, initialBatch({ cost: last?.cost, price: last?.price })]
  })
  const removeRow = (idx) => setBatches((prev) => prev.filter((_, i) => i !== idx))

  const runningTotal = batches.reduce(
    (s, b) => s + calcLineTotal(num(b.cost), num(b.quantity), b.discount_type, num(b.discount_value)), 0
  )

  const canSave =
    readyForBatches &&
    batches.length > 0 &&
    batches.every((b) => b.batch_number.trim() && num(b.quantity) > 0 && b.cost !== '' && b.price !== '')

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onMouseDown={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[88vh] overflow-y-auto"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between sticky top-0 bg-white z-10">
          <div>
            <p className="text-[11px] font-bold text-[#1a6b7a] uppercase tracking-wider mb-0.5">
              {mode === 'edit' ? 'Edit batches' : 'Receive batches'}
            </p>
            <h3 className="text-lg font-bold text-gray-900">{productName}</h3>
            <p className="text-xs text-gray-400 font-mono">{productCode}</p>
          </div>
          <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600 p-1">
            <i className="fas fa-times text-lg" />
          </button>
        </div>

        <div className="px-6 py-5">
          {/* Variation picker — variable structure only */}
          {isVariable && (
            <div className="mb-5 max-w-xs">
              <Field label="Variation" required hint="Choose which variation this stock belongs to">
                <select
                  value={variationId}
                  onChange={(e) => setVariationId(e.target.value)}
                  className={selectCls(false)}
                >
                  <option value="">Select a variation…</option>
                  {variationOptions.map((v) => (
                    <option key={v._id} value={v._id}>{v.name}</option>
                  ))}
                </select>
              </Field>
            </div>
          )}

          {/* Existing batches reference */}
          {readyForBatches && (
            <div className="mb-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <i className="fas fa-history text-gray-400" />Existing batches (read-only)
              </p>
              <ExistingBatchesTable batches={existingBatches} />
            </div>
          )}

          {/* New batch rows */}
          <div className={`bg-[#f7fcfd] border-2 border-[#2699aa] rounded-xl p-3 transition-opacity ${!readyForBatches ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-[#2699aa] uppercase tracking-wide flex items-center gap-1.5">
                <i className="fas fa-plus-circle text-[#2699aa]" />Batches to receive
              </p>
              {existingBatches.length > 0 && (
                <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 flex items-center gap-1">
                  <i className="fas fa-lightbulb text-[9px]" />
                  Type or pick an existing batch # to restock it
                </span>
              )}
            </div>
            <div className="grid grid-cols-12 gap-2 px-0 pb-1 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
              <div className="col-span-2">Batch #*</div>
              <div className="col-span-2">Qty*</div>
              <div className="col-span-2">Cost*</div>
              <div className="col-span-2">Price*</div>
              <div className="col-span-2">Expiry</div>
              <div className="col-span-2">Discount</div>
              <div className="col-span-1"></div>
            </div>
            {batches.map((batch, bIdx) => (
              <BatchInputRow
                key={bIdx}
                batch={batch}
                bIdx={bIdx}
                prodIdx={0}
                onChange={(_, idx2, key, val) => updateBatch(idx2, key, val)}
                onRemove={(_, idx2) => removeRow(idx2)}
                canRemove={batches.length > 1}
                fieldErrors={{}}
                existingBatches={existingBatches}
              />
            ))}
            <button
              type="button"
              onClick={addRow}
              className="mt-2 text-sm font-semibold text-[#2699aa] hover:text-[#1a3d4d] flex items-center gap-1.5"
            >
              <i className="fas fa-plus" />Add another batch
            </button>
          </div>

          <div className="mt-4 flex justify-end items-center gap-2">
            <span className="text-xs text-gray-500">Batch line total:</span>
            <span className="text-base font-bold text-[#1a6b7a]">
              Rs {runningTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
          <button
            type="button"
            onClick={onCancel}
            className="border-2 border-gray-300 text-gray-600 text-sm font-semibold px-5 py-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={() => onSave(variationId, selectedVariation?.name || '', batches)}
            className="bg-[#1a6b7a] border-2 border-[#1a6b7a] text-white text-sm font-bold px-6 py-2 rounded-xl hover:bg-[#155f6d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <i className="fas fa-check" />{mode === 'edit' ? 'Save changes' : 'Add to GRN'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
const CreateGRN = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm())
  const [allProducts, setAllProducts] = useState([])
  const [dropdowns, setDropdowns] = useState({ stores: [], suppliers: [] })
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [batchModal, setBatchModal] = useState(null)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loading, setLoading] = useState(false)

  // ── load stores + suppliers on mount ──
  useEffect(() => {
    const load = async () => {
      try {
        const [storesRes, suppliersRes] = await Promise.all([
          window.api.store.getAll(),
          window.api.supplier.getAll()
        ])
        setDropdowns({
          stores: storesRes?.stores || storesRes?.data || [],
          suppliers: suppliersRes?.suppliers || suppliersRes?.data || []
        })
      } catch (e) {
        console.error('Failed to load GRN dropdowns', e)
      }
    }
    load()
  }, [])

  // ── fetch products whenever store changes ──
  useEffect(() => {
    if (!form.store_id) {
      setAllProducts([])
      return
    }
    const load = async () => {
      setLoadingProducts(true)
      try {
        const res = await window.api.product.getByStore(form.store_id)
        const all = res?.products || res?.data || []
        setAllProducts(all.filter((p) => p.status === 'active'))
      } catch (e) {
        console.error('Failed to load products for store', e)
        setAllProducts([])
      } finally {
        setLoadingProducts(false)
      }
    }
    load()
  }, [form.store_id])

  // ── top-level field update ──
  const updateForm = (key, val) => {
    setForm((prev) => ({
      ...prev,
      [key]: val,
      // clear added products when store changes so stale lines don't persist
      ...(key === 'store_id' ? { products: [] } : {})
    }))
    if (fieldErrors[key]) setFieldErrors((prev) => { const e = { ...prev }; delete e[key]; return e })
  }

  const updateCheque = (key, val) => {
    setForm((prev) => ({ ...prev, cheque_details: { ...prev.cheque_details, [key]: val } }))
    const errKey = `cheque_details.${key}`
    if (fieldErrors[errKey]) setFieldErrors((prev) => { const e = { ...prev }; delete e[errKey]; return e })
  }

  // ── add product from search ──
  const handleAddProduct = (product) => {
    const alreadyAdded = form.products.some(
      (l) => l.product_id === product._id && product.structure === 'single'
    )
    if (alreadyAdded) return

    if (product.batch_tracking) {
      const isVariable = product.structure === 'variable'
      setBatchModal({
        mode: 'create',
        lineIdx: null,
        product,
        structure: product.structure,
        productName: product.name,
        productCode: product.code,
        variationOptions: isVariable
          ? product.variations.map((v) => ({ _id: v._id, name: v.name, stock: v.stock, batches: v.batches }))
          : [],
        singleExistingBatches: !isVariable ? (product.variations?.[0]?.batches || []) : [],
        variationId: '',
        batches: [initialBatch()]
      })
      return
    }

    const newLine = initialProductLine(product)
    setForm((prev) => ({ ...prev, products: [...prev.products, newLine] }))
  }

  // ── remove product line ──
  const removeProductLine = (idx) => {
    setForm((prev) => ({ ...prev, products: prev.products.filter((_, i) => i !== idx) }))
    setFieldErrors((prev) => {
      const e = { ...prev }
      Object.keys(e).forEach((k) => { if (k.startsWith(`products[${idx}]`)) delete e[k] })
      return e
    })
  }

  // ── update any field on a product line ──
  const updateProductLine = (idx, key, val) => {
    setForm((prev) => {
      const lines = [...prev.products]
      lines[idx] = { ...lines[idx], [key]: val }
      return { ...prev, products: lines }
    })
    const errKey = `products[${idx}].${key}`
    if (fieldErrors[errKey]) setFieldErrors((prev) => { const e = { ...prev }; delete e[errKey]; return e })
  }

  // ── variation selection ──
  const onSelectVariation = (idx, variationId) => {
    setForm((prev) => {
      const lines = [...prev.products]
      const opt = lines[idx]._variationOptions.find((v) => v._id === variationId)
      const isBatch = lines[idx].batch_tracking
      lines[idx] = {
        ...lines[idx],
        variation_id: variationId,
        variation_name: opt?.name || '',
        _existingStock: !isBatch ? (opt?.stock ?? 0) : null,
        _existingBatches: isBatch ? (opt?.batches || []) : [],
        // Auto-fill cost & price from the selected variation (non-batch only)
        ...(!isBatch && opt ? { cost: opt.cost ?? '', price: opt.price ?? '' } : {})
      }
      return { ...prev, products: lines }
    })
    const errKey = `products[${idx}].variation_id`
    if (fieldErrors[errKey]) setFieldErrors((prev) => { const e = { ...prev }; delete e[errKey]; return e })
  }


  const openManageBatches = (idx) => {
    const line = form.products[idx]
    setBatchModal({
      mode: 'edit',
      lineIdx: idx,
      product: null,
      structure: line.structure,
      productName: line.product_name,
      productCode: line.product_code,
      variationOptions: line._variationOptions,
      singleExistingBatches: line.structure === 'single' ? line._existingBatches : [],
      variationId: line.variation_id,
      batches: line.batches.length ? line.batches : [initialBatch()]
    })
  }

  const closeBatchModal = () => setBatchModal(null)

  const handleBatchModalSave = (variationId, variationName, batches) => {
    if (batchModal.mode === 'create') {
      const isVariable = batchModal.structure === 'variable'
      const variation = isVariable
        ? batchModal.product.variations.find((v) => v._id === variationId)
        : null
      const newLine = initialProductLine(batchModal.product, variation, batches)
      setForm((prev) => ({ ...prev, products: [...prev.products, newLine] }))
    } else {
      setForm((prev) => {
        const lines = [...prev.products]
        const idx = batchModal.lineIdx
        const isVariable = lines[idx].structure === 'variable'
        const opt = isVariable ? lines[idx]._variationOptions.find((v) => v._id === variationId) : null
        lines[idx] = {
          ...lines[idx],
          ...(isVariable ? {
            variation_id: variationId,
            variation_name: opt?.name || variationName,
            _existingBatches: opt?.batches || []
          } : {}),
          batches
        }
        return { ...prev, products: lines }
      })
    }
    setBatchModal(null)
  }

  // ── live grand total ──
  const grandTotal = useMemo(() => {
    return form.products.reduce((sum, line) => {
      if (!line.batch_tracking) {
        return sum + calcLineTotal(num(line.cost), num(line.quantity), line.discount_type, num(line.discount_value))
      }
      return sum + line.batches.reduce(
        (bSum, b) => bSum + calcLineTotal(num(b.cost), num(b.quantity), b.discount_type, num(b.discount_value)),
        0
      )
    }, 0)
  }, [form.products])

  // ── submit ──
  const handleSubmit = async () => {
    setError('')
    setLoading(true)

    const payload = {
      store_id: form.store_id,
      supplier_id: form.supplier_id,
      date: form.date,
      invoice_number: form.invoice_number,
      payment_status: form.payment_status,
      payment_type: form.payment_type,
      cheque_details: form.payment_type === 'cheque' ? form.cheque_details : null,
      products: form.products.map((line) => ({
        product_id: line.product_id,
        product_name: line.product_name,
        structure: line.structure,
        variation_id: line.structure === 'variable' ? line.variation_id : null,
        variation_name: line.structure === 'variable' ? line.variation_name : null,
        batch_tracking: line.batch_tracking,
        wholesale_enabled: line.wholesale_enabled,
        // Non-batch: only quantity — cost/price come from existing product data on the server
        cost: !line.batch_tracking ? num(line.cost) : null,
        price: !line.batch_tracking ? null : null,
        quantity: !line.batch_tracking ? num(line.quantity) : null,
        discount_type: 'none',
        discount_value: null,
        batches: line.batch_tracking
          ? line.batches.map((b) => ({
            batch_number: b.batch_number,
            cost: num(b.cost),
            price: num(b.price),
            quantity: num(b.quantity),
            discount_type: b.discount_type,
            discount_value: b.discount_type !== 'none' ? num(b.discount_value) : null,
            expiry_date: b.expiry_date || null
          }))
          : []
        // UI-only fields (_variationOptions, _existingStock, etc.) intentionally omitted
      }))
    }

    try {
      const res = await window.api.grn.create(payload)
      if (res?.success) {
        navigate('/dashboard/grn')
      } else {
        if (res?.fieldErrors) setFieldErrors(res.fieldErrors)
        if (res?.error) setError(res.error)
      }
    } catch (e) {
      console.error('GRN create failed', e)
      setError('Something went wrong while creating the GRN. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-full px-8 pt-8 pb-0 overflow-hidden">
      <div className="flex flex-col h-[630px]">

        {/* Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-[880px] h-[780px] bg-[#2699aa] opacity-40 rounded-full right-[-200px] bottom-[-200px]" />
          <div className="absolute w-[580px] h-[580px] bg-[#30aabb] opacity-25 rounded-full right-[-120px] bottom-[-120px]" />
          <div className="absolute w-[420px] h-[420px] bg-[#2699aa] opacity-30 rounded-full left-[-80px] top-[-80px]" />
        </div>

        {/* Title */}
        <div className="relative z-10 mb-5">
          <h1 className="text-white text-[22px] font-semibold m-0">Stock In</h1>
          <p className="text-[#90bcc4] text-[15px] mt-1">Enter stock details to create a new GRN</p>
        </div>

        {/* Card */}
        <div
          className="relative z-10 bg-white w-full px-10 py-10 shadow-xl rounded-t-[20px] overflow-auto"
          style={{ height: 'calc(100% - 70px)' }}
        >
          {error && (
            <div className="mb-5 bg-red-50 border-2 border-red-400 text-red-700 text-sm font-medium px-4 py-3 rounded-xl flex items-start gap-2">
              <i className="fas fa-exclamation-triangle mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ── GRN details ── */}
          <Section title="GRN details" icon="file-invoice">
            <div className="grid grid-cols-4 gap-2">
              <Field label="Store" required error={fieldErrors.store_id}>
                <select value={form.store_id} onChange={(e) => updateForm('store_id', e.target.value)} className={selectCls(fieldErrors.store_id)}>
                  <option value="">Select store</option>
                  {dropdowns.stores.map((s) => <option key={s._id} value={s._id}>{s.storeName || s.name}</option>)}
                </select>
              </Field>
              <Field label="Supplier" required error={fieldErrors.supplier_id}>
                <select value={form.supplier_id} onChange={(e) => updateForm('supplier_id', e.target.value)} className={selectCls(fieldErrors.supplier_id)}>
                  <option value="">Select supplier</option>
                  {dropdowns.suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </Field>
              <Field label="Invoice number" required error={fieldErrors.invoice_number}>
                <input
                  type="text"
                  value={form.invoice_number}
                  onChange={(e) => updateForm('invoice_number', e.target.value)}
                  placeholder="e.g. INV-2026-0042"
                  className={inputCls(fieldErrors.invoice_number)}
                />
              </Field>
              <Field label="Date" required error={fieldErrors.date}>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => updateForm('date', e.target.value)}
                  className={inputCls(fieldErrors.date)}
                />
              </Field>
            </div>
          </Section>

          {/* ── Products ── */}
          <Section title="Products received" icon="boxes-stacked" accent>
            {/* Shared product search bar */}
            <div className="mb-4">
              <ProductSearchBar allProducts={allProducts} onAdd={handleAddProduct} storeId={form.store_id} loadingProducts={loadingProducts} />
              {fieldErrors.products && (
                <p className="text-xs font-medium text-red-600 flex items-center gap-1 mt-2">
                  <i className="fas fa-exclamation-circle text-[11px]" />{fieldErrors.products}
                </p>
              )}
            </div>

            {/* Product table */}
            <ProductsTable
              lines={form.products}
              onRemove={removeProductLine}
              onChange={updateProductLine}
              onSelectVariation={onSelectVariation}
              onManageBatches={openManageBatches}
              fieldErrors={fieldErrors}
            />
          </Section>

          {/* ── Payment ── */}
          <Section title="Payment" icon="money-bill-wave">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Field label="Payment status" required error={fieldErrors.payment_status}>
                <select value={form.payment_status} onChange={(e) => updateForm('payment_status', e.target.value)} className={selectCls(fieldErrors.payment_status)}>
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                </select>
              </Field>
              <Field label="Payment type" required error={fieldErrors.payment_type}>
                <select value={form.payment_type} onChange={(e) => updateForm('payment_type', e.target.value)} className={selectCls(fieldErrors.payment_type)}>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="cheque">Cheque</option>
                </select>
              </Field>
            </div>
            {form.payment_type === 'cheque' && (
              <div className="grid grid-cols-3 gap-4 pt-3 border-t border-dashed border-gray-200">
                <Field label="Cheque number" required error={fieldErrors['cheque_details.cheque_number']}>
                  <input type="text" value={form.cheque_details.cheque_number}
                    onChange={(e) => updateCheque('cheque_number', e.target.value)}
                    placeholder="e.g. 000123" className={inputCls(fieldErrors['cheque_details.cheque_number'])} />
                </Field>
                <Field label="Due date" required error={fieldErrors['cheque_details.due_date']}>
                  <input type="date" value={form.cheque_details.due_date}
                    onChange={(e) => updateCheque('due_date', e.target.value)}
                    className={inputCls(fieldErrors['cheque_details.due_date'])} />
                </Field>
                <Field label="Holder name" required error={fieldErrors['cheque_details.holder_name']}>
                  <input type="text" value={form.cheque_details.holder_name}
                    onChange={(e) => updateCheque('holder_name', e.target.value)}
                    placeholder="e.g. John Doe" className={inputCls(fieldErrors['cheque_details.holder_name'])} />
                </Field>
              </div>
            )}
          </Section>

          {/* ── Summary ── */}
          <Section title="Summary" icon="calculator">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-gray-600">Grand total</span>
                <p className="text-xs text-gray-400 mt-0.5">Based on batch-tracked product costs. Non-batch lines use existing product cost.</p>
              </div>
              <span className="text-lg font-bold text-[#1a6b7a]">
                Rs {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </Section>

          <BatchEntryModal
            open={!!batchModal}
            mode={batchModal?.mode}
            productName={batchModal?.productName}
            productCode={batchModal?.productCode}
            structure={batchModal?.structure}
            variationOptions={batchModal?.variationOptions || []}
            singleExistingBatches={batchModal?.singleExistingBatches || []}
            initialVariationId={batchModal?.variationId}
            initialBatches={batchModal?.batches}
            onCancel={closeBatchModal}
            onSave={handleBatchModalSave}
          />

          {/* ── Action buttons ── */}
          <div className="flex justify-end gap-3 pt-2 pb-6">
            <button
              type="button"
              onClick={() => navigate('/dashboard/grn')}
              className="border-2 border-gray-300 text-gray-600 text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="bg-[#1a6b7a] border-2 border-[#1a6b7a] text-white text-sm font-bold px-8 py-2.5 rounded-xl hover:bg-[#155f6d] disabled:opacity-60 transition-colors flex items-center gap-2"
            >
              {loading ? (
                <><i className="fas fa-spinner fa-spin" /> Saving…</>
              ) : (
                <><i className="fas fa-save" /> Save GRN</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateGRN
