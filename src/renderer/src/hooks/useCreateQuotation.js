import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

// ─────────────────────────────────────────────────────────────
// INITIAL STATE SHAPES
// ─────────────────────────────────────────────────────────────
// A single selected batch to quote against. cost is carried silently
// from the real batch (schema requires it) — never shown/edited in the UI.
// discount_type/discount_value are likewise carried from the real batch's
// own discount — the quotation never lets the user set these itself.
export const initialQuotedBatch = (batch = {}) => ({
  batch_number: batch.batch_number || '',
  cost: batch.cost ?? '',
  price: batch.price ?? '',
  discount_type: batch.discount_type || 'none',
  discount_value: batch.discount_value ?? '',
  quantity: '',
  expiry_date: batch.expiry_date || '',
  _availableStock: batch.stock ?? 0
})

// ─────────────────────────────────────────────────────────────
// A product line added to the quotation table
// ─────────────────────────────────────────────────────────────
export const initialProductLine = (product, variation = null) => {
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
        price: v.price,
        wholesale_price: v.wholesale_price,
        discount_type: v.discount_type,
        discount_value: v.discount_value
      }))
      : [],

    _existingStock: existingStock,
    _existingBatches: existingBatches,

    // cost is carried for the payload but never rendered as an editable field
    cost: !isBatch ? (targetVar?.cost ?? '') : '',
    price: !isBatch ? (targetVar?.price ?? '') : '',
    _wholesalePrice: targetVar?.wholesale_price ?? product?.wholesale_price ?? null,

    quantity: '',
    batches: [], // selected existing batches to quote (isBatch only)

    // The product's own discount, carried read-only — the quotation form
    // never lets the user set or change this, it just reflects what's on the product.
    discount_type: !isBatch ? (targetVar?.discount_type || 'none') : 'none',
    discount_value: !isBatch ? (targetVar?.discount_value ?? '') : '',

    wholesale_enabled: false
  }
}

// ─────────────────────────────────────────────────────────────
// Initial Form
// ─────────────────────────────────────────────────────────────
export const initialForm = () => ({
  store_id: '',
  customer_id: '',
  date: new Date().toISOString().slice(0, 10),
  quotation_number: `QUO-${Date.now().toString().slice(-8)}`,
  products: [],
  // Whole-bill adjustments — entered on the quotation itself, on top of the products subtotal
  discount_type: 'none',
  discount_value: '',
  tax: '',
  shipping: ''
})

// ─────────────────────────────────────────────────────────────
// LINE TOTAL HELPER — always computed off the quoted price, never cost
// ─────────────────────────────────────────────────────────────
export const calcLineTotal = (price, quantity, discount_type, discount_value) => {
  let total = (price || 0) * (quantity || 0)
  if (discount_type === 'percent' && discount_value) total -= total * (discount_value / 100)
  else if (discount_type === 'fixed' && discount_value) total -= discount_value
  return Math.max(total, 0)
}

export const num = (v) => (v === '' || v == null ? null : Number(v))

// ─────────────────────────────────────────────────────────────
// WHOLE-BILL TOTALS — subtotal (sum of line totals), then order-level
// discount, then tax %, then flat shipping, in that order.
// ─────────────────────────────────────────────────────────────
export const calcOrderTotals = (subtotal, form) => {
  const discountAmount = form.discount_type === 'percent'
    ? subtotal * ((num(form.discount_value) || 0) / 100)
    : form.discount_type === 'fixed'
      ? (num(form.discount_value) || 0)
      : 0
  const afterDiscount = Math.max(subtotal - discountAmount, 0)
  const taxAmount = afterDiscount * ((num(form.tax) || 0) / 100)
  const shippingAmount = num(form.shipping) || 0
  const grandTotal = afterDiscount + taxAmount + shippingAmount

  return { subtotal, discountAmount, afterDiscount, taxAmount, shippingAmount, grandTotal }
}

