import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export const calcLineTotal = (cost, quantity, discount_type, discount_value) => {
  let total = (cost || 0) * (quantity || 0)
  if (discount_type === 'percent' && discount_value) total -= total * (discount_value / 100)
  else if (discount_type === 'fixed' && discount_value) total -= discount_value
  return Math.max(total, 0)
}

export const num = (v) => (v === '' || v == null ? null : Number(v))

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

// A product line added to the GRN table
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

// line shape the table/modal expect, cross-referencing the live
// product so variation options / current stock stay accurate.
// ─────────────────────────────────────────────────────────────
export const mapServerLineToEditable = (serverLine, allProducts) => {
  const productId = typeof serverLine.product_id === 'object' ? serverLine.product_id?._id : serverLine.product_id
  const product = allProducts.find((p) => p._id === productId)
  const isVariable = serverLine.structure === 'variable'
  const variation = product
    ? (isVariable ? product.variations?.find((v) => v._id === serverLine.variation_id) : product.variations?.[0])
    : null

  return {
    product_id: productId,
    product_name: serverLine.product_name,
    product_code: product?.code || serverLine.product_id?.code || '',
    structure: serverLine.structure,
    batch_tracking: serverLine.batch_tracking,
    variation_id: serverLine.variation_id || '',
    variation_name: serverLine.variation_name || '',
    _variationOptions: product && isVariable
      ? product.variations.map((v) => ({
        _id: v._id, name: v.name, stock: v.stock, batches: v.batches, cost: v.cost, price: v.price
      }))
      : [],
    _existingStock: variation && !serverLine.batch_tracking ? (variation.stock ?? 0) : null,
    _existingBatches: variation && serverLine.batch_tracking ? (variation.batches || []) : [],
    // Prefer the live variation's cost/price — that's what the server will
    // actually use for non-batch lines (see cleanGRNProducts). Snapshot is the fallback.
    cost: !serverLine.batch_tracking ? (variation?.cost ?? serverLine.cost ?? '') : '',
    price: !serverLine.batch_tracking ? (variation?.price ?? serverLine.price ?? '') : '',
    quantity: !serverLine.batch_tracking ? (serverLine.quantity ?? '') : '',
    discount_type: 'none',
    discount_value: '',
    wholesale_enabled: serverLine.wholesale_enabled || false,
    batches: serverLine.batch_tracking
      ? (serverLine.batches || []).map((b) => ({
        batch_number: b.batch_number || '',
        cost: b.cost ?? '',
        price: b.price ?? '',
        discount_type: b.discount_type || 'none',
        discount_value: b.discount_value ?? '',
        quantity: b.quantity ?? '',
        expiry_date: b.expiry_date ? String(b.expiry_date).slice(0, 10) : ''
      }))
      : []
  }
}

// ─────────────────────────────────────────────────────────────
// HOOK: all state, effects and handlers for EditGRN
// ─────────────────────────────────────────────────────────────
export const useEditGRN = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [form, setForm] = useState(null) // null until loaded
  const [locked, setLocked] = useState({ storeName: '', supplierName: '' })
  const [allProducts, setAllProducts] = useState([])
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [batchModal, setBatchModal] = useState(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // ── load the GRN + product catalog ──
  useEffect(() => {
    const load = async () => {
      setPageLoading(true)
      setError('')
      try {
        const [grnRes, productsRes] = await Promise.all([
          window.api.grn.getById(id),
          window.api.product.getAll()
        ])

        if (!grnRes?.success || !grnRes.grn) {
          setError(grnRes?.error || 'Failed to load this GRN.')
          return
        }

        const all = (productsRes?.products || productsRes?.data || []).filter((p) => p.status === 'active')
        setAllProducts(all)

        const grn = grnRes.grn
        setLocked({
          storeName: grn.store_id?.name || grn.store_id?.storeName || '—',
          supplierName: grn.supplier_id?.name || '—'
        })

        setForm({
          store_id: grn.store_id?._id || grn.store_id,
          supplier_id: grn.supplier_id?._id || grn.supplier_id,
          date: grn.date ? String(grn.date).slice(0, 10) : '',
          invoice_number: grn.invoice_number || '',
          payment_status: grn.payment_status || 'unpaid',
          payment_type: grn.payment_type || 'cash',
          cheque_details: grn.cheque_details || { cheque_number: '', due_date: '', holder_name: '' },
          products: (grn.products || []).map((line) => mapServerLineToEditable(line, all))
        })
      } catch (e) {
        console.error('Failed to load GRN for edit', e)
        setError('Something went wrong while loading this GRN.')
      } finally {
        setPageLoading(false)
      }
    }
    load()
  }, [id])

  // ── top-level field update ──
  const updateForm = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }))
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

  const removeProductLine = (idx) => {
    setForm((prev) => ({ ...prev, products: prev.products.filter((_, i) => i !== idx) }))
    setFieldErrors((prev) => {
      const e = { ...prev }
      Object.keys(e).forEach((k) => { if (k.startsWith(`products[${idx}]`)) delete e[k] })
      return e
    })
  }

  const updateProductLine = (idx, key, val) => {
    setForm((prev) => {
      const lines = [...prev.products]
      lines[idx] = { ...lines[idx], [key]: val }
      return { ...prev, products: lines }
    })
    const errKey = `products[${idx}].${key}`
    if (fieldErrors[errKey]) setFieldErrors((prev) => { const e = { ...prev }; delete e[errKey]; return e })
  }

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
    if (!form) return 0
    return form.products.reduce((sum, line) => {
      if (!line.batch_tracking) {
        return sum + calcLineTotal(num(line.cost), num(line.quantity), line.discount_type, num(line.discount_value))
      }
      return sum + line.batches.reduce(
        (bSum, b) => bSum + calcLineTotal(num(b.cost), num(b.quantity), b.discount_type, num(b.discount_value)),
        0
      )
    }, 0)
  }, [form])

  // ── submit ──
  const handleSubmit = async () => {
    setError('')
    setSaving(true)

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
        cost: !line.batch_tracking ? num(line.cost) : null,
        price: null,
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
      }))
    }

    try {
      const res = await window.api.grn.update(id, payload)
      if (res?.success) {
        navigate('/dashboard/grn')
      } else {
        if (res?.fieldErrors) setFieldErrors(res.fieldErrors)
        if (res?.error) setError(res.error)
      }
    } catch (e) {
      console.error('GRN update failed', e)
      setError('Something went wrong while updating the GRN. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ── loading / error states before the form is ready ──

  return {
    navigate,
    form,
    locked,
    allProducts,
    fieldErrors,
    error,
    batchModal,
    pageLoading,
    saving,
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
    handleSubmit
  }
}
