import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWarrantyTypeHooks } from '../../hooks/usewarrantytypehooks.js'

const dateFmt = (d) => (d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—')

const addedByName = (ref) => {
  if (!ref || typeof ref !== 'object') return '—'
  return `${ref.first_name || ''} ${ref.last_name || ''}`.trim() || '—'
}

const coverageLabel = (type) => {
  const labels = {
    repair: 'Repair',
    replacement: 'Replacement',
    refund: 'Refund',
    repair_or_replacement: 'Repair or Replacement'
  }
  return labels[type] || type || '—'
}

// Normalizes an _id to a plain string regardless of whether it arrives as
// a string, a Mongoose ObjectId-shaped object ({ $oid: '...' }), or an
// object with a working .toString(). Used for React keys and for delete
// filtering so both stay correct even if a raw (non-JSON'd) id ever
// slips through from the backend.
const idStr = (v) => {
  if (!v) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'object') {
    if (v.$oid) return v.$oid
    if (typeof v.toString === 'function') return v.toString()
  }
  return String(v)
}

const inputCls = 'border-2 border-gray-400 rounded-lg focus:outline-none focus:border-[#1a6b7a] text-sm text-gray-700 placeholder-gray-400 p-3 bg-transparent'
const selectCls = 'border-2 border-gray-400 rounded-lg focus:outline-none focus:border-[#1a6b7a] text-sm text-gray-700 p-3 bg-transparent cursor-pointer'

// ─────────────────────────────────────────────────────────────
// Pagination footer (mirrors ViewExpenses.jsx's PaginationFooter)
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

const ViewWarranty = () => {
  const navigate = useNavigate()
  const { getAllWarrantyTypes, deleteWarrantyType, loading, error } = useWarrantyTypeHooks()
  const [warrantyTypes, setWarrantyTypes] = useState([])
  const [search, setSearch] = useState('')
  const [coverageFilter, setCoverageFilter] = useState('')

  // ── Pagination state ──
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const loadWarrantyTypes = async () => {
    const res = await getAllWarrantyTypes()
    if (res?.success) {
      setWarrantyTypes(res.warrantyTypes || [])
    }
  }

  useEffect(() => {
    loadWarrantyTypes()
  }, [])

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this warranty type?')
    if (!confirmDelete) return

    const res = await deleteWarrantyType(id)
    if (res?.success) {
      setWarrantyTypes((prev) => prev.filter((w) => idStr(w._id) !== idStr(id)))
    }
  }

  const filteredWarrantyTypes = useMemo(() => {
    const q = search.trim().toLowerCase()

    return warrantyTypes.filter((w) => {
      if (q) {
        const haystack = `${w.warranty_name} ${w.terms || ''} ${addedByName(w.added_by)}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }

      if (coverageFilter && w.coverage_type !== coverageFilter) {
        return false
      }

      return true
    })
  }, [search, warrantyTypes, coverageFilter])

  // Reset to page 1 whenever the underlying filtered list changes
  useEffect(() => {
    setCurrentPage(1)
  }, [search, coverageFilter, warrantyTypes.length])

  const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(filteredWarrantyTypes.length / itemsPerPage)

  const paginatedWarrantyTypes = useMemo(() => {
    if (itemsPerPage === 'all') return filteredWarrantyTypes
    const start = (currentPage - 1) * itemsPerPage
    return filteredWarrantyTypes.slice(start, start + itemsPerPage)
  }, [filteredWarrantyTypes, currentPage, itemsPerPage])

  const handleItemsPerPageChange = (val) => {
    setItemsPerPage(val === 'all' ? 'all' : Number(val))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearch('')
    setCoverageFilter('')
  }

  const hasActiveFilters = search || coverageFilter

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
          <h1 className="text-white text-[22px] font-semibold m-0">Warranty</h1>
          <p className="text-[#90bcc4] text-[15px] mt-1">Manage warranty types</p>
        </div>

        {/* Card */}
        <div
          className="relative z-10 bg-white w-full px-7 py-[10px] shadow-xl rounded-t-[20px] overflow-auto"
          style={{ height: 'calc(100% - 70px)' }}
        >

          {/* Header */}
          <div className="flex justify-between items-start mb-4 flex-wrap gap-3">
            <div className="flex flex-wrap items-end gap-3 mt-4">
              <div>
                <input
                  type="text"
                  placeholder="Search warranty types..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`${inputCls} w-60`}
                />
              </div>

              <div>
                <select
                  value={coverageFilter}
                  onChange={(e) => setCoverageFilter(e.target.value)}
                  className={`${selectCls} w-52`}
                >
                  <option value="">All coverage types</option>
                  <option value="repair">Repair</option>
                  <option value="replacement">Replacement</option>
                  <option value="refund">Refund</option>
                  <option value="repair_or_replacement">Repair or Replacement</option>
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-700 px-3 py-3"
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => navigate('/dashboard/warranty/create')}
                className="bg-[#1a6b7a] mt-4 border-2 border-[#1a6b7a] text-white text-md px-6 py-3 rounded-lg hover:opacity-90 whitespace-nowrap"
              >
                + Add Warranty Type
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-600 text-xs mb-3">{error}</p>
          )}

          {/* Table */}
          <div className="border border-gray-200 rounded overflow-auto max-h-[60vh]">
            <table className="w-full min-w-[600px] border-collapse text-sm">
              <thead>
                <tr className="bg-[#f5fbfd] text-[#2a5b67] text-xs">
                  <th className="text-left px-3 py-2 border-b">Warranty Name</th>
                  <th className="text-left px-3 py-2 border-b">Coverage Type</th>
                  <th className="text-left px-3 py-2 border-b">Added By</th>
                  <th className="text-left px-3 py-2 border-b">Created</th>
                  <th className="text-right px-3 py-2 border-b">Actions</th>
                </tr>
              </thead>

              <tbody>
                {paginatedWarrantyTypes.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-500 text-xs">
                      {hasActiveFilters ? 'No warranty types match your filters' : 'No warranty types found'}
                    </td>
                  </tr>
                ) : (
                  paginatedWarrantyTypes.map((w) => (
                    <tr key={idStr(w._id)} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <span>{w.warranty_name}</span>
                        {w.terms && (
                          <i
                            className="fas fa-circle-info text-gray-400 ml-1.5 text-xs"
                            title={w.terms}
                          />
                        )}
                      </td>

                      <td className="px-3 py-2 text-gray-600">{coverageLabel(w.coverage_type)}</td>

                      <td className="px-3 py-2 text-gray-600">{addedByName(w.added_by)}</td>

                      <td className="px-3 py-2 text-gray-600">{dateFmt(w.createdAt)}</td>

                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex gap-2 justify-end w-full">

                          <button
                            onClick={() => navigate(`/dashboard/warranty/edit/${idStr(w._id)}`)}
                            className="bg-white text-blue-500 text-sm px-3 py-1 rounded hover:opacity-90"
                          >
                            <i className="fas fa-pen"></i>
                          </button>

                          <button
                            onClick={() => handleDelete(w._id)}
                            className="bg-white text-red-500 text-sm px-3 py-1 rounded hover:opacity-90"
                          >
                            <i className="fas fa-trash"></i>
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && !error && filteredWarrantyTypes.length > 0 && (
            <PaginationFooter
              totalItems={filteredWarrantyTypes.length}
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
  )
}

export default ViewWarranty
