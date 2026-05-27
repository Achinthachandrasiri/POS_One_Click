import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCategoryHooks } from '../../hooks/categoryHooks'
import { toImageSrc } from '../../utils/imageHelper'

const ViewCategory = () => {
  const navigate = useNavigate()
  const { getAllCategories, deleteCategory, loading, error } = useCategoryHooks()
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')

  const loadCategories = async () => {
    const res = await getAllCategories()
    if (res?.success) {
      setCategories(res.data || [])
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this category?')
    if (!confirmDelete) return

    const res = await deleteCategory(id)
    if (res?.success) {
      setCategories((prev) => prev.filter((c) => c._id !== id))
    }
  }

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return categories
    return categories.filter((c) =>
      c.categoryName.toLowerCase().includes(q)
    )
  }, [search, categories])

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
          <h1 className="text-white text-[22px] font-semibold m-0">Categories</h1>
          <p className="text-[#90bcc4] text-[15px] mt-1">Manage category records</p>
        </div>

        {/* Card */}
        <div
          className="relative z-10 bg-white w-full px-14 py-10 shadow-xl rounded-t-[20px] overflow-auto"
          style={{ height: 'calc(100% - 70px)' }}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="flex mt-4 gap-2">
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border-2 border-gray-400 rounded focus:outline-none focus:border-[#1a6b7a] text-sm text-gray-700 placeholder-gray-400 p-3 w-80 bg-transparent"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => navigate('/dashboard/products/categories/create')}
                className="bg-[#1a6b7a] border-2 border-[#1a6b7a] text-white text-md px-6 py-3 rounded hover:opacity-90"
              >
                + Create Category
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-600 text-xs mb-3">{error}</p>
          )}

          {/* Table */}
          <div className="border border-gray-200 rounded overflow-auto max-h-[60vh]">
            <table className="w-full min-w-[500px] border-collapse text-sm">
              <thead>
                <tr className="bg-[#f5fbfd] text-[#2a5b67] text-xs">
                  <th className="text-left px-3 py-2 border-b">Image</th>
                  <th className="text-left px-3 py-2 border-b">Category Name</th>
                  <th className="text-right px-3 py-2 border-b">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredCategories.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={3} className="text-center py-6 text-gray-500 text-xs">
                      {search ? 'No categories match your search' : 'No categories found'}
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((category) => (
                    <tr key={category._id} className="border-b hover:bg-gray-50">

                      {/* Image */}
                      <td className="px-3 py-2">
                        {toImageSrc(category.image) ? (
                          <img
                            src={toImageSrc(category.image)}
                            alt={category.categoryName}
                            className="w-9 h-9 object-cover rounded border border-gray-200"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded border border-gray-200 bg-gray-100 flex items-center justify-center">
                            <i className="fas fa-image text-gray-400 text-xs"></i>
                          </div>
                        )}
                      </td>

                      {/* Category Name */}
                      <td className="px-3 py-2">{category.categoryName}</td>

                      {/* Actions */}
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex gap-2 justify-end w-full">
                          <button
                            onClick={() => navigate(`/dashboard/products/categories/edit/${category._id}`)}
                            className="bg-white text-blue-500 text-sm px-3 py-1 rounded hover:opacity-90"
                          >
                            <i className="fas fa-pen"></i>
                          </button>

                          <button
                            onClick={() => handleDelete(category._id)}
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

        </div>
      </div>
    </div>
  )
}

export default ViewCategory
