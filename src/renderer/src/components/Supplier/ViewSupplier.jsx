import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSupplierHooks } from '../../hooks/supplierHooks'

const ViewSupplier = () => {
  const navigate = useNavigate()
  const { getAllSuppliers, deleteSupplier, loading, error } = useSupplierHooks()
  const [suppliers, setSuppliers] = useState([])

  const loadSuppliers = async () => {
    const res = await getAllSuppliers()
    if (res?.success) {
      setSuppliers(res.suppliers || [])
    }
  }

  useEffect(() => {
    loadSuppliers()
  }, [])

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this supplier?')
    if (!confirmDelete) return

    const res = await deleteSupplier(id)
    if (res?.success) {
      setSuppliers((prev) => prev.filter((supplier) => supplier._id !== id))
    }
  }

  return (
    <div className="relative min-h-full px-8 pt-8 pb-0 overflow-hidden">
      <div className="flex flex-col h-[630px]">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-[880px] h-[780px] bg-[#2699aa] opacity-40 rounded-full right-[-200px] bottom-[-200px]" />
          <div className="absolute w-[580px] h-[580px] bg-[#30aabb] opacity-25 rounded-full right-[-120px] bottom-[-120px]" />
          <div className="absolute w-[420px] h-[420px] bg-[#2699aa] opacity-30 rounded-full left-[-80px] top-[-80px] p-0 m-0" />
        </div>

        <div className="relative z-10 mb-5">
          <h1 className="text-white text-[22px] font-semibold m-0">Supplier</h1>
          <p className="text-[#90bcc4] text-[15px] mt-1">Manage supplier records</p>
        </div>

        <div className="relative z-10 bg-white w-full px-14 py-10 shadow-xl rounded-t-[20px] overflow-auto" style={{ height: 'calc(100% - 70px)' }}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-semibold text-[#1a6b7a]">Suppliers</h2>
              <p className="text-xs text-gray-500">Manage supplier records</p>
            </div>

            <div className="flex gap-2">
              <div className="flex justify-end mt-4 gap-2">
                <button
                  onClick={() => navigate('/dashboard/suppliers/create')}
                  className="bg-[#2699aa] text-white text-md px-6 py-3 rounded hover:opacity-90"
                >
                  + Create Supplier
                </button>
              </div>
            </div>
          </div>

          {error && <p className="text-red-600 text-xs mb-3">{error}</p>}

          <div className="border border-gray-200 rounded overflow-auto max-h-[60vh]">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="bg-[#f5fbfd] text-[#2a5b67] text-xs">
                  <th className="text-left px-3 py-2 border-b">Name</th>
                  <th className="text-left px-3 py-2 border-b">Mobile</th>
                  <th className="text-left px-3 py-2 border-b">NIC</th>
                  <th className="text-left px-3 py-2 border-b">Address</th>
                  <th className="text-right px-3 py-2 border-b">Actions</th>
                </tr>
              </thead>

              <tbody>
                {suppliers.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-500 text-xs">
                      No suppliers found
                    </td>
                  </tr>
                ) : (
                  suppliers.map((supplier) => (
                    <tr key={supplier._id} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2">{supplier.name}</td>
                      <td className="px-3 py-2">{supplier.mobileNumber}</td>
                      <td className="px-3 py-2">{supplier.nicNumber}</td>
                      <td className="px-3 py-2">{supplier.address}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex gap-2 justify-end w-full">
                          <button
                            onClick={() => navigate(`/dashboard/suppliers/edit/${supplier._id}`)}
                            className="bg-white text-blue-500 text-sm px-3 py-1 rounded hover:opacity-90"
                          >
                            <i className="fas fa-pen"></i>
                          </button>

                          <button
                            onClick={() => handleDelete(supplier._id)}
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

export default ViewSupplier