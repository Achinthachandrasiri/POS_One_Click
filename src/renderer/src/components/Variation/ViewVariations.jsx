import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVariationHooks } from '../../hooks/variationHooks'

const ViewVariations = () => {
  const navigate = useNavigate()
  const { getAllVariations, deleteVariation, loading, error } = useVariationHooks()
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')

  const load = async () => {
    const res = await getAllVariations()
    if (res?.success) setItems(res.data || [])
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this variation?')) return
    const res = await deleteVariation(id)
    if (res?.success) setItems((p) => p.filter((x) => x._id !== id))
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((v) => v.variationName.toLowerCase().includes(q))
  }, [search, items])

  return (
    <div className="relative min-h-full px-8 pt-8 pb-0 overflow-hidden">
      <div className="flex flex-col h-[630px]">
        <div className="relative z-10 mb-5">
          <h1 className="text-white text-[22px] font-semibold m-0">Variations</h1>
          <p className="text-[#90bcc4] text-[15px] mt-1">Manage product variations</p>
        </div>

        <div className="relative z-10 bg-white w-full px-14 py-10 shadow-xl rounded-t-[20px] overflow-auto" style={{ height: 'calc(100% - 70px)' }}>
          <div className="flex justify-between items-center mb-4">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search variations..." className="border p-2 rounded w-80" />
            <button onClick={() => navigate('/dashboard/products/variations/create')} className="bg-[#1a6b7a] text-white px-4 py-2 rounded">+ Create Variation</button>
          </div>

          {error && <p className="text-red-600">{error}</p>}

          <div className="border rounded overflow-auto max-h-[60vh]">
            <table className="w-full text-sm">
              <thead>
                  <tr className="bg-[#f5fbfd] text-[#2a5b67] text-xs">
                    <th className="text-left px-3 py-2">Name</th>
                    <th className="text-left px-3 py-2">Variation Types</th>
                    <th className="text-right px-3 py-2">Actions</th>
                  </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && !loading ? (
                  <tr><td colSpan={3} className="text-center py-6 text-gray-500">No variations found</td></tr>
                ) : (
                  filtered.map((v) => (
                    <tr key={v._id} className="border-b">
                      <td className="px-3 py-2">{v.variationName}</td>
                        <td className="px-3 py-2">{(() => {
                          const t = v.types
                          if (!t) return ''
                          const arr = Array.isArray(t) ? t : String(t).split(',').map(s => s.trim()).filter(Boolean)
                          return arr.length ? `[${arr.join(', ')}]` : ''
                        })()}</td>
                      <td className="px-3 py-2 text-right">
                        <button onClick={() => navigate(`/dashboard/products/variations/edit/${v._id}`)} className="bg-white text-blue-500 px-3 py-1 rounded mr-2">Edit</button>
                        <button onClick={() => handleDelete(v._id)} className="bg-white text-red-500 px-3 py-1 rounded">Delete</button>
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

export default ViewVariations
