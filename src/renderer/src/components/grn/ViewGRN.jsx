import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

// ─────────────────────────────────────────────────────────────
// STATUS BADGES
// ─────────────────────────────────────────────────────────────
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

const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatCurrency = (n) =>
  `Rs ${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`

const ViewGRN = () => {
  const navigate = useNavigate()
  const [grns, setGrns] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  // ── Filter state ──
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // ── Pagination state ──
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await window.api.grn.getAll()
        if (res?.success) {
          setGrns(res.grns || [])
        } else {
          setError(res?.error || 'Failed to load GRNs')
        }
      } catch (e) {
        console.error('Failed to load GRNs', e)
        setError('Failed to load GRNs. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredGrns = useMemo(() => {
    setCurrentPage(1)
    const term = search.trim().toLowerCase()
    const from = dateFrom ? new Date(dateFrom) : null
    const to = dateTo ? new Date(`${dateTo}T23:59:59`) : null

    const result = grns.filter((g) => {
      const matchesSearch = !term ||
        g.invoice_number?.toLowerCase().includes(term) ||
        g.store_id?.name?.toLowerCase().includes(term) ||
        g.supplier_id?.name?.toLowerCase().includes(term)

      const matchesPaymentType = paymentTypeFilter === 'all' || g.payment_type === paymentTypeFilter
      const matchesPaymentStatus = paymentStatusFilter === 'all' || g.payment_status === paymentStatusFilter

      const grnDate = g.date ? new Date(g.date) : null
      const matchesFrom = !from || (grnDate && grnDate >= from)
      const matchesTo = !to || (grnDate && grnDate <= to)

      return matchesSearch && matchesPaymentType && matchesPaymentStatus && matchesFrom && matchesTo
    })

    return result
  }, [grns, search, paymentTypeFilter, paymentStatusFilter, dateFrom, dateTo])

  const hasActiveFilters = search || paymentTypeFilter !== 'all' || paymentStatusFilter !== 'all' || dateFrom || dateTo

  const clearFilters = () => {
    setSearch('')
    setPaymentTypeFilter('all')
    setPaymentStatusFilter('all')
    setDateFrom('')
    setDateTo('')
  }

  // ── Pagination calculations ──
  const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(filteredGrns.length / itemsPerPage)

  const paginatedGrns = useMemo(() => {
    if (itemsPerPage === 'all') return filteredGrns
    const start = (currentPage - 1) * itemsPerPage
    return filteredGrns.slice(start, start + itemsPerPage)
  }, [filteredGrns, currentPage, itemsPerPage])

  const handleItemsPerPageChange = (val) => {
    setItemsPerPage(val === 'all' ? 'all' : Number(val))
    setCurrentPage(1)
  }

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id))

  const requestDelete = (e, grn) => {
    e.stopPropagation()
    setDeleteError('')
    setDeleteTarget(grn)
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
      const res = await window.api.grn.delete(deleteTarget._id)
      if (res?.success) {
        setGrns((prev) => prev.filter((g) => g._id !== deleteTarget._id))
        if (expandedId === deleteTarget._id) setExpandedId(null)
        setDeleteTarget(null)
      } else {
        setDeleteError(res?.error || 'Failed to delete this stock record.')
      }
    } catch (e) {
      console.error('Failed to delete GRN', e)
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
          <h1 className="text-white text-[22px] font-semibold m-0">Stock</h1>
          <p className="text-[#90bcc4] text-[15px] mt-1">Manage stocks records</p>
        </div>

        {/* Card */}
        <div
          className="relative z-10 bg-white w-full px-7 py-[10px] shadow-xl rounded-t-[20px] overflow-auto"
          style={{ height: 'calc(100% - 70px)' }}
        >
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="flex mt-4 gap-2 flex-wrap items-center">
                <input
                  type="text"
                  placeholder="Search from invoice, store or supplier"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border-2 border-gray-400 rounded-lg focus:outline-none focus:border-[#1a6b7a] text-sm text-gray-700 placeholder-gray-400 p-3 w-72 bg-transparent"
                />

                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    max={dateTo || undefined}
                    title="From date"
                    className="border-2 border-gray-400 rounded-lg focus:outline-none focus:border-[#1a6b7a] text-sm text-gray-700 p-3 bg-transparent"
                  />
                  <span className="text-gray-400 text-sm">to</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    min={dateFrom || undefined}
                    title="To date"
                    className="border-2 border-gray-400 rounded-lg focus:outline-none focus:border-[#1a6b7a] text-sm text-gray-700 p-3 bg-transparent"
                  />
                </div>

                <select
                  value={paymentTypeFilter}
                  onChange={(e) => setPaymentTypeFilter(e.target.value)}
                  className="border-2 border-gray-400 rounded-lg focus:outline-none focus:border-[#1a6b7a] text-sm text-gray-700 p-3 bg-transparent"
                >
                  <option value="all">Payment types</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="cheque">Cheque</option>
                </select>

                <select
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  className="border-2 border-gray-400 rounded-lg focus:outline-none focus:border-[#1a6b7a] text-sm text-gray-700 p-3 bg-transparent"
                >
                  <option value="all">Payment Status</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partial</option>
                </select>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gray-500 hover:text-[#1a6b7a] font-medium px-2 py-1"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <button
                onClick={() => navigate('/dashboard/grn/create')}
                className="bg-[#1a6b7a] border-2 border-[#1a6b7a] mt-4 text-white text-md px-6 py-3 rounded-lg hover:opacity-90"
              >
                + Get Stock
              </button>
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
              <i className="fas fa-spinner fa-spin" /> Loading stock records…
            </div>
          ) : filteredGrns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
              <i className="fas fa-box-open text-3xl" />
              <p className="text-sm">No stock records found.</p>
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
                      <th className="px-4 py-3 font-bold text-gray-600 text-xs uppercase tracking-wide">Date</th>
                      <th className="px-4 py-3 font-bold text-gray-600 text-xs uppercase tracking-wide">Items</th>
                      <th className="px-4 py-3 font-bold text-gray-600 text-xs uppercase tracking-wide">Payment</th>
                      <th className="px-4 py-3 font-bold text-gray-600 text-xs uppercase tracking-wide text-right">Grand total</th>
                      <th className="px-4 py-3 font-bold text-gray-600 text-xs uppercase tracking-wide text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedGrns.map((g) => (
                      <React.Fragment key={g._id}>
                        <tr
                          onClick={() => toggleExpand(g._id)}
                          className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3 font-semibold text-gray-800">
                            {g.invoice_number}
                            {g.is_returned && (
                              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-600 align-middle">
                                <i className="fas fa-rotate-left text-[9px]" />
                                Returned
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{g.store_id?.name || '—'}</td>
                          <td className="px-4 py-3 text-gray-600">{g.supplier_id?.name || '—'}</td>
                          <td className="px-4 py-3 text-gray-600">{formatDate(g.date)}</td>
                          <td className="px-4 py-3 text-gray-600">{g.products?.length || 0}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold capitalize ${paymentStatusBadge[g.payment_status] || 'bg-gray-100 text-gray-600'}`}>
                              {g.payment_status}
                            </span>
                            <span className="ml-2 text-xs text-gray-400 capitalize">
                              <i className={`fas fa-${paymentTypeIcon[g.payment_type] || 'wallet'} mr-1`} />
                              {g.payment_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-[#1a6b7a]">{formatCurrency(g.grand_total)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-3">
                              <button
                                onClick={() => navigate(`/dashboard/grn/edit/${g._id}`)}
                                className="text-blue-500 text-sm px-3 py-1 rounded hover:opacity-90"
                              >
                                <i className="fas fa-pen"></i>
                              </button>
                              {g.is_returned ? (
                                <span
                                  title="This stock record has already been returned"
                                  className="text-gray-300 p-1 cursor-not-allowed"
                                >
                                  <i className="fas fa-rotate-left text-sm" />
                                </span>
                              ) : (
                                <button
                                  onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/grn/return/${g._id}`) }}
                                  title="Return stock"
                                  className="text-amber-500 hover:text-amber-700 transition-colors p-1"
                                >
                                  <i className="fas fa-rotate-left text-sm" />
                                </button>
                              )}
                              <button
                                onClick={(e) => requestDelete(e, g)}
                                title="Delete stock record"
                                className="text-red-400 hover:text-red-600 transition-colors p-1"
                              >
                                <i className="fas fa-trash text-sm" />
                              </button>
                              <i className={`fas fa-chevron-${expandedId === g._id ? 'up' : 'down'} text-gray-400 text-xs`} />
                            </div>
                          </td>
                        </tr>

                        {expandedId === g._id && (
                          <tr>
                            <td colSpan={8} className="bg-gray-50 px-4 py-4">
                              <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200 text-left">
                                      <th className="px-3 py-2 font-bold text-gray-500 text-xs uppercase">Product</th>
                                      <th className="px-3 py-2 font-bold text-gray-500 text-xs uppercase">Variation</th>
                                      <th className="px-3 py-2 font-bold text-gray-500 text-xs uppercase">Batch tracked</th>
                                      <th className="px-3 py-2 font-bold text-gray-500 text-xs uppercase">Quantity</th>
                                      <th className="px-3 py-2 font-bold text-gray-500 text-xs uppercase text-right">Line total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(g.products || []).map((p) => (
                                      <tr key={p._id} className="border-b border-gray-100 last:border-0">
                                        <td className="px-3 py-2 text-gray-700 font-medium">{p.product_name}</td>
                                        <td className="px-3 py-2 text-gray-500">{p.variation_name || '—'}</td>
                                        <td className="px-3 py-2 text-gray-500">{p.batch_tracking ? 'Yes' : 'No'}</td>
                                        <td className="px-3 py-2 text-gray-500">
                                          {p.batch_tracking
                                            ? p.batches.reduce((sum, b) => sum + (b.quantity || 0), 0)
                                            : p.quantity}
                                        </td>
                                        <td className="px-3 py-2 text-right font-semibold text-gray-700">{formatCurrency(p.line_total)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>

                                {g.payment_type === 'cheque' && g.cheque_details && (
                                  <div className="px-3 py-2 bg-amber-50 border-t border-amber-100 text-xs text-amber-700 flex gap-4">
                                    <span><strong>Cheque #</strong> {g.cheque_details.cheque_number}</span>
                                    <span><strong>Due</strong> {formatDate(g.cheque_details.due_date)}</span>
                                    <span><strong>Holder</strong> {g.cheque_details.holder_name}</span>
                                  </div>
                                )}
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
                      ? `Showing all ${filteredGrns.length} record${filteredGrns.length !== 1 ? 's' : ''}`
                      : `Showing ${Math.min((currentPage - 1) * itemsPerPage + 1, filteredGrns.length)}–${Math.min(currentPage * itemsPerPage, filteredGrns.length)} of ${filteredGrns.length} record${filteredGrns.length !== 1 ? 's' : ''}`}
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
                      <h3 className="text-base font-bold text-gray-900">Delete stock record?</h3>
                      <p className="text-xs text-gray-400">This action cannot be undone</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    You're about to delete GRN{' '}
                    <span className="font-semibold text-gray-800">{deleteTarget.invoice_number}</span>
                    {' '}received from{' '}
                    <span className="font-semibold text-gray-800">{deleteTarget.supplier_id?.name || 'this supplier'}</span>.
                    The stock quantities this record added will not be automatically reversed.
                  </p>
                  {deleteError && (
                    <p className="mt-3 text-xs font-medium text-red-600 flex items-center gap-1.5">
                      <i className="fas fa-exclamation-circle" />{deleteError}
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
                    {deleting ? (<><i className="fas fa-spinner fa-spin" />Deleting…</>) : (<><i className="fas fa-trash" />Delete</>)}
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

export default ViewGRN
