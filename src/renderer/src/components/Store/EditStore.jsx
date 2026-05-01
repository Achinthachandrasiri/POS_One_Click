import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStoreHooks } from '../../hooks/storeHooks'

const EditStore = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    loading,
    error,
    fieldErrors,
    setError,
    setFieldErrors,
    getStoreById,
    updateStore
  } = useStoreHooks()

  const [form, setForm] = useState({
    name: '',
    store_key: '',
    is_active: true
  })
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const loadStore = async () => {
      const res = await getStoreById(id)
      if (res?.success && res.data) {
        setForm({
          name: res.data.name || '',
          store_key: res.data.store_key || '',
          is_active: res.data.is_active ?? true
        })
      }
    }

    loadStore()
  }, [id])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSuccess('')

    const res = await updateStore({ id, ...form })
    if (res?.success) {
      setSuccess('Store updated successfully')
      setTimeout(() => navigate('/dashboard/stores'), 500)
    }
  }

  return (
    <div className="relative min-h-full px-8 pt-8 pb-0 overflow-hidden">
      <div className="flex flex-col h-[630px]">

        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-[880px] h-[780px] bg-[#2699aa] opacity-40 rounded-full right-[-200px] bottom-[-200px]" />
          <div className="absolute w-[580px] h-[580px] bg-[#30aabb] opacity-25 rounded-full right-[-120px] bottom-[-120px]" />
          <div className="absolute w-[420px] h-[420px] bg-[#2699aa] opacity-30 rounded-full left-[-80px] top-[-80px]" />
        </div>

        {/* Page title */}
        <div className="relative z-10 mb-5">
          <h1 className="text-white text-[22px] font-semibold m-0">Edit Store</h1>
          <p className="text-[#90bcc4] text-[15px] mt-1">Update store details</p>
        </div>

        {/* Card */}
        <div
          className="relative z-10 bg-white w-full px-14 py-10 shadow-xl rounded-t-[20px] overflow-auto"
          style={{ height: 'calc(100% - 70px)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Row 1 — Name & Store Key */}
            <div className="flex gap-6">
              <div className="flex-1">
                <label className="text-sm text-gray-700">Store Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter store name"
                  className="w-full border-b border-gray-300 focus:border-teal-600 outline-none py-1 bg-transparent"
                />
                {fieldErrors.name && (
                  <p className="text-red-600 text-xs mt-1">{fieldErrors.name}</p>
                )}
              </div>
              <div className="flex-1">
                <label className="text-sm text-gray-700">Store Key</label>
                <input
                  type="text"
                  name="store_key"
                  value={form.store_key}
                  onChange={handleChange}
                  placeholder="Enter store key"
                  className="w-full border-b border-gray-300 focus:border-teal-600 outline-none py-1 bg-transparent"
                />
                {fieldErrors.store_key && (
                  <p className="text-red-600 text-xs mt-1">{fieldErrors.store_key}</p>
                )}
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <label className="text-sm text-gray-700">Active Store</label>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}
            {success && <p className="text-teal-700 text-sm">{success}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => navigate('/dashboard/stores')}
                className="bg-[#0e5a6a] text-white text-md px-6 py-3 rounded hover:opacity-90"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-[#2699aa] text-white text-md px-6 py-3 rounded hover:opacity-90"
              >
                {loading ? 'Updating...' : 'Update Store'}
              </button>
            </div>

          </form>

          <p className="text-xs text-gray-500 mt-6 text-center">
            Powered by <strong>Alpha Devs</strong>
          </p>
        </div>
      </div>
    </div>
  )
}

export default EditStore
