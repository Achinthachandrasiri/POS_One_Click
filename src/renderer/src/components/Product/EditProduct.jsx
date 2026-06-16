import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProductHooks } from '../../hooks/productHooks'
import { useVariationHooks } from '../../hooks/variationHooks'

const initialBatch = () => ({
  _id: undefined,
  batch_number: '',
  price: '',
  cost: '',
  stock: '',
  discount_type: 'none',
  discount_value: '',
  wholesale_price: '',
  wholesale_min_qty: '',
  expiry_date: '',
  grn_id: null
})

const initialVariation = (isSingle = true) => ({
  _id: undefined,
  name: isSingle ? 'Default' : '',
  price: '',
  cost: '',
  stock: '',
  discount_type: 'none',
  discount_value: '',
  wholesale_price: '',
  wholesale_min_qty: '',
  batches: [initialBatch()]
})

const initialForm = () => ({
  name: '',
  code: '',
  brand_id: '',
  category_id: '',
  supplier_id: '',
  store_id: '',
  product_type: 'quantity',
  unit_id: '',
  structure: 'single',
  batch_tracking: false,
  variations: [initialVariation(true)],
  tax: '',
  stock_alert: '',
  wholesale_enabled: false,
  wholesale_price: '',
  wholesale_min_qty: '',
  status: 'active',
  image: null
})

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
const C = {
  brand: '#1a6b7a',
  brandLight: '#f0f9fb',
  brandMid: '#2699aa',
  textPrimary: 'text-gray-900',
  textSecondary: 'text-gray-600',
  textMuted: 'text-gray-500',
  labelText: 'text-gray-700',
  sectionBg: 'bg-white',
  pageBg: 'bg-[#f0f4f6]',
  border: 'border-gray-300',
  borderFocus: 'focus:border-[#1a6b7a]',
  errorBorder: 'border-red-500',
  errorText: 'text-red-600',
  cardBorder: 'border-gray-200',
}

// ─────────────────────────────────────────────────────────────
// SHARED PRIMITIVES
// ─────────────────────────────────────────────────────────────