// ─────────────────────────────────────────────────────────────
// CLIENT-SIDE VALIDATION
// ─────────────────────────────────────────────────────────────
export const validateQuotationForm = (form) => {
  const errors = {}

  if (!form.store_id) errors.store_id = 'Please select a store'
  if (!form.customer_id) errors.customer_id = 'Please select a customer'
  if (!form.date) errors.date = 'Quotation date is required'
  if (!form.quotation_number?.trim()) errors.quotation_number = 'Quotation number is required'

  if (form.discount_type === 'percent' && num(form.discount_value) > 100) {
    errors.discount_value = 'Discount cannot exceed 100%'
  }
  if (form.tax !== '' && form.tax != null && num(form.tax) < 0) {
    errors.tax = 'Tax cannot be negative'
  }
  if (form.shipping !== '' && form.shipping != null && num(form.shipping) < 0) {
    errors.shipping = 'Shipping cannot be negative'
  }

  if (!form.products || form.products.length === 0) {
    errors.products = 'Add at least one product before saving'
    return errors
  }

  form.products.forEach((line, i) => {
    const prefix = `products[${i}]`

    if (line.structure === 'variable' && !line.variation_id) {
      errors[`${prefix}.variation_id`] = `${line.product_name}: please select a variation`
    }

    if (!line.batch_tracking) {
      const q = num(line.quantity)
      if (q === null || q <= 0) {
        errors[`${prefix}.quantity`] = `${line.product_name}: quantity must be greater than 0`
      }
      const price = num(line.price)
      if (price === null || price < 0) {
        errors[`${prefix}.price`] = `${line.product_name}: price is required`
      }
    } else {
      if (!line.batches || line.batches.length === 0) {
        errors[`${prefix}.batches`] = `${line.product_name}: select at least one batch to quote`
      } else {
        const seen = []
        line.batches.forEach((b, j) => {
          const bp = `${prefix}.batches[${j}]`
          if (!b.batch_number?.trim()) {
            errors[`${bp}.batch_number`] = `${line.product_name}, batch ${j + 1}: batch is required`
          } else {
            const key = b.batch_number.trim().toLowerCase()
            if (seen.includes(key)) {
              errors[`${bp}.batch_number`] = `${line.product_name}, batch ${j + 1}: duplicate batch "${b.batch_number}"`
            }
            seen.push(key)
          }
          const price = num(b.price)
          if (price === null || price < 0) {
            errors[`${bp}.price`] = `${line.product_name}, batch ${j + 1}: price is required`
          }
          const qty = num(b.quantity)
          if (qty === null || qty <= 0) {
            errors[`${bp}.quantity`] = `${line.product_name}, batch ${j + 1}: quantity must be greater than 0`
          } else if (b._availableStock != null && qty > b._availableStock) {
            errors[`${bp}.quantity`] = `${line.product_name}, batch ${j + 1}: only ${b._availableStock} in stock`
          }
        })
      }
    }
  })

  return errors
}

