import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStoreHooks } from '../../hooks/storeHooks'

const ViewStore = () => {
  const navigate = useNavigate()
  const { getAllStores, deleteStore, loading, error } = useStoreHooks()
  const [stores, setStores] = useState([])

  const loadStores = async () => {
    const res = await getAllStores()
    if (res?.success) {
      setStores(res.data || [])
    }
  }

  useEffect(() => {
    loadStores()
  }, [])

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this store?')
    if (!confirmDelete) return

    const res = await deleteStore(id)
    if (res?.success) {
      setStores((prev) => prev.filter((s) => s._id !== id))
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
          <h1 className="text-white text-[22px] font-semibold m-0">Store</h1>
          <p className="text-[#90bcc4] text-[15px] mt-1">Manage store records</p>
        </div>

        {/* Card */}
        <div className="relative z-10 bg-white w-full px-14 py-10 shadow-xl rounded-t-[20px] overflow-auto" style={{ height: 'calc(100% - 70px)' }}>

          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-semibold text-[#1a6b7a]">
                Stores
              </h2>
              <p className="text-xs text-gray-500">
                Manage store records
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => navigate('/dashboard/stores/create')}
                className="bg-[#2699aa] text-white text-md px-6 py-3 rounded hover:opacity-90"
              >
                + Create Store
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
                  <th className="text-left px-3 py-2 border-b">Store Name</th>
                  <th className="text-left px-3 py-2 border-b">Store Key</th>
                  <th className="text-left px-3 py-2 border-b">Status</th>
                  <th className="text-right px-3 py-2 border-b">Actions</th>
                </tr>
              </thead>

              <tbody>
                {stores.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-gray-500 text-xs">
                      No stores found
                    </td>
                  </tr>
                ) : (
                  stores.map((store) => (
                    <tr key={store._id} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2">{store.name}</td>
                      <td className="px-3 py-2">{store.store_key}</td>

                      <td className="px-3 py-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          store.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {store.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex gap-2 justify-end w-full">

                          <button
                            onClick={() => navigate(`/dashboard/stores/edit/${store._id}`)}
                            className="bg-white text-blue-500 text-sm px-3 py-1 rounded hover:opacity-90"
                          >
                            <i className="fas fa-pen"></i>
                          </button>

                          <button
                            onClick={() => handleDelete(store._id)}
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

export default ViewStore
