import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUserHooks } from '../../hooks/userHooks'

const EditUser = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    loading,
    error,
    fieldErrors,
    setError,
    setFieldErrors,
    getUserById,
    updateUser
  } = useUserHooks()

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    mobile: '',
    role: ''
  })
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const loadUser = async () => {
      console.log('ID from params:', id)                    // check if id exists
      const res = await getUserById(id)
      console.log('getUserById response:', res)             // check what comes back
      if (res?.success && res.user) {
        setForm({
          first_name: res.user.first_name || '',
          last_name: res.user.last_name || '',
          email: res.user.email || '',
          mobile: res.user.mobile || '',
          role: res.user.role || ''
        })
      }
    }
    loadUser()
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

    const res = await updateUser(id, form)
    if (res?.success) {
      setSuccess('User updated successfully')
      setTimeout(() => navigate('/dashboard/users'), 500)
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
          <h1 className="text-white text-[22px] font-semibold m-0">Edit User</h1>
          <p className="text-[#90bcc4] text-[15px] mt-1">Update user details</p>
        </div>

        {/* Card */}
        <div
          className="relative z-10 bg-white w-full px-14 py-10 shadow-xl rounded-t-[20px] overflow-auto"
          style={{ height: 'calc(100% - 70px)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Row 1 — First Name & Last Name */}
            <div className="flex gap-6">
              <div className="flex-1">
                <label className="text-sm text-gray-700">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  placeholder="John"
                  className="w-full border-b border-gray-300 focus:border-teal-600 outline-none py-1 bg-transparent"
                />
                {fieldErrors.first_name && (
                  <p className="text-red-600 text-xs mt-1">{fieldErrors.first_name}</p>
                )}
              </div>
              <div className="flex-1">
                <label className="text-sm text-gray-700">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  placeholder="Doe"
                  className="w-full border-b border-gray-300 focus:border-teal-600 outline-none py-1 bg-transparent"
                />
                {fieldErrors.last_name && (
                  <p className="text-red-600 text-xs mt-1">{fieldErrors.last_name}</p>
                )}
              </div>
            </div>

            {/* Row 2 — Email & Mobile */}
            <div className="flex gap-6">
              <div className="flex-1">
                <label className="text-sm text-gray-700">Email</label>
                <input
                  type="text"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="john@gmail.com"
                  className="w-full border-b border-gray-300 focus:border-teal-600 outline-none py-1 bg-transparent"
                />
                {fieldErrors.email && (
                  <p className="text-red-600 text-xs mt-1">{fieldErrors.email}</p>
                )}
              </div>
              <div className="flex-1">
                <label className="text-sm text-gray-700">Mobile Number</label>
                <input
                  type="text"
                  name="mobile"
                  value={form.mobile}
                  onChange={handleChange}
                  placeholder="0771234567"
                  maxLength={10}
                  className="w-full border-b border-gray-300 focus:border-teal-600 outline-none py-1 bg-transparent"
                />
                {fieldErrors.mobile && (
                  <p className="text-red-600 text-xs mt-1">{fieldErrors.mobile}</p>
                )}
              </div>
            </div>

            {/* Row 3 — Role & empty */}
            <div className="flex gap-6">
              <div className="flex-1">
                <label className="text-sm text-gray-700">Role</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full border-b border-gray-300 focus:border-teal-600 outline-none py-1 bg-transparent text-gray-700"
                >
                  <option value="">Select a role</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
                {fieldErrors.role && (
                  <p className="text-red-600 text-xs mt-1">{fieldErrors.role}</p>
                )}
              </div>
              <div className="flex-1" />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}
            {success && <p className="text-teal-700 text-sm">{success}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => navigate('/dashboard/users')}
                className="bg-[#0e5a6a] text-white text-md px-6 py-3 rounded hover:opacity-90"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-[#2699aa] text-white text-md px-6 py-3 rounded hover:opacity-90"
              >
                {loading ? 'Updating...' : 'Update User'}
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

export default EditUser
