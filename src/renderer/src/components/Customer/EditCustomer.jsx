import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCustomerHooks } from '../../hooks/customerHooks'

const EditCustomer = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    loading,
    error,
    fieldErrors,
    setError,
    setFieldErrors,
    getCustomerById,
    updateCustomer
  } = useCustomerHooks()

  const [form, setForm] = useState({
    name: '',
    mobileNumber: '',
    nicNumber: '',
    address: ''
  })
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const loadCustomer = async () => {
      const res = await getCustomerById(id)
      if (res?.success && res.customer) {
        setForm({
          name: res.customer.name || '',
          mobileNumber: res.customer.mobileNumber || '',
          nicNumber: res.customer.nicNumber || '',
          address: res.customer.address || ''
        })
      }
    }

    loadCustomer()
  }, [id])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSuccess('')

    const res = await updateCustomer(id, form)
    if (res?.success) {
      setSuccess('Customer updated successfully')
      setTimeout(() => navigate('/dashboard/customers'), 500)
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
          <h1 className="text-white text-[22px] font-semibold m-0">Edit Customer</h1>
          <p className="text-[#90bcc4] text-[15px] mt-1">Update customer details</p>
        </div>

        {/* Card */}
        <div className="relative z-10 bg-white w-full px-14 py-10 shadow-xl rounded-t-[20px] overflow-auto" style={{ height: 'calc(100% - 70px)' }}>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Row 1 — Name & Mobile */}
            <div className="flex gap-6">
              <div className="flex-1">
                <label className="text-sm text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Customer name"
                  className="w-full border-b border-gray-300 focus:border-teal-600 outline-none py-1 bg-transparent"
                />
                {fieldErrors.name && <p className="text-red-600 text-xs mt-1">{fieldErrors.name}</p>}
              </div>
              <div className="flex-1">
                <label className="text-sm text-gray-700">Mobile Number</label>
                <input
                  type="text"
                  name="mobileNumber"
                  value={form.mobileNumber}
                  onChange={handleChange}
                  placeholder="0771234567"
                  maxLength={10}
                  className="w-full border-b border-gray-300 focus:border-teal-600 outline-none py-1 bg-transparent"
                />
                {fieldErrors.mobileNumber && <p className="text-red-600 text-xs mt-1">{fieldErrors.mobileNumber}</p>}
              </div>
            </div>

            {/* Row 2 — NIC & empty */}
            <div className="flex gap-6">
              <div className="flex-1">
                <label className="text-sm text-gray-700">NIC Number</label>
                <input
                  type="text"
                  name="nicNumber"
                  value={form.nicNumber}
                  onChange={handleChange}
                  placeholder="200012345678"
                  maxLength={12}
                  className="w-full border-b border-gray-300 focus:border-teal-600 outline-none py-1 bg-transparent"
                />
                {fieldErrors.nicNumber && <p className="text-red-600 text-xs mt-1">{fieldErrors.nicNumber}</p>}
              </div>
              <div className="flex-1" />
            </div>

            {/* Address — full width */}
            <div>
              <label className="text-sm text-gray-700">Address</label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="123 Main St, Colombo"
                rows={3}
                className="w-full border-b border-gray-300 focus:border-teal-600 outline-none py-1 bg-transparent resize-none"
              />
              {fieldErrors.address && <p className="text-red-600 text-xs mt-1">{fieldErrors.address}</p>}
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}
            {success && <p className="text-teal-700 text-sm">{success}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => navigate('/dashboard/customers')}
                className="bg-[#0e5a6a] text-white text-md px-6 py-3 rounded hover:opacity-90"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-[#2699aa] text-white text-md px-6 py-3 rounded hover:opacity-90"
              >
                {loading ? 'Updating...' : 'Update Customer'}
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

export default EditCustomer
