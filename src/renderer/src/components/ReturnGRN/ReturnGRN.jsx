import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatCurrency = (n) =>
  `Rs ${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`

const todayISO = () => new Date().toISOString().split('T')[0]

const paymentStatusBadge = {
  paid: 'bg-emerald-100 text-emerald-700',
  unpaid: 'bg-red-100 text-red-700',
  partial: 'bg-amber-100 text-amber-700'
}

// ─────────────────────────────────────────────────────────────
// FLATTEN GRN PRODUCTS → RETURN LINES
// Each non-batch product → 1 line.
// Each batch-tracked product → 1 line per batch inside it.
// ─────────────────────────────────────────────────────────────
const flattenToReturnLines = (products = []) => {
  const lines = []
  products.forEach((p) => {
    if (!p.batch_tracking) {
      lines.push({
        _lineKey: `${p._id}`,
        product_id: typeof p.product_id === 'object' ? p.product_id._id : p.product_id,
        product_name: p.product_name,
        structure: p.structure,
        variation_id: p.variation_id || null,
        variation_name: p.variation_name || null,
        batch_tracking: false,
        batch_number: null,
        cost: p.cost,
        price: p.price,
        discount_type: p.discount_type || 'none',
        discount_value: p.discount_value ?? null,
        quantity: p.quantity,
        expiry_date: null,
        return_quantity: ''
      })
    } else {
      ; (p.batches || []).forEach((b) => {
        lines.push({
          _lineKey: `${p._id}_${b._id}`,
          product_id: typeof p.product_id === 'object' ? p.product_id._id : p.product_id,
          product_name: p.product_name,
          structure: p.structure,
          variation_id: p.variation_id || null,
          variation_name: p.variation_name || null,
          batch_tracking: true,
          batch_number: b.batch_number,
          cost: b.cost,
          price: b.price,
          discount_type: b.discount_type || 'none',
          discount_value: b.discount_value ?? null,
          quantity: b.quantity,
          expiry_date: b.expiry_date || null,
          return_quantity: ''
        })
      })
    }
  })
  return lines
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────
const ReturnGRN = () => {
  const navigate = useNavigate()
  const { id } = useParams()

  // ── GRN snapshot ──
  const [grn, setGrn] = useState(null)
  const [loadingGrn, setLoadingGrn] = useState(true)
  const [loadError, setLoadError] = useState('')

  // ── Return lines (flattened from GRN products) ──
  const [lines, setLines] = useState([])

  // ── Return-level fields ──
  const [returnDate, setReturnDate] = useState(todayISO())
  const [paymentType, setPaymentType] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [chequeNumber, setChequeNumber] = useState('')
  const [chequeDueDate, setChequeDueDate] = useState('')
  const [chequeHolderName, setChequeHolderName] = useState('')
  const [returnReason, setReturnReason] = useState('')
  const [returnNote, setReturnNote] = useState('')

  // ── Submission state ──
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // ── Flash refs for invalid lines ──
  const lineRefs = useRef({})

  // ── Load GRN ──
  useEffect(() => {
    if (!id) return
    const load = async () => {
      setLoadingGrn(true)
      setLoadError('')
      try {
        const res = await window.api.grn.getById(id)
        if (res?.success && res.grn) {
          const g = res.grn
          setGrn(g)
          setLines(flattenToReturnLines(g.products || []))
          // pre-fill payment fields from the GRN
          setPaymentType(g.payment_type || '')
          setPaymentStatus(g.payment_status || '')
          if (g.payment_type === 'cheque' && g.cheque_details) {
            setChequeNumber(g.cheque_details.cheque_number || '')
            setChequeDueDate(
              g.cheque_details.due_date
                ? new Date(g.cheque_details.due_date).toISOString().split('T')[0]
                : ''
            )
            setChequeHolderName(g.cheque_details.holder_name || '')
          }
        } else {
          setLoadError(res?.error || 'Failed to load GRN.')
        }
      } catch (e) {
        console.error('Failed to load GRN for return', e)
        setLoadError('Failed to load GRN. Please try again.')
      } finally {
        setLoadingGrn(false)
      }
    }
    load()
  }, [id])

  // ── Update a single line's return_quantity with real-time validation ──
  const setLineQty = useCallback((lineKey, raw, maxQty) => {
    setLines((prev) =>
      prev.map((l) => (l._lineKey === lineKey ? { ...l, return_quantity: raw } : l))
    )
    setFieldErrors((prev) => {
      const next = { ...prev }
      const qty = parseFloat(raw)
      if (raw === '' || raw === '0') {
        delete next[`line_${lineKey}`]
      } else if (isNaN(qty) || qty <= 0) {
        next[`line_${lineKey}`] = 'Must be greater than 0'
      } else if (qty > maxQty) {
        next[`line_${lineKey}`] = `Cannot exceed received qty (${maxQty})`
      } else {
        delete next[`line_${lineKey}`]
      }
      return next
    })
  }, [])

  // ── Line total preview — cost × return_quantity only, no discount ──
  const calcLineTotal = (line) => {
    const qty = parseFloat(line.return_quantity) || 0
    return (line.cost || 0) * qty
  }

  const grandTotal = lines.reduce((sum, l) => sum + calcLineTotal(l), 0)

  // ── Validate and submit ──
  const handleSubmit = async () => {
    setFieldErrors({})
    setSubmitError('')
    setSuccessMsg('')

    const errors = {}

    if (!returnDate) errors.return_date = 'Return date is required'
    if (!paymentType) errors.payment_type = 'Payment type is required'
    if (!paymentStatus) errors.payment_status = 'Payment status is required'
    if (!returnReason) errors.return_reason = 'Return reason is required'
    if (paymentType === 'cheque') {
      if (!chequeNumber.trim()) errors['cheque_details.cheque_number'] = 'Cheque number is required'
      if (!chequeDueDate) errors['cheque_details.due_date'] = 'Cheque due date is required'
      if (!chequeHolderName.trim()) errors['cheque_details.holder_name'] = 'Holder name is required'
    }

    // Validate each line that has a return_quantity entered
    const activeLines = lines.filter((l) => String(l.return_quantity).trim() !== '')
    if (activeLines.length === 0) {
      errors.lines = 'Enter a return quantity for at least one product line.'
    }

    activeLines.forEach((l) => {
      const qty = parseFloat(l.return_quantity)
      if (isNaN(qty) || qty <= 0) {
        errors[`line_${l._lineKey}`] = 'Must be greater than 0'
      } else if (qty > l.quantity) {
        errors[`line_${l._lineKey}`] = `Cannot exceed received qty (${l.quantity})`
      }
    })

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      // flash any invalid line rows
      Object.keys(errors).forEach((key) => {
        if (key.startsWith('line_') && lineRefs.current[key]) {
          const el = lineRefs.current[key]
          el.classList.remove('grn-error-flash')
          void el.offsetWidth
          el.classList.add('grn-error-flash')
        }
      })
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        grn_id: id,
        store_id: typeof grn.store_id === 'object' ? grn.store_id._id : grn.store_id,
        supplier_id: typeof grn.supplier_id === 'object' ? grn.supplier_id._id : grn.supplier_id,
        grn_date: grn.date,
        return_date: returnDate,
        invoice_number: grn.invoice_number,
        payment_type: paymentType,
        payment_status: paymentStatus,
        return_reason: returnReason,
        note: returnNote.trim() || null,
        cheque_details:
          paymentType === 'cheque'
            ? { cheque_number: chequeNumber.trim(), due_date: chequeDueDate, holder_name: chequeHolderName.trim() }
            : null,
        products: activeLines.map((l) => ({
          product_id: l.product_id,
          product_name: l.product_name,
          structure: l.structure,
          variation_id: l.variation_id || null,
          variation_name: l.variation_name || null,
          batch_tracking: l.batch_tracking,
          batch_number: l.batch_number || null,
          cost: l.cost,
          price: l.price,
          discount_type: l.discount_type,
          discount_value: l.discount_value,
          quantity: l.quantity,
          return_quantity: parseFloat(l.return_quantity),
          expiry_date: l.expiry_date || null
        }))
      }

      const res = await window.api.grnReturn.create(payload)
      if (res?.success) {
        setSuccessMsg('Return saved and stock adjusted successfully.')
        setTimeout(() => navigate('/dashboard/grn/return'), 1500)
      } else if (res?.fieldErrors) {
        setFieldErrors(res.fieldErrors)
        setSubmitError('Please fix the errors below and try again.')
      } else {
        setSubmitError(res?.error || 'Failed to save return. Please try again.')
      }
    } catch (e) {
      console.error('Failed to submit GRN return', e)
      setSubmitError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-full px-8 pt-8 pb-0 overflow-hidden">
      <style>{`
        @keyframes grnErrorFlash {
          0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); background-color: transparent; }
          15%, 60% { box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.35); background-color: rgba(254, 226, 226, 0.6); }
        }
        .grn-error-flash { animation: grnErrorFlash 1.6s ease-out; border-radius: 0.75rem; }
      `}</style>

      <div className="flex flex-col h-[630px]">

        {/* Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-[880px] h-[780px] bg-[#2699aa] opacity-40 rounded-full right-[-200px] bottom-[-200px]" />
          <div className="absolute w-[580px] h-[580px] bg-[#30aabb] opacity-25 rounded-full right-[-120px] bottom-[-120px]" />
          <div className="absolute w-[420px] h-[420px] bg-[#2699aa] opacity-30 rounded-full left-[-80px] top-[-80px]" />
        </div>

        {/* Title */}
        <div className="relative z-10 mb-5">
          <h1 className="text-white text-[22px] font-semibold m-0">Stock Returning</h1>
          <p className="text-[#90bcc4] text-[15px] mt-1">Enter return stock details to return</p>
        </div>

        {/* Card */}
        <div
          className="relative z-10 bg-white w-full px-10 py-10 shadow-xl rounded-t-[20px] overflow-auto"
          style={{ height: 'calc(100% - 70px)' }}
        >

          {/* ── Loading ── */}
          {loadingGrn && (
            <div className="flex items-center justify-center py-20 text-gray-400 text-sm gap-2">
              <i className="fas fa-spinner fa-spin" /> Loading GRN…
            </div>
          )}

          {/* ── Load error ── */}
          {!loadingGrn && loadError && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-red-500">
              <i className="fas fa-exclamation-triangle text-3xl" />
              <p className="text-sm font-medium">{loadError}</p>
              <button
                onClick={() => navigate('/dashboard/grn')}
                className="text-sm text-[#1a6b7a] underline"
              >
                Back to GRN list
              </button>
            </div>
          )}

          {/* ── Main form ── */}
          {!loadingGrn && grn && (
            <div className="flex flex-col gap-8">

              {/* ── GRN Info banner ── */}
              <div className="bg-gray-50 border-2 border-gray-200 rounded-xl px-6 py-4 flex flex-wrap gap-6 text-sm">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">Invoice #</p>
                  <p className="font-bold text-gray-800">{grn.invoice_number}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">Store</p>
                  <p className="font-medium text-gray-700">{grn.store_id?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">Supplier</p>
                  <p className="font-medium text-gray-700">{grn.supplier_id?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">GRN Date</p>
                  <p className="font-medium text-gray-700">{formatDate(grn.date)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">Original Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${paymentStatusBadge[grn.payment_status] || 'bg-gray-100 text-gray-600'}`}>
                    {grn.payment_status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">Grand Total</p>
                  <p className="font-bold text-[#1a6b7a]">{formatCurrency(grn.grand_total)}</p>
                </div>
              </div>

              {/* ── Return header fields ── */}
              <div className="grid grid-cols-4 gap-5">

                {/* Return Date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                    Return Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => { setReturnDate(e.target.value); setFieldErrors((p) => { const n = { ...p }; delete n.return_date; return n }) }}
                    className={`w-full border-2 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#1a6b7a] ${fieldErrors.return_date ? 'border-red-400' : 'border-gray-300'}`}
                  />
                  {fieldErrors.return_date && <p className="text-xs text-red-500 mt-1">{fieldErrors.return_date}</p>}
                </div>

                {/* Payment Type */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                    Payment Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={paymentType}
                    onChange={(e) => { setPaymentType(e.target.value); setFieldErrors((p) => { const n = { ...p }; delete n.payment_type; return n }) }}
                    className={`w-full border-2 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#1a6b7a] ${fieldErrors.payment_type ? 'border-red-400' : 'border-gray-300'}`}
                  >
                    <option value="">Select type</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="cheque">Cheque</option>
                  </select>
                  {fieldErrors.payment_type && <p className="text-xs text-red-500 mt-1">{fieldErrors.payment_type}</p>}
                </div>

                {/* Payment Status */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                    Payment Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => { setPaymentStatus(e.target.value); setFieldErrors((p) => { const n = { ...p }; delete n.payment_status; return n }) }}
                    className={`w-full border-2 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#1a6b7a] ${fieldErrors.payment_status ? 'border-red-400' : 'border-gray-300'}`}
                  >
                    <option value="">Select status</option>
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="partial">Partial</option>
                  </select>
                  {fieldErrors.payment_status && <p className="text-xs text-red-500 mt-1">{fieldErrors.payment_status}</p>}
                </div>
              </div>

              {/* ── Cheque fields ── */}
              {paymentType === 'cheque' && (
                <div className="grid grid-cols-3 gap-5 bg-amber-50 border-2 border-amber-200 rounded-xl px-6 py-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                      Cheque Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="CHQ-001"
                      value={chequeNumber}
                      onChange={(e) => { setChequeNumber(e.target.value); setFieldErrors((p) => { const n = { ...p }; delete n['cheque_details.cheque_number']; return n }) }}
                      className={`w-full border-2 rounded-xl px-4 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:border-[#1a6b7a] ${fieldErrors['cheque_details.cheque_number'] ? 'border-red-400' : 'border-gray-300'}`}
                    />
                    {fieldErrors['cheque_details.cheque_number'] && <p className="text-xs text-red-500 mt-1">{fieldErrors['cheque_details.cheque_number']}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                      Due Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={chequeDueDate}
                      onChange={(e) => { setChequeDueDate(e.target.value); setFieldErrors((p) => { const n = { ...p }; delete n['cheque_details.due_date']; return n }) }}
                      className={`w-full border-2 rounded-xl px-4 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:border-[#1a6b7a] ${fieldErrors['cheque_details.due_date'] ? 'border-red-400' : 'border-gray-300'}`}
                    />
                    {fieldErrors['cheque_details.due_date'] && <p className="text-xs text-red-500 mt-1">{fieldErrors['cheque_details.due_date']}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                      Holder Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Holder name"
                      value={chequeHolderName}
                      onChange={(e) => { setChequeHolderName(e.target.value); setFieldErrors((p) => { const n = { ...p }; delete n['cheque_details.holder_name']; return n }) }}
                      className={`w-full border-2 rounded-xl px-4 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:border-[#1a6b7a] ${fieldErrors['cheque_details.holder_name'] ? 'border-red-400' : 'border-gray-300'}`}
                    />
                    {fieldErrors['cheque_details.holder_name'] && <p className="text-xs text-red-500 mt-1">{fieldErrors['cheque_details.holder_name']}</p>}
                  </div>
                </div>
              )}

              {/* ── Products table ── */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Product Lines</h2>
                  <p className="text-xs text-gray-400">Leave quantity blank to skip a line</p>
                </div>

                {fieldErrors.lines && (
                  <div className="mb-3 bg-red-50 border-2 border-red-300 text-red-600 text-xs font-medium px-4 py-2.5 rounded-xl flex items-center gap-2">
                    <i className="fas fa-exclamation-circle" />
                    {fieldErrors.lines}
                  </div>
                )}

                <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 border-gray-200 text-left">
                        <th className="px-4 py-3 font-bold text-gray-500 text-xs uppercase">Product</th>
                        <th className="px-4 py-3 font-bold text-gray-500 text-xs uppercase">Variation</th>
                        <th className="px-4 py-3 font-bold text-gray-500 text-xs uppercase">Batch #</th>
                        <th className="px-4 py-3 font-bold text-gray-500 text-xs uppercase">Expiry</th>
                        <th className="px-4 py-3 font-bold text-gray-500 text-xs uppercase text-right">Cost</th>
                        <th className="px-4 py-3 font-bold text-gray-500 text-xs uppercase text-center">Recv Qty</th>
                        <th className="px-4 py-3 font-bold text-gray-500 text-xs uppercase text-center">Return Qty</th>
                        <th className="px-4 py-3 font-bold text-gray-500 text-xs uppercase text-right">Return Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line) => {
                        const errKey = `line_${line._lineKey}`
                        const hasError = !!fieldErrors[errKey]
                        const lineTotal = calcLineTotal(line)
                        const hasQty = String(line.return_quantity).trim() !== ''

                        return (
                          <tr
                            key={line._lineKey}
                            ref={(el) => { if (el) lineRefs.current[errKey] = el }}
                            className="border-b border-gray-100 last:border-0"
                          >
                            <td className="px-4 py-3 font-medium text-gray-800">{line.product_name}</td>
                            <td className="px-4 py-3 text-gray-500">{line.variation_name || '—'}</td>
                            <td className="px-4 py-3 text-gray-500">
                              {line.batch_number
                                ? <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-2 py-0.5 rounded-full">{line.batch_number}</span>
                                : '—'}
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(line.expiry_date)}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(line.cost)}</td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                {line.quantity}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  max={line.quantity}
                                  step="1"
                                  placeholder="0"
                                  value={line.return_quantity}
                                  onChange={(e) => setLineQty(line._lineKey, e.target.value, line.quantity)}
                                  onBlur={(e) => {
                                    const v = e.target.value.trim()
                                    if (v === '' || v === '0') setLineQty(line._lineKey, '', line.quantity)
                                  }}
                                  className={`w-24 text-center border-2 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-[#1a6b7a] ${hasError ? 'border-red-400 text-red-600' : 'border-gray-300 text-gray-700'}`}
                                />
                                {hasError && <p className="text-xs text-red-500 text-center">{fieldErrors[errKey]}</p>}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-[#1a6b7a]">
                              {hasQty ? formatCurrency(lineTotal) : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Reason & Note ── */}
              <div className="grid grid-cols-2 gap-5">

                {/* Return Reason */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                    Return Reason <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={returnReason}
                    onChange={(e) => { setReturnReason(e.target.value); setFieldErrors((p) => { const n = { ...p }; delete n.return_reason; return n }) }}
                    className={`w-full border-2 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#1a6b7a] ${fieldErrors.return_reason ? 'border-red-400' : 'border-gray-300'}`}
                  >
                    <option value="">Select reason</option>
                    <option value="damaged">Damaged goods</option>
                    <option value="expired">Expired / near expiry</option>
                    <option value="wrong_item">Wrong item delivered</option>
                    <option value="overstock">Overstock</option>
                    <option value="quality_issue">Quality issue</option>
                    <option value="other">Other</option>
                  </select>
                  {fieldErrors.return_reason && <p className="text-xs text-red-500 mt-1">{fieldErrors.return_reason}</p>}
                </div>

                {/* Note */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                    Note <span className="text-gray-400 font-normal normal-case">(optional)</span>
                  </label>
                  <textarea
                    rows={1}
                    placeholder="Any additional details about this return…"
                    value={returnNote}
                    onChange={(e) => setReturnNote(e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#1a6b7a] resize-none"
                  />
                </div>

              </div>


              {/* ── Grand Total + Submit ── */}
              <div className="flex justify-between items-end">

                {/* Error / Success banners */}
                <div className="flex-1 mr-8">
                  {submitError && (
                    <div className="bg-red-50 border-2 border-red-400 text-red-700 text-sm font-medium px-4 py-3 rounded-xl flex items-start gap-2">
                      <i className="fas fa-exclamation-triangle mt-0.5" />
                      <span>{submitError}</span>
                    </div>
                  )}
                  {successMsg && (
                    <div className="bg-emerald-50 border-2 border-emerald-400 text-emerald-700 text-sm font-medium px-4 py-3 rounded-xl flex items-center gap-2">
                      <i className="fas fa-check-circle" />
                      <span>{successMsg}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-xs font-semibold text-gray-400 uppercase">Return Grand Total</p>
                    <p className="text-2xl font-bold text-[#1a6b7a]">{formatCurrency(grandTotal)}</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => navigate('/dashboard/grn')}
                      disabled={submitting}
                      className="border-2 border-gray-300 text-gray-600 text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="bg-[#1a6b7a] border-2 border-[#1a6b7a] text-white text-sm font-bold px-8 py-2.5 rounded-xl hover:opacity-90 transition-colors disabled:opacity-60 flex items-center gap-2"
                    >
                      {submitting
                        ? <><i className="fas fa-spinner fa-spin" /> Saving…</>
                        : <><i className="fas fa-rotate-left" /> Save Return</>
                      }
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReturnGRN
