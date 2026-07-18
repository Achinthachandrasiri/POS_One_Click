import { useState, useEffect, useMemo, useRef } from 'react'

// ─────────────────────────────────────────────────────────────
// LINE TOTAL HELPERS — duplicated locally on purpose (matches the
// convention used by useCreateGRN.js / useEditGRN.js), always priced
// off the quoted price, never cost.
// ─────────────────────────────────────────────────────────────
export const calcLineTotal = (price, quantity, discount_type, discount_value) => {
  let total = (price || 0) * (quantity || 0)
  if (discount_type === 'percent' && discount_value) total -= total * (discount_value / 100)
  else if (discount_type === 'fixed' && discount_value) total -= discount_value
  return Math.max(total, 0)
}

export const num = (v) => (v === '' || v == null ? null : Number(v))

// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
export const C = {
  brand: '#1a6b7a',
  textPrimary: 'text-gray-900',
  labelText: 'text-gray-700',
  errorText: 'text-red-600'
}

// ─────────────────────────────────────────────────────────────
// SHARED PRIMITIVES
// ─────────────────────────────────────────────────────────────
export const Field = ({ label, error, required, hint, children, name }) => (
  <div className="flex flex-col gap-1.5" data-field-key={name || undefined}>
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

export const inputCls = (err) =>
  `border-2 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none w-full transition-colors ${err
    ? 'border-red-500 focus:border-red-600 bg-red-50'
    : `border-gray-300 focus:border-[#1a6b7a] ${C.textPrimary}`
  }`

export const selectCls = (err) => `${inputCls(err)} cursor-pointer`

export const Section = ({ title, icon, children, accent }) => (
  <div className={`bg-white border ${accent ? 'border-[#1a6b7a]' : 'border-gray-200'} rounded-2xl mb-4 shadow-sm overflow-hidden`}>
    <div className={`px-5 py-3 border-b ${accent ? 'bg-[#f0f9fb] border-[#c8e8ed]' : 'bg-gray-50 border-gray-100'} flex items-center gap-2`}>
      {icon && <i className={`fas fa-${icon} text-[#1a6b7a] text-sm`} />}
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</p>
    </div>
    <div className="p-5">{children}</div>
  </div>
)

// ─────────────────────────────────────────────────────────────
// Discount field
// ─────────────────────────────────────────────────────────────
export const DiscountField = ({ discountType, discountValue, onTypeChange, onValueChange, valueError, compact }) => {
  const hasDiscount = discountType !== 'none'
  const suffix = discountType === 'percent' ? '%' : discountType === 'fixed' ? 'Rs' : null
  return (
    <div className={`flex w-full border-2 ${compact ? 'py-[7.5px]' : ''} rounded-lg overflow-hidden transition-colors ${valueError ? 'border-red-500' : 'border-gray-300 focus-within:border-[#1a6b7a]'}`}>
      <select
        value={discountType}
        onChange={(e) => onTypeChange(e.target.value)}
        className={`flex-shrink-0 bg-gray-50 border-r-2 border-gray-200 text-xs font-medium text-gray-700 px-2 py-[9.5px] focus:outline-none cursor-pointer hover:bg-gray-100 ${hasDiscount ? 'w-[48%]' : 'w-full border-r-0'}`}
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
            className="w-full bg-white text-xs text-gray-900 px-2 py-1.5 focus:outline-none"
          />
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PRODUCT SEARCH BAR
// ─────────────────────────────────────────────────────────────
export const ProductSearchBar = ({ allProducts, onAdd, storeId, loadingProducts }) => {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const disabled = !storeId || loadingProducts

  const filtered = useMemo(() => {
    if (!query.trim()) return allProducts.slice(0, 50)
    const q = query.toLowerCase()
    return allProducts.filter((p) => {
      const brand = (typeof p.brand_id === 'object' ? p.brand_id?.name : '') || ''
      return p.name?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q) || brand.toLowerCase().includes(q)
    }).slice(0, 40)
  }, [query, allProducts])

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
                : 'Search product by name or code to quote…'
          }
          className={`flex-1 px-3 py-3 text-sm bg-transparent focus:outline-none placeholder-gray-400 ${disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-900'}`}
          autoComplete="off"
        />
        {query && !disabled && (
          <button type="button" onClick={() => { setQuery(''); setOpen(false) }} className="pr-4 text-gray-400 hover:text-gray-600">
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
              {filtered.map((p) => (
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
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {p.batch_tracking && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">BATCH</span>}
                    {p.structure === 'variable' && <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">VARIABLE</span>}
                    <span className="text-[10px] text-[#1a6b7a] font-bold opacity-0 group-hover:opacity-100 transition-opacity">+ Add</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// EXISTING BATCHES TABLE — checkboxes to select for quoting
// ─────────────────────────────────────────────────────────────
export const SelectableBatchRow = ({ batch, selected, quoted, onToggle, onQtyChange, onPriceChange, qtyError, priceError }) => {
  const expiry = batch.expiry_date ? new Date(batch.expiry_date) : null
  const expired = expiry && expiry < new Date()
  const outOfStock = (batch.stock ?? 0) <= 0

  return (
    <tr
      onClick={() => !outOfStock && onToggle(batch)}
      className={`border-b border-gray-100 last:border-0 transition-colors ${selected ? 'bg-[#f0f9fb]' : ''} ${outOfStock ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}`}
    >
      <td className="px-2 py-2 text-center" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={selected}
          disabled={outOfStock}
          onChange={() => onToggle(batch)}
          className="w-4 h-4 accent-[#1a6b7a] cursor-pointer disabled:cursor-not-allowed"
        />
      </td>
      <td className="px-2 py-2 font-mono font-semibold text-gray-800">{batch.batch_number}</td>
      <td className={`px-2 py-2 text-right font-bold ${outOfStock ? 'text-red-500' : batch.stock <= 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
        {batch.stock ?? 0}{outOfStock && <span className="block text-[9px] font-normal">out of stock</span>}
      </td>
      <td className={`px-2 py-2 text-center ${expired ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
        {expiry ? expiry.toLocaleDateString() : '—'}{expired && ' ⚠'}
      </td>
      <td className="px-2 py-2 w-24" onClick={(e) => e.stopPropagation()}>
        {selected ? (
          <div>
            <input
              type="number" min="1" max={batch.stock ?? undefined}
              value={quoted?.quantity ?? ''}
              onChange={(e) => onQtyChange(batch.batch_number, e.target.value)}
              placeholder="Qty"
              className={`${inputCls(qtyError)} text-xs py-1`}
            />
            {qtyError && <p className="text-[10px] text-red-500 mt-0.5">{qtyError}</p>}
          </div>
        ) : <span className="text-xs text-gray-300 block text-center">—</span>}
      </td>
      <td className="px-2 py-2 w-28" onClick={(e) => e.stopPropagation()}>
        {selected ? (
          <div>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">Rs</span>
              <input
                type="number" min="0" step="0.01"
                value={quoted?.price ?? ''}
                onChange={(e) => onPriceChange(batch.batch_number, e.target.value)}
                className={`${inputCls(priceError)} text-xs py-1 pl-6`}
              />
            </div>
            {priceError && <p className="text-[10px] text-red-500 mt-0.5">{priceError}</p>}
          </div>
        ) : <span className="text-xs text-gray-300 block text-center">—</span>}
      </td>
    </tr>
  )
}

// ─────────────────────────────────────────────────────────────
// PRODUCTS TABLE
// ─────────────────────────────────────────────────────────────
export const ProductsTable = ({ lines, onRemove, onChange, onToggleWholesale, onSelectVariation, onManageBatches, fieldErrors }) => {
  if (lines.length === 0) return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
      <i className="fas fa-file-invoice-dollar text-3xl mb-3 opacity-40" />
      <p className="text-sm font-medium">No products added yet</p>
      <p className="text-xs mt-1">Use the search bar above to add products to quote</p>
    </div>
  )

  return (
    <div className="border-2 border-gray-200 rounded-xl overflow-visible">
      <div className="grid grid-cols-12 gap-3 px-4 py-2.5 bg-white border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wide">
        <div className="col-span-3">Product</div>
        <div className="col-span-1">Variation</div>
        <div className="col-span-1 text-center">Stock</div>
        <div className="col-span-2 text-center">Price</div>
        <div className="col-span-1 text-center">Qty</div>
        <div className="col-span-2 text-center">Line total</div>
        <div className="col-span-1 text-center">Remove</div>
      </div>

      <style>{`
        .quo-product-rows { max-height: 280px; overflow-y: auto; scrollbar-width: none; -ms-overflow-style: none; }
        .quo-product-rows::-webkit-scrollbar { display: none; }
      `}</style>
      <div className="quo-product-rows rounded-b-xl">
        {lines.map((line, idx) => {
          const pp = `products[${idx}]`
          const isBatch = line.batch_tracking
          const isVariable = line.structure === 'variable'
          const lineTotal = !isBatch
            ? calcLineTotal(num(line.price), num(line.quantity), line.discount_type, num(line.discount_value))
            : line.batches.reduce((s, b) => s + calcLineTotal(num(b.price), num(b.quantity), b.discount_type, num(b.discount_value)), 0)
          const lineHasBatchError = isBatch && Object.keys(fieldErrors).some((k) => k.startsWith(`${pp}.batches`))
          const hasWholesale = !isBatch && line._wholesalePrice != null

          return (
            <div key={idx} className={`border-b border-gray-200 last:border-0 ${isBatch ? 'bg-blue-50/30' : 'bg-white'}`}>
              <div className="grid grid-cols-12 gap-3 px-4 py-3 items-center">
                {/* Product */}
                <div className="col-span-3 min-w-0" data-field-key={`${pp}.product_id`}>
                  <p className="text-sm font-semibold text-gray-900 truncate">{line.product_name}</p>
                  <p className="text-xs text-gray-400 font-mono">{line.product_code}</p>
                </div>

                {/* Variation */}
                <div className="col-span-1" data-field-key={`${pp}.variation_id`}>
                  {isVariable && !isBatch ? (
                    <div>
                      <select
                        value={line.variation_id}
                        onChange={(e) => onSelectVariation(idx, e.target.value)}
                        className={`${selectCls(fieldErrors[`${pp}.variation_id`])} text-xs py-1.5`}
                      >
                        <option value="">— pick —</option>
                        {line._variationOptions.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
                      </select>
                      {fieldErrors[`${pp}.variation_id`] && (
                        <p className="text-[10px] text-red-500 mt-0.5">{fieldErrors[`${pp}.variation_id`]}</p>
                      )}
                    </div>
                  ) : isBatch && isVariable ? (
                    <span className="text-xs text-gray-600 font-medium truncate block">{line.variation_name || '—'}</span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </div>

                {/* Stock */}
                <div className="col-span-1 text-center">
                  {isBatch ? (
                    <span className="text-xs text-gray-400">
                      {line.batches.reduce((s, b) => s + (b._availableStock || 0), 0) || '—'}
                    </span>
                  ) : line._existingStock !== null ? (
                    <span className={`text-sm font-bold ${line._existingStock <= 5 ? 'text-red-500' : 'text-emerald-600'}`}>
                      {line._existingStock}
                    </span>
                  ) : isVariable && !line.variation_id ? (
                    <span className="text-xs text-gray-400">—</span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </div>

                {/* Price / batch picker */}
                <div className="col-span-2" data-field-key={isBatch ? `${pp}.batches` : `${pp}.price`}>
                  {!isBatch ? (
                    <div>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-[11px]">Rs</span>
                        <input
                          type="number" min="0" step="0.01"
                          value={line.price}
                          onChange={(e) => onChange(idx, 'price', e.target.value)}
                          placeholder="0.00"
                          className={`${inputCls(fieldErrors[`${pp}.price`])} text-sm py-1.5 pl-7`}
                        />
                      </div>
                      {fieldErrors[`${pp}.price`] && <p className="text-[10px] text-red-500 mt-0.5">{fieldErrors[`${pp}.price`]}</p>}
                      {line.discount_type !== 'none' && (
                        <p className="text-[10px] text-emerald-600 font-medium mt-0.5 text-center" title="Discount carried from the product — cannot be changed here">
                          <i className="fas fa-tag text-[9px] mr-1" />
                          {line.discount_type === 'percent' ? `${line.discount_value || 0}% off` : `Rs ${line.discount_value || 0} off`}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <button
                        type="button"
                        onClick={() => onManageBatches(idx)}
                        className={`text-xs font-semibold hover:underline flex items-center gap-1 mx-auto ${lineHasBatchError ? 'text-red-600' : 'text-[#1a6b7a]'}`}
                      >
                        <i className={`fas ${lineHasBatchError ? 'fa-triangle-exclamation' : 'fa-layer-group'} text-[10px]`} />
                        {line.batches.length} batch{line.batches.length !== 1 ? 'es' : ''} selected
                      </button>
                      {lineHasBatchError && <p className="text-[10px] text-red-500 mt-0.5 text-center">{fieldErrors[`${pp}.batches`] || 'Fix batch details'}</p>}
                    </div>
                  )}
                </div>

                {/* Qty (non-batch only — batch qty lives per-batch in the modal) */}
                <div className="col-span-1" data-field-key={`${pp}.quantity`}>
                  {!isBatch ? (
                    <div>
                      <input
                        type="number" min="1"
                        value={line.quantity}
                        onChange={(e) => onChange(idx, 'quantity', e.target.value)}
                        placeholder="0"
                        className={`${inputCls(fieldErrors[`${pp}.quantity`])} text-sm py-1.5 text-center`}
                      />
                      {fieldErrors[`${pp}.quantity`] && <p className="text-[10px] text-red-500 mt-0.5 text-center">{fieldErrors[`${pp}.quantity`]}</p>}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 text-center block">
                      {line.batches.reduce((s, b) => s + (num(b.quantity) || 0), 0) || '—'}
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
                  <button type="button" onClick={() => onRemove(idx)} className="text-red-400 hover:text-red-600 transition-colors p-1" title="Remove product">
                    <i className="fas fa-trash text-sm" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// BATCH SELECT MODAL — pick from real existing batches to quote against
// ─────────────────────────────────────────────────────────────
export const BatchSelectModal = ({
  open, mode, productName, productCode, structure, variationOptions, singleExistingBatches,
  initialVariationId, initialBatches, onCancel, onSave, fieldErrors = {}, fieldKeyPrefix = ''
}) => {
  // selections: { [sectionKey]: { [batch_number]: quotedBatch } }
  // sectionKey is the variation _id for variable products, or 'single' otherwise.
  const [selections, setSelections] = useState({})
  const isVariable = structure === 'variable'

  useEffect(() => {
    if (!open) return
    const seed = {}
    if (mode === 'edit') {
      const key = isVariable ? (initialVariationId || '') : 'single'
      const batchMap = {}
      ;(initialBatches || []).forEach((b) => { batchMap[b.batch_number] = b })
      seed[key] = batchMap
    }
    setSelections(seed)
  }, [open, mode, initialVariationId, initialBatches, isVariable])

  const remappedBatchErrors = useMemo(() => {
    if (!fieldKeyPrefix) return {}
    const remapped = {}
    Object.keys(fieldErrors).forEach((key) => {
      if (key.startsWith(`${fieldKeyPrefix}.batches`)) remapped[key.replace(fieldKeyPrefix, 'products[0]')] = fieldErrors[key]
    })
    return remapped
  }, [fieldErrors, fieldKeyPrefix])

  if (!open) return null

  const sections = isVariable
    ? variationOptions
      .filter((v) => (v.batches || []).length > 0)
      .map((v) => ({ key: v._id, label: v.name, batches: v.batches || [] }))
    : [{ key: 'single', label: null, batches: singleExistingBatches || [] }]

  const toggleBatch = (sectionKey, batch) => {
    setSelections((prev) => {
      const current = { ...(prev[sectionKey] || {}) }
      if (current[batch.batch_number]) {
        delete current[batch.batch_number]
      } else {
        current[batch.batch_number] = {
          batch_number: batch.batch_number,
          quantity: '',
          price: batch.price ?? '',
          cost: batch.cost ?? '',
          discount_type: batch.discount_type || 'none',
          discount_value: batch.discount_value ?? '',
          expiry_date: batch.expiry_date || '',
          _availableStock: batch.stock ?? 0
        }
      }
      const next = { ...prev }
      if (Object.keys(current).length === 0) delete next[sectionKey]
      else next[sectionKey] = current
      return next
    })
  }

  const updateQty = (sectionKey, batchNumber, val) => setSelections((prev) => ({
    ...prev, [sectionKey]: { ...prev[sectionKey], [batchNumber]: { ...prev[sectionKey][batchNumber], quantity: val } }
  }))
  const updatePrice = (sectionKey, batchNumber, val) => setSelections((prev) => ({
    ...prev, [sectionKey]: { ...prev[sectionKey], [batchNumber]: { ...prev[sectionKey][batchNumber], price: val } }
  }))

  const errFor = (sectionKey, batchNumber, field) => {
    const list = Object.values(selections[sectionKey] || {})
    const idx = list.findIndex((b) => b.batch_number === batchNumber)
    return remappedBatchErrors[`products[0].batches[${idx}].${field}`]
  }

  // groups actually being submitted — one per section with at least one batch picked
  const groups = Object.entries(selections)
    .map(([key, batchMap]) => ({
      variationId: isVariable ? key : '',
      variationName: isVariable ? (variationOptions.find((v) => v._id === key)?.name || '') : '',
      batches: Object.values(batchMap)
    }))
    .filter((g) => g.batches.length > 0)

  const allSelected = groups.flatMap((g) => g.batches)
  const runningTotal = allSelected.reduce((s, b) => s + calcLineTotal(num(b.price), num(b.quantity), b.discount_type, num(b.discount_value)), 0)
  const canSave = groups.length > 0 && allSelected.every((b) =>
    num(b.quantity) > 0 && b.price !== '' && (b._availableStock == null || num(b.quantity) <= b._availableStock)
  )

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onMouseDown={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] overflow-y-auto" onMouseDown={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between sticky top-0 bg-white z-10">
          <div>
            <p className="text-[11px] font-bold text-[#1a6b7a] uppercase tracking-wider mb-0.5">
              {mode === 'edit' ? 'Edit selected batches' : 'Select batches to quote'}
            </p>
            <h3 className="text-lg font-bold text-gray-900">{productName}</h3>
            <p className="text-xs text-gray-400 font-mono">{productCode}</p>
            {isVariable && (
              <p className="text-[11px] text-gray-400 mt-1">
                <i className="fas fa-circle-info mr-1" />Tick batches from as many variations as you need — each becomes its own line.
              </p>
            )}
          </div>
          <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600 p-1">
            <i className="fas fa-times text-lg" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {sections.length === 0 ? (
            <p className="text-sm text-gray-400 italic py-4 text-center border-2 border-dashed border-gray-200 rounded-xl">
              No batches available for this product.
            </p>
          ) : (
            sections.map((section) => {
              const selectedCount = Object.keys(selections[section.key] || {}).length
              return (
                <div key={section.key}>
                  {section.label && (
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                        <i className="fas fa-layer-group text-gray-400" />{section.label}
                      </p>
                      {selectedCount > 0 && (
                        <span className="text-[10px] font-bold bg-[#e6f4f6] text-[#1a6b7a] px-2 py-0.5 rounded-full">
                          {selectedCount} selected
                        </span>
                      )}
                    </div>
                  )}
                  <div className="overflow-x-auto rounded-xl border-2 border-gray-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold text-xs">
                          <th className="px-2 py-2 w-10"></th>
                          <th className="text-left px-2 py-2">Batch #</th>
                          <th className="text-right px-2 py-2">Stock</th>
                          <th className="text-center px-2 py-2">Expiry</th>
                          <th className="text-center px-2 py-2">Qty to quote</th>
                          <th className="text-center px-2 py-2">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.batches.map((b) => (
                          <SelectableBatchRow
                            key={b.batch_number}
                            batch={b}
                            selected={!!selections[section.key]?.[b.batch_number]}
                            quoted={selections[section.key]?.[b.batch_number]}
                            onToggle={(batch) => toggleBatch(section.key, batch)}
                            onQtyChange={(batchNumber, val) => updateQty(section.key, batchNumber, val)}
                            onPriceChange={(batchNumber, val) => updatePrice(section.key, batchNumber, val)}
                            qtyError={errFor(section.key, b.batch_number, 'quantity')}
                            priceError={errFor(section.key, b.batch_number, 'price')}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })
          )}

          <div className="flex justify-end items-center gap-2">
            <span className="text-xs text-gray-500">Total across selected batches:</span>
            <span className="text-base font-bold text-[#1a6b7a]">
              Rs {runningTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
          <button type="button" onClick={onCancel} className="border-2 border-gray-300 text-gray-600 text-sm font-semibold px-5 py-2 rounded-xl hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={() => onSave(groups)}
            className="bg-[#1a6b7a] border-2 border-[#1a6b7a] text-white text-sm font-bold px-6 py-2 rounded-xl hover:bg-[#155f6d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <i className="fas fa-check" />{mode === 'edit' ? 'Save changes' : `Add ${groups.length > 1 ? `${groups.length} lines` : 'to quotation'}`}
          </button>
        </div>
      </div>
    </div>
  )
}
