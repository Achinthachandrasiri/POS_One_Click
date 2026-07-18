import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useServiceHooks } from '../../hooks/useServiceHooks'

const money = (v) => `Rs ${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`

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

const categoryName = (ref) => {
  if (!ref || typeof ref !== 'object') return '—'
  return ref.categoryName || '—'
}

const inputCls = 'border-2 border-gray-400 rounded-lg focus:outline-none focus:border-[#1a6b7a] text-sm text-gray-700 placeholder-gray-400 p-3 bg-transparent'
const selectCls = 'border-2 border-gray-400 rounded-lg focus:outline-none focus:border-[#1a6b7a] text-sm text-gray-700 p-3 bg-transparent cursor-pointer'

// ─────────────────────────────────────────────────────────────
// Pagination footer (mirrors ViewExpenses.jsx / ViewQuatation.jsx's PaginationFooter)
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

const ViewService = () => {
  const navigate = useNavigate()
  const { getAllServices, deleteService, loading, error } = useServiceHooks()
  const [services, setServices] = useState([])
  const [categories, setCategories] = useState([])

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // ── Pagination state (server-side — the controller supports skip/limit) ──
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 })

  const loadCategories = async () => {
    const res = await window.api.category.getAll()
    if (res?.success) {
      setCategories(res.data || [])
    }
  }

  const loadServices = useCallback(async () => {
    const params = {
      page: currentPage,
      limit: itemsPerPage,
      ...(categoryFilter && { category: categoryFilter }),
      ...(statusFilter && { status: statusFilter }),
      ...(search.trim() && { search: search.trim() }),
    }

    const res = await getAllServices(params)
    if (res?.success) {
      setServices(res.data || [])
      setPagination(res.pagination || { total: 0, totalPages: 1 })
    }
  }, [currentPage, itemsPerPage, categoryFilter, statusFilter, search, getAllServices])

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadServices()
  }, [loadServices])

  // Reset to page 1 whenever a filter changes (not on page/limit changes themselves)
  useEffect(() => {
    setCurrentPage(1)
  }, [search, categoryFilter, statusFilter])

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this service?')
    if (!confirmDelete) return

    const res = await deleteService(id)
    if (res?.success) {
      loadServices()
    }
  }

  const handleItemsPerPageChange = (val) => {
    setItemsPerPage(val === 'all' ? 'all' : Number(val))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearch('')
    setCategoryFilter('')
    setStatusFilter('')
  }

  const hasActiveFilters = search || categoryFilter || statusFilter

  const totalItems = pagination.total || 0
  const totalPages = itemsPerPage === 'all' ? 1 : (pagination.totalPages || 1)

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
          <h1 className="text-white text-[22px] font-semibold m-0">View Service</h1>
          <p className="text-[#90bcc4] text-[15px] mt-1">View service records</p>
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
                  placeholder="Search services..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`${inputCls} w-60`}
                />
              </div>

              <div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className={`${selectCls} w-44`}
                >
                  <option value="">All categories</option>
                  {categories.map((c) => (
                    <option key={idStr(c._id)} value={idStr(c._id)}>{c.categoryName}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`${selectCls} w-36`}
                >
                  <option value="">All status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
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
                onClick={() => navigate('/dashboard/services/create')}
                className="bg-[#1a6b7a] mt-4 border-2 border-[#1a6b7a] text-white text-md px-6 py-3 rounded-lg hover:opacity-90 whitespace-nowrap"
              >
                + Add Service
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-600 text-xs mb-3">{error}</p>
          )}

          {/* Table */}
          <div className="border border-gray-200 rounded overflow-auto max-h-[60vh]">
            <table className="w-full min-w-[700px] border-collapse text-sm">
              <thead>
                <tr className="bg-[#f5fbfd] text-[#2a5b67] text-xs">
                  <th className="text-left px-3 py-2 border-b">Service Code</th>
                  <th className="text-left px-3 py-2 border-b">Name</th>
                  <th className="text-left px-3 py-2 border-b">Category</th>
                  <th className="text-right px-3 py-2 border-b">Price</th>
                  <th className="text-center px-3 py-2 border-b">Status</th>
                  <th className="text-right px-3 py-2 border-b">Actions</th>
                </tr>
              </thead>

              <tbody>
                {services.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-gray-500 text-xs">
                      {hasActiveFilters ? 'No services match your filters' : 'No services found'}
                    </td>
                  </tr>
                ) : (
                  services.map((svc) => (
                    <tr key={idStr(svc._id)} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-600">{svc.service_code}</td>

                      <td className="px-3 py-2">
                        <span>{svc.service_name}</span>
                        {svc.description && (
                          <i
                            className="fas fa-circle-info text-gray-400 ml-1.5 text-xs"
                            title={svc.description}
                          />
                        )}
                      </td>

                      <td className="px-3 py-2 text-gray-600">{categoryName(svc.category)}</td>

                      <td className="px-3 py-2 text-right font-semibold text-[#1a6b7a]">
                        {money(svc.price)}
                      </td>

                      <td className="px-3 py-2 text-center">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${svc.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                            }`}
                        >
                          {svc.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex gap-2 justify-end w-full">

                          <button
                            onClick={() => navigate(`/dashboard/services/edit/${idStr(svc._id)}`)}
                            className="bg-white text-blue-500 text-sm px-3 py-1 rounded hover:opacity-90"
                          >
                            <i className="fas fa-pen"></i>
                          </button>

                          <button
                            onClick={() => handleDelete(svc._id)}
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

          {!loading && !error && totalItems > 0 && (
            <PaginationFooter
              totalItems={totalItems}
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

export default ViewService
