import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

// ─────────────────────────────────────────────────────────────
// INITIAL STATE SHAPES
// ─────────────────────────────────────────────────────────────
export const initialBatch = (defaults = {}) => ({
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
export const initialProductLine = (product, variation = null, batches = []) => {
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
export const initialForm = () => ({
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
// LINE TOTAL HELPER
// ─────────────────────────────────────────────────────────────
export const calcLineTotal = (cost, quantity, discount_type, discount_value) => {
  let total = (cost || 0) * (quantity || 0)
  if (discount_type === 'percent' && discount_value) total -= total * (discount_value / 100)
  else if (discount_type === 'fixed' && discount_value) total -= discount_value
  return Math.max(total, 0)
}

export const num = (v) => (v === '' || v == null ? null : Number(v))

// ─────────────────────────────────────────────────────────────
// CLIENT-SIDE VALIDATION
// ─────────────────────────────────────────────────────────────
export const validateGRNForm = (form) => {
  const errors = {}

  if (!form.store_id) errors.store_id = 'Please select a store'
  if (!form.supplier_id) errors.supplier_id = 'Please select a supplier'
  if (!form.date) errors.date = 'GRN date is required'
  if (!form.invoice_number?.trim()) errors.invoice_number = 'Invoice number is required'

  if (form.payment_type === 'cheque') {
    if (!form.cheque_details.cheque_number?.trim()) errors['cheque_details.cheque_number'] = 'Cheque number is required'
    if (!form.cheque_details.due_date) errors['cheque_details.due_date'] = 'Cheque due date is required'
    if (!form.cheque_details.holder_name?.trim()) errors['cheque_details.holder_name'] = 'Cheque holder name is required'
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
    } else {
      if (!line.batches || line.batches.length === 0) {
        errors[`${prefix}.batches`] = `${line.product_name}: add at least one batch to receive`
      } else {
        const seen = []
        line.batches.forEach((b, j) => {
          const bp = `${prefix}.batches[${j}]`
          if (!b.batch_number?.trim()) {
            errors[`${bp}.batch_number`] = `${line.product_name}, batch ${j + 1}: batch number is required`
          } else {
            const key = b.batch_number.trim().toLowerCase()
            if (seen.includes(key)) {
              errors[`${bp}.batch_number`] = `${line.product_name}, batch ${j + 1}: duplicate batch number "${b.batch_number}"`
            }
            seen.push(key)
          }
          const cost = num(b.cost)
          if (cost === null || cost < 0) {
            errors[`${bp}.cost`] = `${line.product_name}, batch ${j + 1}: cost is required`
          }
          const price = num(b.price)
          if (price === null || price < 0) {
            errors[`${bp}.price`] = `${line.product_name}, batch ${j + 1}: selling price is required`
          }
          const qty = num(b.quantity)
          if (qty === null || qty <= 0) {
            errors[`${bp}.quantity`] = `${line.product_name}, batch ${j + 1}: quantity must be greater than 0`
          }
          if (b.discount_type === 'percent' && num(b.discount_value) > 100) {
            errors[`${bp}.discount_value`] = `${line.product_name}, batch ${j + 1}: discount cannot exceed 100%`
          }
        })
      }
    }
  })

  return errors
}

// ─────────────────────────────────────────────────────────────
// HOOK: all state, effects and handlers for CreateGRN
// ─────────────────────────────────────────────────────────────
export const useCreateGRN = () => {
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
  // Scroll to and briefly highlight the first field referenced by a field-error key.
  // Works whether the error came from client-side validation or the server response,
  // since both use the same "products[i].batches[j].x" key shape.
  const scrollToFirstError = (errors) => {
    const keys = Object.keys(errors)
    if (keys.length === 0) return

    // Resolve every key to its visible DOM anchor first (batch sub-fields collapse to
    // their line's "batches" cell, since the individual input only exists inside the modal),
    // then pick whichever anchor sits first on the page — i.e. respect visual order rather
    // than an arbitrary key priority.
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

    // Client-side pass first — instant feedback, no round trip, same error shape as the server
    const clientErrors = validateGRNForm(form)
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
        const serverFieldErrors = res?.fieldErrors || {}
        setFieldErrors(serverFieldErrors)
        const count = Object.keys(serverFieldErrors).length
        if (count > 0) {
          setError(res?.error || `Please fix ${count === 1 ? 'the highlighted issue' : `the ${count} highlighted issues`} before saving.`)
          scrollToFirstError(serverFieldErrors)
        } else {
          // Server rejected the GRN without pinpointing a field (e.g. stock-in failure,
          // duplicate invoice number with no matching form field, DB error) — this is the
          // only case where a plain banner is the right call, since there's nothing to jump to.
          setError(res?.error || 'Something went wrong while creating the GRN. Please try again.')
        }
      }
    } catch (e) {
      console.error('GRN create failed', e)
      // Distinguish "request never reached the server" from "server responded with an error"
      // so the person knows whether to check their connection or just retry.
      if (e?.message === 'Failed to fetch' || e?.name === 'TypeError' || !navigator.onLine) {
        setError('Could not connect to the server. Please check your internet connection and try again.')
      } else {
        setError('Something went wrong while creating the GRN. Please try again.')
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
    updateCheque,
    handleAddProduct,
    removeProductLine,
    updateProductLine,
    onSelectVariation,
    openManageBatches,
    closeBatchModal,
    handleBatchModalSave,
    grandTotal,
    scrollToFirstError,
    handleSubmit
  }
}
