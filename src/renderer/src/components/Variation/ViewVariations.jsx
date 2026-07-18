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

        {/* Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-[880px] h-[780px] bg-[#2699aa] opacity-40 rounded-full right-[-200px] bottom-[-200px]" />
          <div className="absolute w-[580px] h-[580px] bg-[#30aabb] opacity-25 rounded-full right-[-120px] bottom-[-120px]" />
          <div className="absolute w-[420px] h-[420px] bg-[#2699aa] opacity-30 rounded-full left-[-80px] top-[-80px]" />
        </div>

        {/* Title */}
        <div className="relative z-10 mb-5">
          <h1 className="text-white text-[22px] font-semibold m-0">Variation</h1>
          <p className="text-[#90bcc4] text-[15px] mt-1">Manage Variation records</p>
        </div>

        {/* Card */}
        <div
          className="relative z-10 bg-white w-full px-7 py-[26px] shadow-xl rounded-t-[20px] overflow-auto"
          style={{ height: 'calc(100% - 70px)' }}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search variations..."
              className="border-2 border-gray-400 rounded-lg focus:outline-none focus:border-[#1a6b7a] text-sm text-gray-700 placeholder-gray-400 p-3 w-80 bg-transparent" />
            <button onClick={() => navigate('/dashboard/products/variations/create')}
              className="bg-[#1a6b7a] border-2 border-[#1a6b7a] text-white text-md px-6 py-3 rounded-lg hover:opacity-90">+ Create Variation</button>
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
                        <button onClick={() => navigate(`/dashboard/products/variations/edit/${v._id}`)} className="bg-white text-blue-500 px-3 py-1 rounded mr-2"><i className="fas fa-pen"></i></button>
                        <button onClick={() => handleDelete(v._id)} className="bg-white text-red-500 px-3 py-1 rounded"><i className="fas fa-trash"></i></button>
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
