import React, { useState, useEffect, useMemo } from 'react'
import { useViewQuotation } from '../../hooks/useViewQuotation'

const BRAND = '#1a6b7a'

// ─────────────────────────────────────────────────────────────
// Small shared primitives (kept local so this file stays drop-in)
// ─────────────────────────────────────────────────────────────
const inputCls = 'border-2 border-gray-400 rounded-lg focus:outline-none focus:border-[#1a6b7a] text-sm text-gray-700 p-3 bg-transparent'
const selectCls = `border-2 border-gray-400 rounded-lg focus:outline-none focus:border-[#1a6b7a] text-sm text-gray-700 p-3 bg-transparent cursor-pointer`

const money = (v) => `Rs ${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
const dateFmt = (d) => (d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—')

const nameOf = (ref, fallback = '—') => {
  if (!ref) return fallback
  if (typeof ref === 'object') return ref.name || ref.storeName || fallback
  return fallback
}

// ─────────────────────────────────────────────────────────────
// Filter bar
// ─────────────────────────────────────────────────────────────
const FilterBar = ({ filters, dropdowns, onChange, onClear, hasActiveFilters, onCreate }) => (
  <div className="flex justify-between items-center mb-4">
    <div>
      <div className="flex mt-4 gap-2 flex-wrap items-center">
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onChange('search', e.target.value)}
          placeholder="Quotation number…"
          className="border-2 border-gray-400 rounded-lg focus:outline-none focus:border-[#1a6b7a] text-sm text-gray-700 placeholder-gray-400 p-3 w-72 bg-transparent"
        />
        <div className="flex items-center gap-1.5">
          <select value={filters.store_id} onChange={(e) => onChange('store_id', e.target.value)} className={selectCls}>
            <option value="">All stores</option>
            {dropdowns.stores.map((s) => <option key={s._id} value={s._id}>{s.storeName || s.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <select value={filters.customer_id} onChange={(e) => onChange('customer_id', e.target.value)} className={selectCls}>
            <option value="">All customers</option>
            {dropdowns.customers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <input type="date" value={filters.from_date} onChange={(e) => onChange('from_date', e.target.value)} className={inputCls} />
        </div>
        <span className="text-gray-400 text-sm">to</span>
        <div className="flex items-center gap-1.5">
          <input type="date" value={filters.to_date} onChange={(e) => onChange('to_date', e.target.value)} className={inputCls} />
        </div>
        <div className="col-span-1 flex justify-end">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClear}
              title="Clear filters"
              className="border-2 border-gray-300 text-gray-500 hover:text-red-500 hover:border-red-300 rounded-lg px-4 py-3 transition-colors"
            >
              <i className="fas fa-times text-sm" />
            </button>
          )}
        </div>
      </div>
      </div>
      <div className="flex gap-2 items-center">
        <button
          type="button"
          onClick={onCreate}
          className="bg-[#1a6b7a] border-2 border-[#1a6b7a] mt-4 text-white text-md px-6 py-3 rounded-lg hover:opacity-90"
        >
          <i className="fas fa-plus" /> New Quotation
        </button>
      </div>
  </div>
)

// ─────────────────────────────────────────────────────────────
// Table
// ─────────────────────────────────────────────────────────────
const QuotationsTable = ({ quotations, loading, error, onView, onEdit, onDelete }) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <i className="fas fa-spinner fa-spin text-2xl mb-3" style={{ color: BRAND }} />
        <p className="text-sm font-medium">Loading quotations…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-red-500">
        <i className="fas fa-exclamation-triangle text-2xl mb-3" />
        <p className="text-sm font-medium">{error}</p>
      </div>
    )
  }

  if (quotations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
        <i className="fas fa-file-invoice-dollar text-3xl mb-3 opacity-40" />
        <p className="text-sm font-medium">No quotations found</p>
        <p className="text-xs mt-1">Try adjusting your filters or create a new quotation</p>
      </div>
    )
  }

  return (
    <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
      <div className="grid grid-cols-12 gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wide">
        <div className="col-span-2">Quotation #</div>
        <div className="col-span-2">Customer</div>
        <div className="col-span-2">Store</div>
        <div className="col-span-1 text-center">Date</div>
        <div className="col-span-1 text-center">Items</div>
        <div className="col-span-2 text-right">Grand total</div>
        <div className="col-span-2 text-center">Actions</div>
      </div>
      <div className="divide-y divide-gray-100">
        {quotations.map((q) => (
          <div key={q._id} className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-gray-50 transition-colors">
            <div className="col-span-2 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate font-mono">{q.quotation_number}</p>
            </div>
            <div className="col-span-2 min-w-0">
              <p className="text-sm text-gray-700 truncate">{nameOf(q.customer_id)}</p>
            </div>
            <div className="col-span-2 min-w-0">
              <p className="text-sm text-gray-500 truncate">{nameOf(q.store_id)}</p>
            </div>
            <div className="col-span-1 text-center">
              <p className="text-xs text-gray-500">{dateFmt(q.date)}</p>
            </div>
            <div className="col-span-1 text-center">
              <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {q.products?.length || 0}
              </span>
            </div>
            <div className="col-span-2 text-right">
              <span className="text-sm font-bold" style={{ color: BRAND }}>{money(q.grand_total)}</span>
            </div>
            <div className="col-span-2 flex justify-center gap-3">
              <button type="button" onClick={() => onView(q)} title="View details" className="text-green-500 hover:text-[#1a6b7a] transition-colors">
                <i className="fas fa-eye text-sm" />
              </button>
              <button type="button" onClick={() => onEdit(q._id)} title="Edit quotation" className="text-blue-500 text-sm px-3 py-1 rounded hover:opacity-90">
                <i className="fas fa-pen"></i>
              </button>
              <button type="button" onClick={() => onDelete(q)} title="Delete quotation" className="text-red-400 hover:text-red-600 transition-colors p-1">
                <i className="fas fa-trash text-sm" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Pagination footer
// ─────────────────────────────────────────────────────────────
const PaginationFooter = ({ totalItems, currentPage, itemsPerPage, totalPages, onPageChange, onItemsPerPageChange }) => (
  <div className="flex items-center justify-between mt-3 flex-wrap gap-2">

    {/* Left: count + items per page */}
    <div className="flex items-center gap-3">
      <p className="text-md text-gray-500">
        {itemsPerPage === 'all'
          ? `Showing all ${totalItems} record${totalItems !== 1 ? 's' : ''}`
          : `Showing ${Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}–${Math.min(currentPage * itemsPerPage, totalItems)} of ${totalItems} record${totalItems !== 1 ? 's' : ''}`}
      </p>
      <div className="flex items-center gap-1">
        <span className="text-md text-gray-500">Per page:</span>
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(e.target.value)}
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
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
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
                onClick={() => onPageChange(item)}
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
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 text-md rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
          <i className="fas fa-chevron-right ml-1" />
        </button>
      </div>
    )}

  </div>
)

// ─────────────────────────────────────────────────────────────
// Detail modal
// ─────────────────────────────────────────────────────────────
const DetailModal = ({ quotation, loading, onClose, onEdit }) => {
  if (!quotation) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onMouseDown={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] overflow-y-auto" onMouseDown={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between sticky top-0 bg-white z-10">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider mb-0.5" style={{ color: BRAND }}>Quotation</p>
            <h3 className="text-lg font-bold text-gray-900 font-mono">{quotation.quotation_number}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {nameOf(quotation.customer_id)} · {nameOf(quotation.store_id)} · {dateFmt(quotation.date)}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <i className="fas fa-times text-lg" />
          </button>
        </div>

        <div className="px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-gray-400">
              <i className="fas fa-spinner fa-spin mr-2" /> Loading details…
            </div>
          ) : (
            <div className="space-y-3">
              {(quotation.products || []).map((p) => {
                const isBatch = p.batch_tracking
                const lineTotal = isBatch
                  ? (p.batches || []).reduce((s, b) => s + (b.quantity * b.price - (b.discount_type === 'percent' ? (b.quantity * b.price) * (b.discount_value || 0) / 100 : b.discount_type === 'fixed' ? (b.discount_value || 0) : 0)), 0)
                  : p.line_total ?? (p.quantity * p.price - (p.discount_type === 'percent' ? (p.quantity * p.price) * (p.discount_value || 0) / 100 : p.discount_type === 'fixed' ? (p.discount_value || 0) : 0))

                return (
                  <div key={p._id} className="border-2 border-gray-100 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {p.product_name}
                          {p.variation_name && <span className="text-gray-400 font-normal"> · {p.variation_name}</span>}
                        </p>
                        {p.wholesale_enabled && (
                          <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">WHOLESALE</span>
                        )}
                      </div>
                      <span className="text-sm font-bold" style={{ color: BRAND }}>{money(lineTotal)}</span>
                    </div>

                    {!isBatch ? (
                      <p className="text-xs text-gray-500">
                        {p.quantity} × {money(p.price)}
                        {p.discount_type !== 'none' && p.discount_value ? ` (−${p.discount_type === 'percent' ? `${p.discount_value}%` : money(p.discount_value)})` : ''}
                      </p>
                    ) : (
                      <div className="mt-1.5 space-y-1">
                        {(p.batches || []).map((b) => (
                          <p key={b._id} className="text-xs text-gray-500 font-mono">
                            {b.batch_number}: {b.quantity} × {money(b.price)}
                            {b.discount_type !== 'none' && b.discount_value ? ` (−${b.discount_type === 'percent' ? `${b.discount_value}%` : money(b.discount_value)})` : ''}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              <div className="flex justify-end items-center gap-2 pt-2 border-t border-gray-100">
                <span className="text-sm font-semibold text-gray-600">Grand total</span>
                <span className="text-lg font-bold" style={{ color: BRAND }}>{money(quotation.grand_total)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
          <button type="button" onClick={onClose} className="border-2 border-gray-300 text-gray-600 text-sm font-semibold px-5 py-2 rounded-xl hover:bg-gray-100 transition-colors">
            Close
          </button>
          <button
            type="button"
            onClick={() => onEdit(quotation._id)}
            className="bg-[#1a6b7a] border-2 border-[#1a6b7a] text-white text-sm font-bold px-6 py-2 rounded-xl hover:bg-[#155f6d] transition-colors flex items-center gap-2"
          >
            <i className="fas fa-pen" /> Edit
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Delete confirm modal
// ─────────────────────────────────────────────────────────────
const DeleteConfirmModal = ({ target, deleting, onCancel, onConfirm }) => {
  if (!target) return null
  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onMouseDown={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <i className="fas fa-trash text-red-500" />
          </div>
          <h3 className="text-base font-bold text-gray-900">Delete quotation?</h3>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          This will permanently delete quotation <span className="font-mono font-semibold text-gray-700">{target.quotation_number}</span>. This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={deleting} className="border-2 border-gray-300 text-gray-600 text-sm font-semibold px-5 py-2 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="bg-red-500 border-2 border-red-500 text-white text-sm font-bold px-5 py-2 rounded-xl hover:bg-red-600 disabled:opacity-60 transition-colors flex items-center gap-2"
          >
            {deleting ? (<><i className="fas fa-spinner fa-spin" /> Deleting…</>) : (<><i className="fas fa-trash" /> Delete</>)}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
const ViewQuatation = () => {
  const {
    quotations,
    dropdowns,
    filters,
    loading,
    error,
    hasActiveFilters,
    updateFilter,
    clearFilters,
    detailQuotation,
    detailLoading,
    openDetail,
    closeDetail,
    goToCreate,
    goToEdit,
    deleteTarget,
    deleting,
    requestDelete,
    cancelDelete,
    confirmDelete
  } = useViewQuotation()

  // ── Pagination state ──
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Reset to page 1 whenever the underlying (filtered) list changes
  useEffect(() => {
    setCurrentPage(1)
  }, [quotations, filters])

  const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(quotations.length / itemsPerPage)

  const paginatedQuotations = useMemo(() => {
    if (itemsPerPage === 'all') return quotations
    const start = (currentPage - 1) * itemsPerPage
    return quotations.slice(start, start + itemsPerPage)
  }, [quotations, currentPage, itemsPerPage])

  const handleItemsPerPageChange = (val) => {
    setItemsPerPage(val === 'all' ? 'all' : Number(val))
    setCurrentPage(1)
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
          <h1 className="text-white text-[22px] font-semibold m-0">View Quotation</h1>
          <p className="text-[#90bcc4] text-[15px] mt-1">Manage quotation records</p>
        </div>

        {/* Card */}
        <div
          className="relative z-10 bg-white w-full px-7 py-[10px] shadow-xl rounded-t-[20px] overflow-auto"
          style={{ height: 'calc(100% - 70px)' }}
        >
          <div className="">
            <FilterBar
              filters={filters}
              dropdowns={dropdowns}
              onChange={updateFilter}
              onClear={clearFilters}
              hasActiveFilters={hasActiveFilters}
              onCreate={goToCreate}
            />

            <QuotationsTable
              quotations={paginatedQuotations}
              loading={loading}
              error={error}
              onView={openDetail}
              onEdit={goToEdit}
              onDelete={requestDelete}
            />

            {!loading && !error && quotations.length > 0 && (
              <PaginationFooter
                totalItems={quotations.length}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={handleItemsPerPageChange}
              />
            )}
          </div>
        </div>
      </div>

      <DetailModal
        quotation={detailQuotation}
        loading={detailLoading}
        onClose={closeDetail}
        onEdit={goToEdit}
      />

      <DeleteConfirmModal
        target={deleteTarget}
        deleting={deleting}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

export default ViewQuatation