const Field = ({ label, error, required, hint, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className={`text-sm font-semibold ${C.labelText} flex items-center gap-1`}>
      {label}
      {required && <span className="text-red-500 text-base leading-none">*</span>}
    </label>
    {hint && <p className="text-xs text-gray-500 -mt-1">{hint}</p>}
    {children}
    {error && (
      <p className={`text-xs font-medium ${C.errorText} flex items-center gap-1`}>
        <i className="fas fa-exclamation-circle text-[11px]" />{error}
      </p>
    )}
  </div>
)

const inputCls = (err) =>
  `border-2 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none w-full transition-colors ${err
    ? 'border-red-500 focus:border-red-600 bg-red-50'
    : `border-gray-300 focus:border-[#1a6b7a] ${C.textPrimary}`
  }`

const selectCls = (err) =>
  `${inputCls(err)} cursor-pointer`

/** Section card */
const Section = ({ title, icon, children, accent }) => (
  <div className={`bg-white border ${accent ? 'border-[#1a6b7a]' : 'border-gray-200'} rounded-2xl mb-4 shadow-sm overflow-hidden`}>
    <div className={`px-5 py-3 border-b ${accent ? 'bg-[#f0f9fb] border-[#c8e8ed]' : 'bg-gray-50 border-gray-100'} flex items-center gap-2`}>
      {icon && <i className={`fas fa-${icon} text-[#1a6b7a] text-sm`} />}
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</p>
    </div>
    <div className="p-5">{children}</div>
  </div>
)

/** Toggle switch (read-only variant) */
const Toggle = ({ enabled, onChange, label, description, readOnly }) => (
  <div className="flex items-center justify-between gap-4">
    <div>
      <p className={`text-sm font-semibold ${C.labelText}`}>{label}</p>
      {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
    </div>
    <button
      type="button"
      onClick={() => !readOnly && onChange(!enabled)}
      aria-pressed={enabled}
      disabled={readOnly}
      className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#1a6b7a] focus:ring-offset-1 ${enabled ? 'bg-[#1a6b7a]' : 'bg-gray-300'
        } ${readOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'
          }`}
      />
    </button>
  </div>
)

/** Read-only info row */
const ReadOnlyField = ({ label, value, icon }) => (
  <div className="flex flex-col gap-1.5">
    <label className={`text-sm font-semibold ${C.labelText}`}>{label}</label>
    <div className="border-2 border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-100 text-gray-600 flex items-center gap-2">
      {icon && <i className={`fas fa-${icon} text-gray-400 text-xs`} />}
      <span className="capitalize">{value}</span>
    </div>
  </div>
)

// ─────────────────────────────────────────────────────────────
// WHOLESALE FIELDS BLOCK
// ─────────────────────────────────────────────────────────────
const WholesaleFields = ({ priceVal, minQtyVal, onPriceChange, onMinQtyChange, priceError, minQtyError }) => (
  <div className="grid grid-cols-2 gap-3 pt-3 mt-3 border-t border-dashed border-gray-200">
    <div className="col-span-2">
      <p className="text-xs font-bold text-[#1a6b7a] uppercase tracking-wide mb-2 flex items-center gap-1.5">
        <i className="fas fa-tags text-[11px]" /> Wholesale pricing
        <span className="text-gray-400 font-normal normal-case tracking-normal">(optional)</span>
      </p>
    </div>
    <Field label="Wholesale price" error={priceError} hint="Leave blank to use product-level wholesale">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">Rs</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={priceVal}
          onChange={(e) => onPriceChange(e.target.value)}
          placeholder="0.00"
          className={`${inputCls(priceError)} pl-9`}
        />
      </div>
    </Field>
    <Field label="Min. qty for wholesale" error={minQtyError} hint="Minimum units to qualify">
      <input
        type="number"
        min="1"
        step="1"
        value={minQtyVal}
        onChange={(e) => onMinQtyChange(e.target.value)}
        placeholder="e.g. 12"
        className={inputCls(minQtyError)}
      />
    </Field>
  </div>
)

// ─────────────────────────────────────────────────────────────
// DISCOUNT FIELD
// ─────────────────────────────────────────────────────────────
const DiscountField = ({ discountType, discountValue, onTypeChange, onValueChange, valueError }) => {
  const hasDiscount = discountType !== 'none'
  const suffix = discountType === 'percent' ? '%' : discountType === 'fixed' ? 'Rs' : null

  return (
    <Field label="Discount" error={valueError}>
      <div className={`flex w-full border-2 rounded-lg overflow-hidden transition-colors ${valueError ? 'border-red-500' : 'border-gray-300 focus-within:border-[#1a6b7a]'
        }`}>
        <select
          value={discountType}
          onChange={(e) => onTypeChange(e.target.value)}
          className={`flex-shrink-0 bg-gray-50 border-r-2 border-gray-200 text-sm font-medium text-gray-700 px-3 py-2.5 focus:outline-none cursor-pointer transition-colors hover:bg-gray-100 ${hasDiscount ? 'w-[44%]' : 'w-full border-r-0'
            }`}
        >
          <option value="none">No discount</option>
          <option value="percent">Percentage (%)</option>
          <option value="fixed">Fixed amount</option>
        </select>

        {hasDiscount && (
          <div className="flex items-center flex-1 relative">
            {suffix && (
              <span className="pl-3 text-gray-400 text-sm font-medium flex-shrink-0 select-none">
                {suffix}
              </span>
            )}
            <input
              type="number"
              min="0"
              max={discountType === 'percent' ? 100 : undefined}
              step={discountType === 'percent' ? '1' : '0.01'}
              value={discountValue}
              onChange={(e) => onValueChange(e.target.value)}
              placeholder={discountType === 'percent' ? '0' : '0.00'}
              className={`w-full bg-white text-sm text-gray-900 px-2 py-2.5 focus:outline-none ${suffix ? '' : 'pl-3'
                }`}
            />
          </div>
        )}
      </div>
    </Field>
  )
}

// ─────────────────────────────────────────────────────────────
// BATCH CARD
// ─────────────────────────────────────────────────────────────
const BatchCard = ({ batch, batchIdx, varIdx, onChange, onRemove, canRemove, fieldErrors }) => {
  const bp = `variations[${varIdx}].batches[${batchIdx}]`
  const u = (key, val) => onChange(varIdx, batchIdx, key, val)

  const expiryWarning = (() => {
    if (!batch.expiry_date) return null
    const diff = (new Date(batch.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
    if (diff < 0) return 'expired'
    if (diff <= 30) return 'soon'
    return null
  })()

  return (
    <div className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50 mb-3 hover:border-[#1a6b7a]/40 transition-colors">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#1a6b7a] text-white flex items-center justify-center text-xs font-bold">
            {batchIdx + 1}
          </div>
          <span className="text-sm font-bold text-gray-700">
            {batch.batch_number?.trim() || `Batch ${batchIdx + 1}`}
          </span>
          {expiryWarning === 'expired' && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">EXPIRED</span>
          )}
          {expiryWarning === 'soon' && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">EXPIRING SOON</span>
          )}
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(varIdx, batchIdx)}
            className="text-red-500 hover:text-red-700 text-xs px-3 py-1.5 rounded-lg hover:bg-red-50 border border-red-200 font-medium transition-colors"
          >
            <i className="fas fa-trash mr-1.5" />Remove
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <Field label="Batch number" required error={fieldErrors[`${bp}.batch_number`]}>
          <input
            type="text"
            value={batch.batch_number}
            onChange={(e) => u('batch_number', e.target.value)}
            placeholder="e.g. BATCH-001"
            className={inputCls(fieldErrors[`${bp}.batch_number`])}
          />
        </Field>
        <Field label="Stock quantity" required error={fieldErrors[`${bp}.stock`]}>
          <input
            type="number"
            min="0"
            value={batch.stock}
            onChange={(e) => u('stock', e.target.value)}
            placeholder="0"
            className={inputCls(fieldErrors[`${bp}.stock`])}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <Field label="Retail (selling) price" required error={fieldErrors[`${bp}.price`]}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">Rs</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={batch.price}
              onChange={(e) => u('price', e.target.value)}
              placeholder="0.00"
              className={`${inputCls(fieldErrors[`${bp}.price`])} pl-9`}
            />
          </div>
        </Field>
        <Field label="Cost price" required error={fieldErrors[`${bp}.cost`]}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">Rs</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={batch.cost}
              onChange={(e) => u('cost', e.target.value)}
              placeholder="0.00"
              className={`${inputCls(fieldErrors[`${bp}.cost`])} pl-9`}
            />
          </div>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <Field label="Expiry date">
          <input
            type="date"
            value={batch.expiry_date}
            onChange={(e) => u('expiry_date', e.target.value)}
            className={inputCls(false)}
          />
        </Field>
        <DiscountField
          discountType={batch.discount_type}
          discountValue={batch.discount_value}
          onTypeChange={(val) => u('discount_type', val)}
          onValueChange={(val) => u('discount_value', val)}
          valueError={fieldErrors[`${bp}.discount_value`]}
        />
      </div>

      <WholesaleFields
        priceVal={batch.wholesale_price}
        minQtyVal={batch.wholesale_min_qty}
        onPriceChange={(val) => u('wholesale_price', val)}
        onMinQtyChange={(val) => u('wholesale_min_qty', val)}
        priceError={fieldErrors[`${bp}.wholesale_price`]}
        minQtyError={fieldErrors[`${bp}.wholesale_min_qty`]}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// VARIATION CARD
// ─────────────────────────────────────────────────────────────
const VariationCard = ({
  variation, varIdx, isSingle, batchTracking, hasSelectedTypes,
  onVariationChange, onBatchChange, onAddBatch, onRemoveBatch, onRemoveVariation,
  canRemoveVariation, fieldErrors
}) => {
  const vp = `variations[${varIdx}]`
  const upd = (key, val) => onVariationChange(varIdx, key, val)

  return (
    <div className="border-2 border-gray-200 rounded-2xl mb-4 overflow-hidden hover:border-[#1a6b7a]/50 transition-colors">
      <div className="bg-[#f0f9fb] px-5 py-3 flex justify-between items-center border-b border-[#d0edf2]">
        <div className="flex items-center gap-2">
          <i className="fas fa-cube text-[#1a6b7a] text-sm" />
          <span className="text-sm font-bold text-[#1a6b7a]">
            {isSingle ? 'Stock & Pricing' : (variation.name?.trim() || `Variation ${varIdx + 1}`)}
          </span>
        </div>
        {!isSingle && canRemoveVariation && (
          <button
            type="button"
            onClick={() => onRemoveVariation(varIdx)}
            className="text-red-500 hover:text-red-700 text-xs px-3 py-1.5 rounded-lg hover:bg-red-50 border border-red-200 font-medium transition-colors"
          >
            <i className="fas fa-trash mr-1.5" />Remove
          </button>
        )}
      </div>

      <div className="p-5">
        {!isSingle && !hasSelectedTypes ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-700 text-sm flex items-center gap-2">
            <i className="fas fa-info-circle" />
            <span>Select at least one variation type above to enter variation details.</span>
          </div>
        ) : (
          <>
            {!isSingle && <div className=""></div>}

            {!batchTracking && (
              <>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <Field label="Retail price" required error={fieldErrors[`${vp}.price`]}>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">Rs</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={variation.price}
                        onChange={(e) => upd('price', e.target.value)}
                        placeholder="0.00"
                        className={`${inputCls(fieldErrors[`${vp}.price`])} pl-9`}
                      />
                    </div>
                  </Field>
                  <Field label="Cost price" required error={fieldErrors[`${vp}.cost`]}>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">Rs</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={variation.cost}
                        onChange={(e) => upd('cost', e.target.value)}
                        placeholder="0.00"
                        className={`${inputCls(fieldErrors[`${vp}.cost`])} pl-9`}
                      />
                    </div>
                  </Field>
                  <Field label="Stock quantity" required error={fieldErrors[`${vp}.stock`]}>
                    <input
                      type="number"
                      min="0"
                      value={variation.stock}
                      onChange={(e) => upd('stock', e.target.value)}
                      placeholder="0"
                      className={inputCls(fieldErrors[`${vp}.stock`])}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <DiscountField
                    discountType={variation.discount_type}
                    discountValue={variation.discount_value}
                    onTypeChange={(val) => upd('discount_type', val)}
                    onValueChange={(val) => upd('discount_value', val)}
                    valueError={fieldErrors[`${vp}.discount_value`]}
                  />
                </div>

                <WholesaleFields
                  priceVal={variation.wholesale_price}
                  minQtyVal={variation.wholesale_min_qty}
                  onPriceChange={(val) => upd('wholesale_price', val)}
                  onMinQtyChange={(val) => upd('wholesale_min_qty', val)}
                  priceError={fieldErrors[`${vp}.wholesale_price`]}
                  minQtyError={fieldErrors[`${vp}.wholesale_min_qty`]}
                />
              </>
            )}

            {batchTracking && (
              <div>
                {fieldErrors[`${vp}.batches`] && (
                  <p className={`text-xs font-medium ${C.errorText} flex items-center gap-1 mb-3`}>
                    <i className="fas fa-exclamation-circle" />{fieldErrors[`${vp}.batches`]}
                  </p>
                )}
                {variation.batches.map((batch, batchIdx) => (
                  <BatchCard
                    key={batchIdx}
                    batch={batch}
                    batchIdx={batchIdx}
                    varIdx={varIdx}
                    onChange={onBatchChange}
                    onRemove={onRemoveBatch}
                    canRemove={variation.batches.length > 1}
                    fieldErrors={fieldErrors}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// VARIATION TYPE PANEL
// ─────────────────────────────────────────────────────────────
const VariationTypePanel = ({ vm, selectedOptions, onToggleOption, onAddCustom, onRemoveCustom, customOptions }) => {
  const [customInput, setCustomInput] = useState('')
  const masterOpts = vm.types ? vm.types.split(',').map(t => t.trim()).filter(Boolean) : []

  const handleAdd = () => {
    const val = customInput.trim()
    if (!val) return
    if (masterOpts.includes(val) || customOptions.includes(val)) return
    onAddCustom(vm._id, val)
    setCustomInput('')
  }

  const totalSelected = selectedOptions.size + customOptions.length

  return (
    <div className="border-2 border-[#c8e8ed] rounded-xl p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-[#1a6b7a] flex items-center gap-2">
          <i className="fas fa-tag text-xs" />
          {vm.variationName}
          <span className="text-xs font-normal text-gray-500">
            — select one or more options
          </span>
        </p>
        <span className="text-xs font-semibold bg-[#1a6b7a] text-white px-2.5 py-1 rounded-full">
          {totalSelected} selected
        </span>
      </div>

      {/* Master options */}
      {masterOpts.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-3">
          {masterOpts.map((opt) => {
            const isOn = selectedOptions.has(opt)
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onToggleOption(vm._id, opt)}
                className={`px-3 py-1.5 rounded-lg border-2 text-sm font-semibold transition-all ${isOn
                  ? 'bg-[#1a6b7a] border-[#1a6b7a] text-white'
                  : 'bg-white border-gray-300 text-gray-600 hover:border-[#1a6b7a] hover:text-[#1a6b7a]'
                  }`}
              >
                {isOn && <i className="fas fa-check text-xs mr-1.5" />}
                {opt}
              </button>
            )
          })}
        </div>
      ) : (
        <p className="text-xs text-gray-400 mb-3 italic">No preset options</p>
      )}

      {/* Custom option chips */}
      {customOptions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {customOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onRemoveCustom(vm._id, opt)}
              className="px-3 py-1.5 rounded-lg border-2 border-[#1a6b7a] bg-[#1a6b7a] text-white text-sm font-semibold inline-flex items-center gap-1.5"
            >
              {opt}
              <i className="fas fa-times text-xs" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// VARIATION TYPE SELECTOR
// ─────────────────────────────────────────────────────────────
const VariationTypeSelector = ({
  variationMasters,
  selectedVariationTypes,
  onToggleType,
  onToggleOption,
  onAddCustom,
  onRemoveCustom,
  variationsLoading,
}) => {
  if (variationsLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
        <i className="fas fa-spinner fa-spin text-[#1a6b7a]" />
        Loading variation types…
      </div>
    )
  }

  if (!variationMasters.length) {
    return (
      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl">
        <i className="fas fa-info-circle" />
        <span>No variation types found. Create variation types in the <strong>Variations</strong> module first (e.g. Size, Color, Flavor).</span>
      </div>
    )
  }

  const selectedId = selectedVariationTypes.length > 0 ? selectedVariationTypes[0].vm._id : null

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs text-gray-500 mb-2">
          Select <strong>one</strong> variation type for this product, then choose which options apply.
        </p>
        <div className="flex flex-wrap gap-2">
          {variationMasters.map((vm) => {
            const isSelected = selectedId === vm._id
            const entry = selectedVariationTypes.find(s => s.vm._id === vm._id)
            const activeCount = entry ? entry.selectedOptions.size + entry.customOptions.length : 0

            return (
              <button
                key={vm._id}
                type="button"
                onClick={() => onToggleType(vm)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 text-sm font-semibold transition-all ${isSelected
                  ? 'bg-[#1a6b7a] border-[#1a6b7a] text-white shadow-sm'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-[#1a6b7a] hover:text-[#1a6b7a]'
                  }`}
              >
                <i className={`fas fa-${isSelected ? 'check-circle' : 'plus-circle'} text-xs`} />
                {vm.variationName}
                {isSelected && (
                  <span className="text-xs font-normal bg-white/25 px-1.5 py-0.5 rounded-full">
                    {activeCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {selectedVariationTypes.length > 0 && (
        <div className="flex flex-col gap-3">
          {selectedVariationTypes.map(({ vm, selectedOptions, customOptions }) => (
            <VariationTypePanel
              key={vm._id}
              vm={vm}
              selectedOptions={selectedOptions}
              customOptions={customOptions}
              onToggleOption={onToggleOption}
              onAddCustom={onAddCustom}
              onRemoveCustom={onRemoveCustom}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
const EditProduct = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    getProductById,
    updateProduct,
    loading,
    error,
    fieldErrors,
    setFieldErrors,
    setError,
    resetMessages
  } = useProductHooks()
  const { getAllVariations, loading: variationsLoading } = useVariationHooks()

  const [form, setForm] = useState(initialForm())
  const [dropdowns, setDropdowns] = useState({
    brands: [], categories: [], suppliers: [], stores: [], units: []
  })
  const [fetchLoading, setFetchLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  const [variationMasters, setVariationMasters] = useState([])
  const [selectedVariationTypes, setSelectedVariationTypes] = useState([])

  const hasReconstructed = useRef(false)

  // ── Load everything ──
  useEffect(() => {
    const load = async () => {
      setFetchLoading(true)
      setFetchError('')
      try {
        const [brands, categories, suppliers, stores, units, variations, productRes] = await Promise.all([
          window.api.brand.getAll(),
          window.api.category.getAll(),
          window.api.supplier.getAll(),
          window.api.store.getAll(),
          window.api.unit.getAll(),
          getAllVariations(),
          getProductById(id)
        ])

        setDropdowns({
          brands: brands?.data || [],
          categories: categories?.data || [],
          suppliers: suppliers?.suppliers || suppliers?.data || [],
          stores: stores?.stores || stores?.data || [],
          units: units?.units || units?.data || []
        })

        const masters = variations?.data || variations?.variations || []
        setVariationMasters(masters)

        if (productRes?.success && productRes.product) {
          const p = productRes.product

          const mappedVariations = (p.variations || []).map((v) => ({
            _id: v._id || undefined,
            name: v.name || '',
            price: v.price ?? '',
            cost: v.cost ?? '',
            stock: v.stock ?? '',
            discount_type: v.discount_type || 'none',
            discount_value: v.discount_value ?? '',
            wholesale_price: v.wholesale_price ?? '',
            wholesale_min_qty: v.wholesale_min_qty ?? '',
            batches: (v.batches || []).map((b) => ({
              _id: b._id || undefined,
              batch_number: b.batch_number || '',
              price: b.price ?? '',
              cost: b.cost ?? '',
              stock: b.stock ?? '',
              discount_type: b.discount_type || 'none',
              discount_value: b.discount_value ?? '',
              wholesale_price: b.wholesale_price ?? '',
              wholesale_min_qty: b.wholesale_min_qty ?? '',
              expiry_date: b.expiry_date
                ? new Date(b.expiry_date).toISOString().split('T')[0]
                : '',
              grn_id: b.grn_id || null
            }))
          }))

          const finalVariations = mappedVariations.length > 0
            ? mappedVariations
            : [initialVariation(true)]

          setForm({
            name: p.name || '',
            code: p.code || '',
            brand_id: p.brand_id?._id ? String(p.brand_id._id) : (p.brand_id || ''),
            category_id: p.category_id?._id ? String(p.category_id._id) : (p.category_id || ''),
            supplier_id: p.supplier_id?._id ? String(p.supplier_id._id) : (p.supplier_id || ''),
            store_id: p.store_id?._id ? String(p.store_id._id) : (p.store_id || ''),
            product_type: p.product_type || 'quantity',
            unit_id: p.unit_id?._id ? String(p.unit_id._id) : (p.unit_id || ''),
            structure: p.structure || 'single',
            batch_tracking: p.batch_tracking ?? false,
            variations: finalVariations,
            tax: p.tax ?? '',
            stock_alert: p.stock_alert ?? '',
            wholesale_enabled: p.wholesale_enabled ?? false,
            wholesale_price: p.wholesale_price ?? '',
            wholesale_min_qty: p.wholesale_min_qty ?? '',
            status: p.status || 'active',
            image: p.image || null
          })

          // ── Reconstruct selected variation types for variable products ──
          if ((p.structure || 'single') === 'variable' && mappedVariations.length > 0 && masters.length > 0 && !hasReconstructed.current) {
            const variationNames = mappedVariations.map(v => v.name).filter(Boolean)

            for (const master of masters) {
              const masterOpts = master.types
                ? master.types.split(',').map(t => t.trim()).filter(Boolean)
                : []

              const matched = []
              const custom = []

              for (const name of variationNames) {
                if (masterOpts.includes(name)) matched.push(name)
                else custom.push(name)
              }

              if (matched.length > 0 || custom.length > 0) {
                setSelectedVariationTypes([{
                  vm: master,
                  selectedOptions: new Set(matched),
                  customOptions: custom
                }])
                hasReconstructed.current = true
                break
              }
            }
          }
        } else {
          setFetchError(productRes?.error || 'Product not found')
        }
      } catch (e) {
        console.error('Failed to load product', e)
        setFetchError('Failed to load product data')
      } finally {
        setFetchLoading(false)
      }
    }
    if (id) load()
  }, [id, getProductById, getAllVariations])

  // ── form field update ──
  const updateForm = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }))
    if (fieldErrors[key]) setFieldErrors((prev) => { const e = { ...prev }; delete e[key]; return e })
    resetMessages()
  }

  // ── Rebuild form.variations from current selectedVariationTypes state ──
  const rebuildVariations = useCallback((updatedTypes) => {
    if (updatedTypes.length === 0) {
      setForm((prev) => ({ ...prev, variations: [initialVariation(false)] }))
      return
    }

    const optionSets = updatedTypes.map(({ vm, selectedOptions, customOptions }) => {
      const all = [...selectedOptions, ...customOptions]
      return all.length > 0 ? all : [vm.variationName]
    })

    const combinations = optionSets.reduce(
      (acc, opts) => acc.flatMap((combo) => opts.map((opt) => [...combo, opt])),
      [[]]
    )

    setForm((prev) => {
      const existingByName = {}
      prev.variations.forEach(v => {
        if (v.name) existingByName[v.name] = v
      })

      return {
        ...prev,
        variations: combinations.map((combo) => {
          const name = combo.join(' – ')
          const existing = existingByName[name]
          return existing
            ? { ...existing, name }
            : { ...initialVariation(false), name }
        })
      }
    })
  }, [])

  // ── Toggle a variation type chip on/off ──
  const handleToggleType = useCallback((vm) => {
    setSelectedVariationTypes((prev) => {
      const exists = prev.find(s => s.vm._id === vm._id)
      let next

      if (exists) {
        next = []
      } else {
        const masterOpts = vm.types
          ? vm.types.split(',').map(t => t.trim()).filter(Boolean)
          : []
        next = [{ vm, selectedOptions: new Set(masterOpts), customOptions: [] }]
      }
      rebuildVariations(next)
      return next
    })
  }, [rebuildVariations])

  // ── Toggle an individual option chip within a type panel ──
  const handleToggleOption = useCallback((vmId, option) => {
    setSelectedVariationTypes((prev) => {
      const next = prev.map(s => {
        if (s.vm._id !== vmId) return s
        const opts = new Set(s.selectedOptions)
        if (opts.has(option)) opts.delete(option)
        else opts.add(option)
        return { ...s, selectedOptions: opts }
      })
      rebuildVariations(next)
      return next
    })
  }, [rebuildVariations])

  // ── Add a custom option ──
  const handleAddCustomOption = useCallback((vmId, value) => {
    setSelectedVariationTypes((prev) => {
      const next = prev.map(s => {
        if (s.vm._id !== vmId) return s
        return { ...s, customOptions: [...s.customOptions, value] }
      })
      rebuildVariations(next)
      return next
    })
  }, [rebuildVariations])

  // ── Remove a custom option ──
  const handleRemoveCustomOption = useCallback((vmId, value) => {
    setSelectedVariationTypes((prev) => {
      const next = prev.map(s => {
        if (s.vm._id !== vmId) return s
        return { ...s, customOptions: s.customOptions.filter(o => o !== value) }
      })
      rebuildVariations(next)
      return next
    })
  }, [rebuildVariations])

  // ── batch ops ──
  const addBatch = (varIdx) => {
    setForm((prev) => {
      const variations = [...prev.variations]
      variations[varIdx] = {
        ...variations[varIdx],
        batches: [...variations[varIdx].batches, initialBatch()]
      }
      return { ...prev, variations }
    })
  }

  const removeBatch = (varIdx, batchIdx) => {
    setForm((prev) => {
      const variations = [...prev.variations]
      variations[varIdx] = {
        ...variations[varIdx],
        batches: variations[varIdx].batches.filter((_, i) => i !== batchIdx)
      }
      return { ...prev, variations }
    })
  }

  const onBatchChange = (varIdx, batchIdx, key, val) => {
    setForm((prev) => {
      const variations = [...prev.variations]

      if (key === 'batch_number' && batchIdx === 0 && variations.length > 1) {
        return {
          ...prev,
          variations: variations.map((v) => ({
            ...v,
            batches: v.batches.map((b, bi) =>
              bi === 0 ? { ...b, batch_number: val } : b
            )
          }))
        }
      }

      const batches = [...variations[varIdx].batches]
      batches[batchIdx] = { ...batches[batchIdx], [key]: val }
      variations[varIdx] = { ...variations[varIdx], batches }
      return { ...prev, variations }
    })
    const errKey = `variations[${varIdx}].batches[${batchIdx}].${key}`
    if (fieldErrors[errKey]) setFieldErrors((prev) => { const e = { ...prev }; delete e[errKey]; return e })
    resetMessages()
  }

  // ── variation ops ──
  const onVariationChange = (idx, key, val) => {
    setForm((prev) => {
      const variations = [...prev.variations]
      variations[idx] = { ...variations[idx], [key]: val }
      return { ...prev, variations }
    })
    const errKey = `variations[${idx}].${key}`
    if (fieldErrors[errKey]) setFieldErrors((prev) => { const e = { ...prev }; delete e[errKey]; return e })
    resetMessages()
  }

  const removeVariation = (idx) => {
    const variationToRemove = form.variations[idx]

    if (!variationToRemove.name || variationToRemove.name === '') {
      setForm((prev) => ({
        ...prev,
        variations: prev.variations.filter((_, i) => i !== idx)
      }))
      return
    }

    const nameParts = variationToRemove.name.split(' – ')

    let changed = false
    const nextTypes = selectedVariationTypes.map((typeEntry) => {
      const newSelected = new Set(typeEntry.selectedOptions)
      let typeChanged = false

      for (const part of nameParts) {
        if (newSelected.has(part)) {
          newSelected.delete(part)
          typeChanged = true
          changed = true
        }
      }

      const newCustom = typeEntry.customOptions.filter(c => !nameParts.includes(c))
      if (newCustom.length !== typeEntry.customOptions.length) {
        typeChanged = true
        changed = true
      }

      return typeChanged
        ? { ...typeEntry, selectedOptions: newSelected, customOptions: newCustom }
        : typeEntry
    }).filter(t => t.selectedOptions.size > 0 || t.customOptions.length > 0)

    if (changed) {
      setSelectedVariationTypes(nextTypes)
      rebuildVariations(nextTypes)
    } else {
      setForm((prev) => ({
        ...prev,
        variations: prev.variations.filter((_, i) => i !== idx)
      }))
    }
  }

  // ── helpers for numeric coercion ──
  const num = (v) => (v === '' || v == null ? null : Number(v))
  const numOrZero = (v, fallback = 0) => (v === '' || v == null ? fallback : Number(v))

  // ── submit ──
  const handleSubmit = async () => {
    setError('')
    const payload = {
      id,
      ...form,
      tax: numOrZero(form.tax, 0),
      stock_alert: numOrZero(form.stock_alert, 5),
      wholesale_price: form.wholesale_enabled ? num(form.wholesale_price) : null,
      wholesale_min_qty: form.wholesale_enabled ? num(form.wholesale_min_qty) : null,
      unit_id: form.unit_id,
      variations: form.variations.map((v) => ({
        ...v,
        price: num(v.price),
        cost: num(v.cost),
        stock: num(v.stock),
        discount_value: v.discount_type !== 'none' && v.discount_value !== '' ? num(v.discount_value) : null,
        wholesale_price: v.wholesale_price !== '' ? num(v.wholesale_price) : null,
        wholesale_min_qty: v.wholesale_min_qty !== '' ? num(v.wholesale_min_qty) : null,
        batches: v.batches.map((b) => ({
          ...b,
          price: num(b.price),
          cost: num(b.cost),
          stock: num(b.stock),
          discount_value: b.discount_type !== 'none' && b.discount_value !== '' ? num(b.discount_value) : null,
          wholesale_price: b.wholesale_price !== '' ? num(b.wholesale_price) : null,
          wholesale_min_qty: b.wholesale_min_qty !== '' ? num(b.wholesale_min_qty) : null,
          expiry_date: b.expiry_date || null
        }))
      }))
    }

    const res = await updateProduct(payload)
    if (res?.success) {
      navigate('/dashboard/products')
    }
  }

  const isSingle = form.structure === 'single'

  // ── Loading / Error states ──
  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <p className="text-gray-400 text-sm">Loading product…</p>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] gap-3">
        <p className="text-red-500 text-sm">{fetchError}</p>
        <button
          onClick={() => navigate('/dashboard/products')}
          className="bg-[#1a6b7a] text-white text-sm px-4 py-2 rounded-lg hover:opacity-90"
        >
          Back to Products
        </button>
      </div>
    )
  }

  return (
    <div className="relative min-h-full px-8 pt-8 pb-0 overflow-hidden">
      <div className="flex flex-col h-[650px]">

        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-[880px] h-[780px] bg-[#2699aa] opacity-40 rounded-full right-[-200px] bottom-[-200px]" />
          <div className="absolute w-[580px] h-[580px] bg-[#30aabb] opacity-25 rounded-full right-[-120px] bottom-[-120px]" />
          <div className="absolute w-[420px] h-[420px] bg-[#2699aa] opacity-30 rounded-full left-[-80px] top-[-80px]" />
        </div>

        {/* Page header */}
        <div className="relative z-10 mb-5">
          <h1 className="text-white text-[22px] font-bold m-0 flex items-center gap-2">
            <i className="fas fa-box-open text-[20px]" /> Edit Product
          </h1>
          <p className="text-[#90bcc4] text-[15px] mt-1">Update product details and variations.</p>
        </div>

        {/* Card */}
        <div
          className="relative z-10 bg-[#f0f4f6] w-full px-6 py-6 shadow-xl rounded-t-[20px] overflow-auto"
          style={{ height: 'calc(100% - 70px)' }}
        >
          {/* Global error banner */}
          {error && (
            <div className="mb-5 bg-red-50 border-2 border-red-400 text-red-700 text-sm font-medium px-4 py-3 rounded-xl flex items-start gap-2">
              <i className="fas fa-exclamation-triangle mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ── General details ── */}
          <Section title="General details" icon="tag">
            <div className="grid grid-cols-3 mt-4 gap-4">
              <Field label="Product name" required error={fieldErrors.name}>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                  placeholder="e.g. White Rice 5kg"
                  className={inputCls(fieldErrors.name)}
                />
              </Field>
              <Field label="Product code" required error={fieldErrors.code}>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => updateForm('code', e.target.value)}
                  placeholder="e.g. PRD-001"
                  className={inputCls(fieldErrors.code)}
                />
              </Field>
              <Field label="Store" required error={fieldErrors.store_id}>
                <select value={form.store_id} onChange={(e) => updateForm('store_id', e.target.value)} className={selectCls(fieldErrors.store_id)}>
                  <option value="">Select store</option>
                  {dropdowns.stores.map((s) => <option key={s._id} value={s._id}>{s.storeName || s.name}</option>)}
                </select>
              </Field>
              <Field label="Brand" required error={fieldErrors.brand_id}>
                <select value={form.brand_id} onChange={(e) => updateForm('brand_id', e.target.value)} className={selectCls(fieldErrors.brand_id)}>
                  <option value="">Select brand</option>
                  {dropdowns.brands.map((b) => <option key={b._id} value={b._id}>{b.brandName || b.name}</option>)}
                </select>
              </Field>
              <Field label="Category" required error={fieldErrors.category_id}>
                <select value={form.category_id} onChange={(e) => updateForm('category_id', e.target.value)} className={selectCls(fieldErrors.category_id)}>
                  <option value="">Select category</option>
                  {dropdowns.categories.map((c) => <option key={c._id} value={c._id}>{c.categoryName || c.name}</option>)}
                </select>
              </Field>
              <Field label="Supplier" required error={fieldErrors.supplier_id}>
                <select value={form.supplier_id} onChange={(e) => updateForm('supplier_id', e.target.value)} className={selectCls(fieldErrors.supplier_id)}>
                  <option value="">Select supplier</option>
                  {dropdowns.suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </Field>
            </div>
          </Section>

          {/* ── Product type & structure (READ-ONLY) ── */}
          <div className="grid grid-cols-2 gap-4">
            <Section title="Product type" icon="box">
              <div className="flex flex-col gap-3">
                {[
                  { val: 'quantity', label: 'Quantity based', desc: 'Counted in whole units (e.g. bottles, bags)' },
                  { val: 'measurable', label: 'Measurable', desc: 'Sold by weight or volume (e.g. kg, L)' }
                ].map(({ val, label, desc }) => (
                  <label key={val} className="flex items-start gap-3 cursor-not-allowed opacity-60">
                    <input
                      type="radio"
                      name="product_type"
                      value={val}
                      checked={form.product_type === val}
                      disabled
                      className="mt-0.5 accent-[#1a6b7a] w-4 h-4"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  </label>
                ))}
                {(() => {
                  const selectedUnit = dropdowns.units.find(u => String(u._id) === form.unit_id)
                  const unitLabel = selectedUnit?.unitName || selectedUnit?.name || form.unit_id || '—'
                  return (
                    <ReadOnlyField
                      label="Unit"
                      value={unitLabel}
                      icon="ruler"
                    />
                  )
                })()}
              </div>
            </Section>

            <Section title="Product structure" icon="layer-group">
              <div className="flex flex-col gap-3">
                {[
                  { val: 'single', label: 'Single product', desc: 'One size, one price, one stock pool' },
                  { val: 'variable', label: 'Variable product', desc: 'Multiple sizes, colours, or variants' }
                ].map(({ val, label, desc }) => (
                  <label key={val} className="flex items-start gap-3 cursor-not-allowed opacity-60">
                    <input
                      type="radio"
                      name="structure"
                      value={val}
                      checked={form.structure === val}
                      disabled
                      className="mt-0.5 accent-[#1a6b7a] w-4 h-4"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </Section>
          </div>

          {/* ── Batch tracking (READ-ONLY) ── */}
          <Section title="Batch tracking" icon="layer-group">
            <Toggle
              enabled={form.batch_tracking}
              onChange={() => {}}
              label="Enable batch tracking"
              description="Track stock in separate batches — each batch can have its own price, cost, wholesale pricing, and expiry date. Ideal for perishables and GRN-linked inventory."
              readOnly={true}
            />
          </Section>

          {/* ── Variation Type Selector (variable products only) ── */}
          {!isSingle && (
            <Section title="Variation types" icon="tags" accent>
              <VariationTypeSelector
                variationMasters={variationMasters}
                selectedVariationTypes={selectedVariationTypes}
                onToggleType={handleToggleType}
                onToggleOption={handleToggleOption}
                onAddCustom={handleAddCustomOption}
                onRemoveCustom={handleRemoveCustomOption}
                variationsLoading={variationsLoading}
              />
            </Section>
          )}

          {/* ── Variations & Batches ── */}
          <Section title={isSingle ? 'Stock & pricing' : 'Variations'} icon="cubes" accent>
            {fieldErrors.variations && (
              <p className={`text-xs font-medium ${C.errorText} flex items-center gap-1 mb-3`}>
                <i className="fas fa-exclamation-circle" />{fieldErrors.variations}
              </p>
            )}

            {form.variations.map((variation, varIdx) => (
              <VariationCard
                key={varIdx}
                variation={variation}
                varIdx={varIdx}
                isSingle={isSingle}
                batchTracking={form.batch_tracking}
                hasSelectedTypes={selectedVariationTypes.length > 0}
                onVariationChange={onVariationChange}
                onBatchChange={onBatchChange}
                onAddBatch={addBatch}
                onRemoveBatch={removeBatch}
                onRemoveVariation={removeVariation}
                canRemoveVariation={form.variations.length > 1}
                fieldErrors={fieldErrors}
              />
            ))}
          </Section>

          {/* ── Other settings ── */}
          <Section title="Other settings" icon="sliders-h">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tax (%)" error={fieldErrors.tax} hint="Applied at point of sale">
                <input
                  type="number"
                  min="0"
                  value={form.tax}
                  onChange={(e) => updateForm('tax', e.target.value)}
                  placeholder="0"
                  className={inputCls(fieldErrors.tax)}
                />
              </Field>
              <Field label="Low stock alert" error={fieldErrors.stock_alert} hint="Notify when stock falls below this number">
                <input
                  type="number"
                  min="0"
                  value={form.stock_alert}
                  onChange={(e) => updateForm('stock_alert', e.target.value)}
                  placeholder="5"
                  className={inputCls(fieldErrors.stock_alert)}
                />
              </Field>
            </div>
          </Section>

          {/* ── Product status ── */}
          <Section title="Product status" icon="toggle-on">
            <div className="flex gap-6">
              {[
                { val: 'active', label: 'Active', desc: 'Visible and available for sale', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-300' },
                { val: 'inactive', label: 'Inactive', desc: 'Hidden from POS and reports', color: 'text-gray-600', bg: 'bg-gray-100 border-gray-300' }
              ].map(({ val, label, desc, color, bg }) => (
                <label
                  key={val}
                  className={`flex items-start gap-3 cursor-pointer border-2 rounded-xl px-4 py-3 flex-1 transition-colors ${form.status === val ? `${bg} border-current` : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={val}
                    checked={form.status === val}
                    onChange={() => updateForm('status', val)}
                    className={`mt-0.5 accent-[#1a6b7a] w-4 h-4`}
                  />
                  <div>
                    <p className={`text-sm font-bold ${color}`}>{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </Section>

          {/* ── Action buttons ── */}
          <div className="flex justify-end gap-3 pt-2 pb-6">
            <button
              type="button"
              onClick={() => navigate('/dashboard/products')}
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
                <><i className="fas fa-save" /> Update product</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditProduct
