import React, { useState, useEffect, useMemo } from 'react'

const paymentStatusBadge = {
  paid: 'bg-emerald-100 text-emerald-700',
  unpaid: 'bg-red-100 text-red-700',
  partial: 'bg-amber-100 text-amber-700'
}

const paymentTypeIcon = {
  cash: 'money-bill',
  card: 'credit-card',
  cheque: 'money-check'
}

const returnReasonLabel = {
  damaged: 'Damaged goods',
  expired: 'Expired / near expiry',
  wrong_item: 'Wrong item delivered',
  overstock: 'Overstock',
  quality_issue: 'Quality issue',
  other: 'Other'
}

const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatCurrency = (n) =>
  `Rs ${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`

const ViewReturnGRN = () => {
  const [returns, setReturns] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // ── Pagination state ──
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await window.api.grnReturn.getAll()
        if (res?.success) {
          setReturns(res.grnReturns || [])
        } else {
          setError(res?.error || 'Failed to load return records.')
        }
      } catch (e) {
        console.error('Failed to load GRN returns', e)
        setError('Failed to load return records. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    setCurrentPage(1)
    const term = search.trim().toLowerCase()
    if (!term) return returns
    return returns.filter((r) =>
      r.invoice_number?.toLowerCase().includes(term) ||
      r.store_id?.name?.toLowerCase().includes(term) ||
      r.supplier_id?.name?.toLowerCase().includes(term) ||
      returnReasonLabel[r.return_reason]?.toLowerCase().includes(term)
    )
  }, [returns, search])

  // ── Pagination calculations ──
  const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(filtered.length / itemsPerPage)

  const paginatedReturns = useMemo(() => {
    if (itemsPerPage === 'all') return filtered
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, currentPage, itemsPerPage])

  const handleItemsPerPageChange = (val) => {
    setItemsPerPage(val === 'all' ? 'all' : Number(val))
    setCurrentPage(1)
  }

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id))

  const requestDelete = (e, ret) => {
    e.stopPropagation()
    setDeleteError('')
    setDeleteTarget(ret)
  }

  const cancelDelete = () => {
    if (deleting) return
    setDeleteTarget(null)
    setDeleteError('')
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError('')
    try {
      const res = await window.api.grnReturn.delete(deleteTarget._id)
      if (res?.success) {
        setReturns((prev) => prev.filter((r) => r._id !== deleteTarget._id))
        if (expandedId === deleteTarget._id) setExpandedId(null)
        setDeleteTarget(null)
      } else {
        setDeleteError(res?.error || 'Failed to delete this return record.')
      }
    } catch (e) {
      console.error('Failed to delete GRN return', e)
      setDeleteError('Something went wrong while deleting. Please try again.')
    } finally {
      setDeleting(false)
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
          <h1 className="text-white text-[22px] font-semibold m-0">Stock Returns</h1>
          <p className="text-[#90bcc4] text-[15px] mt-1">View and manage returned stock records</p>
        </div>

        {/* Card */}
        <div
          className="relative z-10 bg-white w-full px-7 py-3 shadow-xl rounded-t-[20px] overflow-auto"
          style={{ height: 'calc(100% - 70px)' }}
        >
          {/* Search bar */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex mt-4 gap-2">
              <input
                type="text"
                placeholder="Search by invoice, store, supplier or reason…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-2 border-gray-400 rounded-lg focus:outline-none focus:border-[#1a6b7a] text-sm text-gray-700 placeholder-gray-400 p-3 w-96 bg-transparent"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 bg-red-50 border-2 border-red-400 text-red-700 text-sm font-medium px-4 py-3 rounded-xl flex items-start gap-2">
              <i className="fas fa-exclamation-triangle mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
              <i className="fas fa-spinner fa-spin" /> Loading return records…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
              <i className="fas fa-rotate-left text-3xl" />
              <p className="text-sm">No return records found.</p>
            </div>
          ) : (
            <>
              <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b-2 border-gray-200 text-left">
                      <th className="px-4 py-3 font-bold text-gray-600 text-xs uppercase tracking-wide">Invoice #</th>
                      <th className="px-4 py-3 font-bold text-gray-600 text-xs uppercase tracking-wide">Store</th>
                      <th className="px-4 py-3 font-bold text-gray-600 text-xs uppercase tracking-wide">Supplier</th>
                      <th className="px-4 py-3 font-bold text-gray-600 text-xs uppercase tracking-wide">Return Date</th>
                      <th className="px-4 py-3 font-bold text-gray-600 text-xs uppercase tracking-wide">Reason</th>
                      <th className="px-4 py-3 font-bold text-gray-600 text-xs uppercase tracking-wide">Payment</th>
                      <th className="px-4 py-3 font-bold text-gray-600 text-xs uppercase tracking-wide text-right">Grand Total</th>
                      <th className="px-4 py-3 font-bold text-gray-600 text-xs uppercase tracking-wide text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedReturns.map((r) => (
                      <React.Fragment key={r._id}>
                        <tr
                          onClick={() => toggleExpand(r._id)}
                          className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3 font-semibold text-gray-800">{r.invoice_number}</td>
                          <td className="px-4 py-3 text-gray-600">{r.store_id?.name || '—'}</td>
                          <td className="px-4 py-3 text-gray-600">{r.supplier_id?.name || '—'}</td>
                          <td className="px-4 py-3 text-gray-600">{formatDate(r.return_date)}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-600">
                              <i className="fas fa-tag text-[10px]" />
                              {returnReasonLabel[r.return_reason] || r.return_reason || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold capitalize ${paymentStatusBadge[r.payment_status] || 'bg-gray-100 text-gray-600'}`}>
                              {r.payment_status}
                            </span>
                            <span className="ml-2 text-xs text-gray-400 capitalize">
                              <i className={`fas fa-${paymentTypeIcon[r.payment_type] || 'wallet'} mr-1`} />
                              {r.payment_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-[#1a6b7a]">{formatCurrency(r.grand_total)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-3">
                              <button
                                onClick={(e) => requestDelete(e, r)}
                                title="Delete return record"
                                className="text-red-400 hover:text-red-600 transition-colors p-1"
                              >
                                <i className="fas fa-trash text-sm" />
                              </button>
                              <i className={`fas fa-chevron-${expandedId === r._id ? 'up' : 'down'} text-gray-400 text-xs`} />
                            </div>
                          </td>
                        </tr>

                        {/* Expanded detail row */}
                        {expandedId === r._id && (
                          <tr>
                            <td colSpan={8} className="bg-gray-50 px-4 py-4">
                              <div className="flex flex-col gap-3">

                                {/* GRN reference + note strip */}
                                <div className="flex flex-wrap gap-6 text-xs text-gray-500 px-1">
                                  <span>
                                    <span className="font-semibold text-gray-600">GRN Date: </span>
                                    {formatDate(r.grn_date)}
                                  </span>
                                  {r.note && (
                                    <span>
                                      <span className="font-semibold text-gray-600">Note: </span>
                                      {r.note}
                                    </span>
                                  )}
                                  {r.payment_type === 'cheque' && r.cheque_details && (
                                    <>
                                      <span><span className="font-semibold text-gray-600">Cheque #</span> {r.cheque_details.cheque_number}</span>
                                      <span><span className="font-semibold text-gray-600">Due</span> {formatDate(r.cheque_details.due_date)}</span>
                                      <span><span className="font-semibold text-gray-600">Holder</span> {r.cheque_details.holder_name}</span>
                                    </>
                                  )}
                                </div>

                                {/* Product lines table */}
                                <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="bg-gray-50 border-b border-gray-200 text-left">
                                        <th className="px-3 py-2 font-bold text-gray-500 text-xs uppercase">Product</th>
                                        <th className="px-3 py-2 font-bold text-gray-500 text-xs uppercase">Variation</th>
                                        <th className="px-3 py-2 font-bold text-gray-500 text-xs uppercase">Batch #</th>
                                        <th className="px-3 py-2 font-bold text-gray-500 text-xs uppercase">Expiry</th>
                                        <th className="px-3 py-2 font-bold text-gray-500 text-xs uppercase text-center">Recv Qty</th>
                                        <th className="px-3 py-2 font-bold text-gray-500 text-xs uppercase text-center">Return Qty</th>
                                        <th className="px-3 py-2 font-bold text-gray-500 text-xs uppercase text-right">Cost</th>
                                        <th className="px-3 py-2 font-bold text-gray-500 text-xs uppercase text-right">Return Total</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(r.products || []).map((p) => (
                                        <tr key={p._id} className="border-b border-gray-100 last:border-0">
                                          <td className="px-3 py-2 text-gray-700 font-medium">{p.product_name}</td>
                                          <td className="px-3 py-2 text-gray-500">{p.variation_name || '—'}</td>
                                          <td className="px-3 py-2">
                                            {p.batch_number
                                              ? <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-2 py-0.5 rounded-full">{p.batch_number}</span>
                                              : <span className="text-gray-400">—</span>}
                                          </td>
                                          <td className="px-3 py-2 text-gray-500 text-xs">{formatDate(p.expiry_date)}</td>
                                          <td className="px-3 py-2 text-center">
                                            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{p.quantity}</span>
                                          </td>
                                          <td className="px-3 py-2 text-center">
                                            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{p.return_quantity}</span>
                                          </td>
                                          <td className="px-3 py-2 text-right text-gray-600">{formatCurrency(p.cost)}</td>
                                          <td className="px-3 py-2 text-right font-semibold text-[#1a6b7a]">{formatCurrency(p.return_total)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>

                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Pagination footer ── */}
              <div className="flex items-center justify-between mt-3 flex-wrap gap-2">

                {/* Left: count + items per page */}
                <div className="flex items-center gap-3">
                  <p className="text-md text-gray-500">
                    {itemsPerPage === 'all'
                      ? `Showing all ${filtered.length} record${filtered.length !== 1 ? 's' : ''}`
                      : `Showing ${Math.min((currentPage - 1) * itemsPerPage + 1, filtered.length)}–${Math.min(currentPage * itemsPerPage, filtered.length)} of ${filtered.length} record${filtered.length !== 1 ? 's' : ''}`}
                  </p>
                  <div className="flex items-center gap-1">
                    <span className="text-md text-gray-500">Per page:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(e.target.value)}
                      className="border border-gray-300 rounded text-md text-gray-600 px-2 py-1 focus:outline-none focus:border-[#1a6b7a]"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value="all">All</option>
                    </select>
                  </div>
                </div>

                {/* Right: prev / page numbers / next */}
                {itemsPerPage !== 'all' && totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-md rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <i className="fas fa-chevron-left mr-1" />
                      Prev
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                      .reduce((acc, page, idx, arr) => {
                        if (idx > 0 && page - arr[idx - 1] > 1) acc.push('...')
                        acc.push(page)
                        return acc
                      }, [])
                      .map((item, idx) =>
                        item === '...' ? (
                          <span key={`dots-${idx}`} className="px-2 text-md text-gray-500">…</span>
                        ) : (
                          <button
                            key={item}
                            onClick={() => setCurrentPage(item)}
                            className={`px-3 py-1 text-md rounded border ${currentPage === item
                              ? 'bg-[#1a6b7a] text-white border-[#1a6b7a]'
                              : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                              }`}
                          >
                            {item}
                          </button>
                        )
                      )}

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-md rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next
                      <i className="fas fa-chevron-right ml-1" />
                    </button>
                  </div>
                )}

              </div>
            </>
          )}

          {/* Delete confirmation modal */}
          {deleteTarget && (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
              onMouseDown={cancelDelete}
            >
              <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="px-6 py-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-exclamation-triangle text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Delete return record?</h3>
                      <p className="text-xs text-gray-400">This will restore the returned stock back to products</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    You're about to delete the return for invoice{' '}
                    <span className="font-semibold text-gray-800">{deleteTarget.invoice_number}</span>
                    {' '}from{' '}
                    <span className="font-semibold text-gray-800">{deleteTarget.supplier_id?.name || 'this supplier'}</span>.
                    The stock quantities that were deducted will be added back to the products.
                  </p>
                  {deleteError && (
                    <p className="mt-3 text-xs font-medium text-red-600 flex items-center gap-1.5">
                      <i className="fas fa-exclamation-circle" /> {deleteError}
                    </p>
                  )}
                </div>
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                  <button
                    type="button"
                    onClick={cancelDelete}
                    disabled={deleting}
                    className="border-2 border-gray-300 text-gray-600 text-sm font-semibold px-5 py-2 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    disabled={deleting}
                    className="bg-red-600 border-2 border-red-600 text-white text-sm font-bold px-5 py-2 rounded-xl hover:bg-red-700 disabled:opacity-60 transition-colors flex items-center gap-2"
                  >
                    {deleting
                      ? <><i className="fas fa-spinner fa-spin" /> Deleting…</>
                      : <><i className="fas fa-trash" /> Delete</>}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default ViewReturnGRN
