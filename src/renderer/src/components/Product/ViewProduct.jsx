import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProductHooks } from '../../hooks/productHooks'

const ViewProduct = () => {
  const navigate = useNavigate()
  const { getAllProducts, deleteProduct, updateProductStatus, loading, error } = useProductHooks()
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterStore, setFilterStore] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedProduct, setSelectedProduct] = useState(null)

  const loadProducts = async () => {
    const res = await getAllProducts()
    if (res?.success) {
      setProducts(res.products || [])
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const handleDelete = async (id, name) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${name}"?`)
    if (!confirmDelete) return
    const res = await deleteProduct(id)
    if (res?.success) {
      setProducts((prev) => prev.filter((p) => p._id !== id))
    }
  }

  const handleToggleStatus = async (product) => {
    const newStatus = product.status === 'active' ? 'inactive' : 'active'
    const res = await updateProductStatus(product._id, newStatus)
    if (res?.success) {
      setProducts((prev) =>
        prev.map((p) => (p._id === product._id ? { ...p, status: newStatus } : p))
      )
    }
  }

  const stores = useMemo(() => {
    const uniqueStores = new Map()

    products.forEach((product) => {
      if (product.store_id) {
        const store =
          typeof product.store_id === 'object'
            ? product.store_id
            : { _id: product.store_id, name: product.store_name || 'Unknown Store' }

        uniqueStores.set(store._id, store)
      }
    })

    return Array.from(uniqueStores.values())
  }, [products])

  const filteredProducts = useMemo(() => {
    setCurrentPage(1)
    const q = search.trim().toLowerCase()

    const filtered = products.filter((p) => {
      const matchSearch =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.code?.toLowerCase().includes(q) ||
        p.brand_id?.brandName?.toLowerCase().includes(q) ||
        p.category_id?.categoryName?.toLowerCase().includes(q)

      const matchStatus =
        filterStatus === 'all' ||
        p.status === filterStatus

      const matchType =
        filterType === 'all' ||
        p.product_type === filterType

      const matchStore =
        filterStore === 'all' ||
        p.store_id?._id === filterStore ||
        p.store_id === filterStore

      return (
        matchSearch &&
        matchStatus &&
        matchType &&
        matchStore
      )
    })

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'az':
          return (a.name || '').localeCompare(b.name || '')

        case 'za':
          return (b.name || '').localeCompare(a.name || '')

        case 'oldest':
          return (
            new Date(a.createdAt || 0) -
            new Date(b.createdAt || 0)
          )

        case 'newest':
        default:
          return (
            new Date(b.createdAt || 0) -
            new Date(a.createdAt || 0)
          )
      }
    })

    return filtered
  }, [
    products,
    search,
    filterStatus,
    filterType,
    filterStore,
    sortBy
  ])

  // ── pagination ──
  const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(filteredProducts.length / itemsPerPage)

  const paginatedProducts = useMemo(() => {
    if (itemsPerPage === 'all') return filteredProducts
    const start = (currentPage - 1) * itemsPerPage
    return filteredProducts.slice(start, start + itemsPerPage)
  }, [filteredProducts, currentPage, itemsPerPage])

  const handleItemsPerPageChange = (val) => {
    setItemsPerPage(val === 'all' ? 'all' : Number(val))
    setCurrentPage(1)
  }

  // ── helpers ──
  const getTotalStock = (product) => {
    if (!product.variations?.length) return 0
    return product.variations.reduce((sum, v) => {
      if (product.batch_tracking) {
        return sum + (v.batches || []).reduce((bs, b) => bs + (b.stock || 0), 0)
      }
      return sum + (v.stock || 0)
    }, 0)
  }

  const getStockStatus = (product) => {
    const stock = getTotalStock(product)
    const alert = product.stock_alert ?? 5
    if (stock === 0) return { label: 'Out of stock', cls: 'bg-red-100 text-red-600' }
    if (stock <= alert) return { label: 'Low stock', cls: 'bg-yellow-100 text-yellow-600' }
    return { label: 'In stock', cls: 'bg-green-100 text-green-600' }
  }

  const structureBadge = (product) => {
    if (product.structure === 'variable') return { label: 'Variable', cls: 'bg-purple-100 text-purple-600' }
    return { label: 'Single', cls: 'bg-blue-100 text-blue-600' }
  }

  return (
    <>
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
            <h1 className="text-white text-[22px] font-semibold m-0">Products</h1>
            <p className="text-[#90bcc4] text-[15px] mt-1">Manage Products records</p>
          </div>

          {/* Card */}
          <div
            className="relative z-10 bg-white w-full px-7 py-[26px] shadow-xl rounded-t-[20px] overflow-auto"
            style={{ height: 'calc(100% - 70px)' }}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2 flex-wrap">
                {/* Search */}
                <input
                  type="text"
                  placeholder="Search by name, code, brand..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border-2 border-gray-400 rounded-lg focus:outline-none focus:border-[#1a6b7a] text-sm text-gray-700 placeholder-gray-400 p-3 w-80 bg-transparent"
                />
                {/* Status filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border-2 border-gray-400 rounded-lg focus:outline-none focus:border-[#1a6b7a] text-sm text-gray-700 p-3 bg-transparent"
                >
                  <option value="all">All status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                {/* Type filter */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="border-2 border-gray-400 rounded-lg focus:outline-none focus:border-[#1a6b7a] text-sm text-gray-700 p-3 bg-transparent"
                >
                  <option value="all">All types</option>
                  <option value="quantity">Quantity based</option>
                  <option value="measurable">Measurable</option>
                </select>
                <select
                  value={filterStore}
                  onChange={(e) => setFilterStore(e.target.value)}
                  className="border-2 border-gray-400 rounded-lg focus:outline-none focus:border-[#1a6b7a] text-sm text-gray-700 p-3 bg-transparent"
                >
                  <option value="all">All Stores</option>

                  {stores.map((store) => (
                    <option key={store._id} value={store._id}>
                      {store.name}
                    </option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border-2 border-gray-400 rounded-lg focus:outline-none focus:border-[#1a6b7a] text-sm text-gray-700 p-3 bg-transparent"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="az">Name A-Z</option>
                  <option value="za">Name Z-A</option>
                </select>
              </div>

              <button
                onClick={() => navigate('/dashboard/products/create')}
                className="bg-[#1a6b7a] border-2 border-[#1a6b7a] text-white text-md px-6 py-3 rounded-lg hover:opacity-90"
              >
                + Add Product
              </button>
            </div>

            {/* Error */}
            {error && (
              <p className="text-red-600 text-xs mb-3">{error}</p>
            )}

            {/* Table */}
            <div className="border border-gray-200 rounded overflow-auto max-h-[60vh]">
              <table className="w-full min-w-[800px] border-collapse text-sm">
                <thead>
                  <tr className="bg-[#f5fbfd] text-[#2a5b67] text-xs">
                    <th className="text-left px-3 py-2 border-b">Name</th>
                    <th className="text-left px-3 py-2 border-b">Code</th>
                    <th className="text-left px-3 py-2 border-b">Category</th>
                    <th className="text-left px-3 py-2 border-b">Brand</th>
                    <th className="text-left px-3 py-2 border-b">Type</th>
                    <th className="text-left px-3 py-2 border-b">Structure</th>
                    <th className="text-left px-1 py-2 border-b">Stock</th>
                    <th className="text-left px-3 py-2 border-b">Status</th>
                    <th className="text-right px-3 py-2 border-b">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-gray-400 text-xs">
                        Loading products...
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-gray-500 text-xs">
                        {search || filterStatus !== 'all' || filterType !== 'all'
                          ? 'No products match your search'
                          : 'No products found. Click "+ Add Product" to get started.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedProducts.map((product) => {
                      const stockStatus = getStockStatus(product)
                      const structure = structureBadge(product)
                      const totalStock = getTotalStock(product)

                      return (
                        <tr key={product._id} className="border-b hover:bg-gray-50">

                          {/* Name */}
                          <td className="px-3 py-2">
                            <div className="font-medium text-gray-800">{product.name}</div>
                            {product.batch_tracking && (
                              <span className="text-[10px] text-[#1a6b7a] font-medium">Batch tracked</span>
                            )}
                          </td>

                          {/* Code */}
                          <td className="px-3 py-2 text-gray-500 font-mono text-xs">{product.code}</td>

                          {/* Category */}
                          <td className="px-3 py-2 text-gray-600">
                            {product.category_id?.categoryName || '—'}
                          </td>

                          {/* Brand */}
                          <td className="px-3 py-2 text-gray-600">
                            {product.brand_id?.brandName || '—'}
                          </td>

                          {/* Type */}
                          <td className="px-3 py-2">
                            <span className="text-xs capitalize text-gray-600">
                              {product.product_type === 'measurable'
                                ? `Measurable${product.unit_id?.symbol ? ` (${product.unit_id.symbol})` : ''}`
                                : 'Quantity'}
                            </span>
                          </td>

                          {/* Structure */}
                          <td className="px-3 py-2">
                            <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${structure.cls}`}>
                              {structure.label}
                            </span>
                          </td>

                          {/* Stock */}
                          <td className="px-1 py-2">
                            <div className="flex items-center gap-2">
                              <div className="text-gray-700 font-medium">{totalStock}</div>
                              <span
                                className={`text-[10px] px-1 py-0.5 rounded font-medium ${stockStatus.cls}`}
                              >
                                {stockStatus.label}
                              </span>
                            </div>
                          </td>

                          {/* Status toggle */}
                          <td className="px-3 py-2">
                            <button
                              onClick={() => handleToggleStatus(product)}
                              className={`text-[11px] px-2 py-0.5 rounded font-medium border ${product.status === 'active'
                                ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                                : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                                }`}
                            >
                              {product.status === 'active' ? 'Active' : 'Inactive'}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="px-3 py-2 text-right">
                            <div className="inline-flex gap-2 justify-end">
                              <button
                                onClick={() => setSelectedProduct(product)}
                                className="bg-white text-teal-500 text-sm px-3 py-1 rounded hover:opacity-90"
                                title="View product"
                              >
                                <i className="fas fa-eye" />
                              </button>
                              <button
                                onClick={() => navigate(`/dashboard/products/edit/${product._id}`)}
                                className="bg-white text-blue-500 text-sm px-3 py-1 rounded hover:opacity-90"
                                title="Edit product"
                              >
                                <i className="fas fa-pen" />
                              </button>
                              <button
                                onClick={() => handleDelete(product._id, product.name)}
                                className="bg-white text-red-500 text-sm px-3 py-1 rounded hover:opacity-90"
                                title="Delete product"
                              >
                                <i className="fas fa-trash" />
                              </button>
                            </div>
                          </td>

                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            {!loading && filteredProducts.length > 0 && (
              <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                {/* Left: count + items per page */}
                <div className="flex items-center gap-3">
                  <p className="text-md text-gray-500">
                    {itemsPerPage === 'all'
                      ? `Showing all ${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''}`
                      : `Showing ${Math.min((currentPage - 1) * itemsPerPage + 1, filteredProducts.length)}–${Math.min(currentPage * itemsPerPage, filteredProducts.length)} of ${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''}`}
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
                        if (idx > 0 && page - arr[idx - 1] > 1) {
                          acc.push('...')
                        }
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
                      className="px-3 py-1 text-xs rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next
                      <i className="fas fa-chevron-right ml-1" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          getTotalStock={getTotalStock}
          getStockStatus={getStockStatus}
          structureBadge={structureBadge}
        />
      )}
    </>
  )
}

const ProductDetailModal = ({ product, onClose, getTotalStock, getStockStatus, structureBadge }) => {
  const totalStock = getTotalStock(product)
  const stockStatus = getStockStatus(product)
  const structure = structureBadge(product)

  const Field = ({ label, value }) =>
    value ? (
      <div>
        <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm text-gray-700 font-medium">{value}</p>
      </div>
    ) : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-start justify-between px-7 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{product.name}</h2>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{product.code}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none mt-0.5"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap gap-2 px-7 pt-4">
          <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${structure.cls}`}>
            {structure.label}
          </span>
          <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${stockStatus.cls}`}>
            {stockStatus.label}
          </span>
          <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium border ${product.status === 'active'
              ? 'bg-green-50 text-green-600 border-green-200'
              : 'bg-gray-100 text-gray-500 border-gray-200'
            }`}>
            {product.status === 'active' ? 'Active' : 'Inactive'}
          </span>
          {product.batch_tracking && (
            <span className="text-[11px] px-2.5 py-1 rounded-full font-medium bg-teal-50 text-teal-600">
              Batch Tracked
            </span>
          )}
        </div>

        {/* Main details grid */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 px-7 py-5">
          <Field label="Category" value={product.category_id?.categoryName} />
          <Field label="Brand" value={product.brand_id?.brandName} />
          <Field
            label="Product Type"
            value={
              product.product_type === 'measurable'
                ? `Measurable${product.unit_id?.symbol ? ` (${product.unit_id.symbol})` : ''}`
                : 'Quantity Based'
            }
          />
          <Field
            label="Store"
            value={
              typeof product.store_id === 'object'
                ? product.store_id?.name
                : product.store_name
            }
          />
          <Field label="Total Stock" value={totalStock} />
          <Field label="Stock Alert Threshold" value={product.stock_alert ?? 5} />
          {product.description && (
            <div className="col-span-2">
              <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">Description</p>
              <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
            </div>
          )}
        </div>

        {/* Variations */}
        {product.variations?.length > 0 && (
          <div className="px-7 pb-2">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-3">
              Variations ({product.variations.length})
            </p>
            <div className="space-y-2">
              {product.variations.map((v, idx) => {
                const varStock = product.batch_tracking
                  ? (v.batches || []).reduce((s, b) => s + (b.stock || 0), 0)
                  : v.stock ?? 0
                return (
                  <div
                    key={v._id || idx}
                    className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      {v.color && (
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-gray-200 flex-shrink-0"
                          style={{ backgroundColor: v.color }}
                        />
                      )}
                      <span className="text-gray-700 font-medium">
                        {v.name || `Variation ${idx + 1}`}
                      </span>
                      {v.sku && (
                        <span className="text-gray-400 font-mono text-xs">{v.sku}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {v.price != null && (
                        <span className="font-medium text-gray-700">
                          {typeof v.price === 'number' ? v.price.toLocaleString() : v.price}
                        </span>
                      )}
                      <span>Stock: <span className="font-semibold text-gray-700">{varStock}</span></span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center px-7 py-5 border-t border-gray-100 mt-2">
          {product.createdAt && (
            <p className="text-xs text-gray-400">
              Added {new Date(product.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
          )}
          <button
            onClick={onClose}
            className="ml-auto bg-[#1a6b7a] text-white text-sm px-5 py-2 rounded-lg hover:opacity-90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ViewProduct