// ─────────────────────────────────────────────────────────────
// HOOK: all state, effects and handlers for CreateQuotation
// ─────────────────────────────────────────────────────────────
export const useCreateQuotation = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm())
  const [allProducts, setAllProducts] = useState([])
  const [dropdowns, setDropdowns] = useState({ stores: [], customers: [] })
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [batchModal, setBatchModal] = useState(null)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loading, setLoading] = useState(false)

  // ── load stores + customers on mount ──
  useEffect(() => {
    const load = async () => {
      try {
        const [storesRes, customersRes] = await Promise.all([
          window.api.store.getAll(),
          window.api.customer.getAll()
        ])
        setDropdowns({
          stores: storesRes?.stores || storesRes?.data || [],
          customers: customersRes?.customers || customersRes?.data || []
        })
      } catch (e) {
        console.error('Failed to load quotation dropdowns', e)
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
        batches: []
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

  // ── toggle wholesale pricing on a non-batch line ──
  const toggleWholesale = (idx) => {
    setForm((prev) => {
      const lines = [...prev.products]
      const line = lines[idx]
      const next = !line.wholesale_enabled
      lines[idx] = {
        ...line,
        wholesale_enabled: next,
        // Auto-fill from the wholesale price when turning it on and one exists;
        // switching off leaves whatever price the user currently has typed.
        price: next && line._wholesalePrice != null ? line._wholesalePrice : line.price
      }
      return { ...prev, products: lines }
    })
  }

  // ── variation selection (non-batch lines only — batch lines pick variation inside the modal) ──
  const onSelectVariation = (idx, variationId) => {
    setForm((prev) => {
      const lines = [...prev.products]
      const opt = lines[idx]._variationOptions.find((v) => v._id === variationId)
      lines[idx] = {
        ...lines[idx],
        variation_id: variationId,
        variation_name: opt?.name || '',
        _existingStock: opt?.stock ?? 0,
        cost: opt?.cost ?? '',
        price: opt?.price ?? '',
        _wholesalePrice: opt?.wholesale_price ?? null,
        // discount always follows the selected variation's own discount
        discount_type: opt?.discount_type || 'none',
        discount_value: opt?.discount_value ?? ''
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
      batches: line.batches
    })
  }

  const closeBatchModal = () => setBatchModal(null)

  const handleBatchModalSave = (groups) => {
    if (batchModal.mode === 'create') {
      const isVariable = batchModal.structure === 'variable'
      const newLines = groups.map(({ variationId, variationName, batches }) => {
        const variation = isVariable
          ? batchModal.product.variations.find((v) => v._id === variationId)
          : null
        const newLine = initialProductLine(batchModal.product, variation)
        newLine.batches = batches
        newLine.variation_id = variationId
        newLine.variation_name = variationName
        return newLine
      })
      setForm((prev) => ({ ...prev, products: [...prev.products, ...newLines] }))
    } else {
      const { variationId, variationName, batches } = groups[0] || { variationId: '', variationName: '', batches: [] }
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

  // ── live subtotal (sum of line totals) — always priced, never cost ──
  const subtotal = useMemo(() => {
    return form.products.reduce((sum, line) => {
      if (!line.batch_tracking) {
        return sum + calcLineTotal(num(line.price), num(line.quantity), line.discount_type, num(line.discount_value))
      }
      return sum + line.batches.reduce(
        (bSum, b) => bSum + calcLineTotal(num(b.price), num(b.quantity), b.discount_type, num(b.discount_value)),
        0
      )
    }, 0)
  }, [form.products])

  // ── whole-bill totals: subtotal → order discount → tax → shipping ──
  const totals = useMemo(() => calcOrderTotals(subtotal, form), [subtotal, form.discount_type, form.discount_value, form.tax, form.shipping])
  const grandTotal = totals.grandTotal

  // ── scroll to and briefly highlight the first field referenced by a field-error key ──
  const scrollToFirstError = (errors) => {
    const keys = Object.keys(errors)
    if (keys.length === 0) return

    const anchorFor = (key) => key.includes('.batches') ? key.replace(/\.batches\[\d+\].*/, '.batches') : key
    const candidates = keys
      .map((key) => ({ key, anchorKey: anchorFor(key), el: document.querySelector(`[data-field-key="${anchorFor(key)}"]`) }))
      .filter((c) => c.el)

    if (candidates.length === 0) return
    candidates.sort((a, b) => a.el.getBoundingClientRect().top - b.el.getBoundingClientRect().top)
    const { el } = candidates[0]

    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('grn-error-flash')
      setTimeout(() => el.classList.remove('grn-error-flash'), 1600)
    })
  }

  // ── submit ──
  const handleSubmit = async () => {
    setError('')

    const clientErrors = validateQuotationForm(form)
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors)
      setError(`Please fix ${Object.keys(clientErrors).length === 1 ? 'the highlighted issue' : `the ${Object.keys(clientErrors).length} highlighted issues`} before saving.`)
      scrollToFirstError(clientErrors)
      return
    }

    setFieldErrors({})
    setLoading(true)

    const payload = {
      store_id: form.store_id,
      quotation_number: form.quotation_number,
      customer_id: form.customer_id,
      date: form.date,
      discount_type: form.discount_type,
      discount_value: form.discount_type !== 'none' ? num(form.discount_value) : null,
      tax: num(form.tax) || 0,
      shipping: num(form.shipping) || 0,
      grand_total: grandTotal,
      products: form.products.map((line) => ({
        product_id: line.product_id,
        product_name: line.product_name,
        structure: line.structure,
        variation_id: line.structure === 'variable' ? line.variation_id : null,
        variation_name: line.structure === 'variable' ? line.variation_name : null,
        batch_tracking: line.batch_tracking,
        wholesale_enabled: line.wholesale_enabled,
        // Non-batch: cost is carried silently from the product, never edited here
        cost: !line.batch_tracking ? num(line.cost) : null,
        price: !line.batch_tracking ? num(line.price) : null,
        quantity: !line.batch_tracking ? num(line.quantity) : null,
        // discount is the product's own — carried through, never set by the user here
        discount_type: !line.batch_tracking ? (line.discount_type || 'none') : 'none',
        discount_value: !line.batch_tracking && line.discount_type !== 'none' ? num(line.discount_value) : null,
        line_total: !line.batch_tracking
          ? calcLineTotal(num(line.price), num(line.quantity), line.discount_type, num(line.discount_value))
          : line.batches.reduce((s, b) => s + calcLineTotal(num(b.price), num(b.quantity), b.discount_type, num(b.discount_value)), 0),
        batches: line.batch_tracking
          ? line.batches.map((b) => ({
            batch_number: b.batch_number,
            cost: num(b.cost),
            price: num(b.price),
            quantity: num(b.quantity),
            discount_type: b.discount_type || 'none',
            discount_value: b.discount_type && b.discount_type !== 'none' ? num(b.discount_value) : null,
            expiry_date: b.expiry_date || null
          }))
          : []
        // UI-only fields (_variationOptions, _existingStock, _wholesalePrice, etc.) intentionally omitted
      }))
    }

    try {
      const res = await window.api.quotation.create(payload)
      if (res?.success) {
        navigate('/dashboard/quotation')
      } else {
        const serverFieldErrors = res?.fieldErrors || {}
        setFieldErrors(serverFieldErrors)
        const count = Object.keys(serverFieldErrors).length
        if (count > 0) {
          setError(res?.error || res?.message || `Please fix ${count === 1 ? 'the highlighted issue' : `the ${count} highlighted issues`} before saving.`)
          scrollToFirstError(serverFieldErrors)
        } else {
          setError(res?.error || res?.message || 'Something went wrong while creating the quotation. Please try again.')
        }
      }
    } catch (e) {
      console.error('Quotation create failed', e)
      if (e?.message === 'Failed to fetch' || e?.name === 'TypeError' || !navigator.onLine) {
        setError('Could not connect to the server. Please check your internet connection and try again.')
      } else {
        setError('Something went wrong while creating the quotation. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    navigate,
    form,
    allProducts,
    dropdowns,
    fieldErrors,
    error,
    batchModal,
    loadingProducts,
    loading,
    updateForm,
    handleAddProduct,
    removeProductLine,
    updateProductLine,
    toggleWholesale,
    onSelectVariation,
    openManageBatches,
    closeBatchModal,
    handleBatchModalSave,
    subtotal,
    totals,
    grandTotal,
    scrollToFirstError,
    handleSubmit
  }
}
