import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const CreateUserPage = () => {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    mobile: '',
    password: '',
    role: ''
  })

  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setFieldErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setFieldErrors({})
    setLoading(true)

    try {
      const res = await window.api.user.create(form)
      if (res?.success) {
        setSuccess('User created successfully!')
        setForm({ first_name: '', last_name: '', email: '', mobile: '', password: '', role: '' })
      } else if (res?.fieldErrors) {
        setFieldErrors(res.fieldErrors)
      } else {
        setError(res?.error || 'Something went wrong.')
      }
    } catch (err) {
      console.error(err)
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-full px-8 pt-8 pb-0 overflow-hidden">
      <div className="flex flex-col h-[630px]">
        {/* Background blobs — positioned relative to this container */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-[880px] h-[780px] bg-[#2699aa] opacity-40 rounded-full right-[-200px] bottom-[-200px]" />
          <div className="absolute w-[580px] h-[580px] bg-[#30aabb] opacity-25 rounded-full right-[-120px] bottom-[-120px]" />
          <div className="absolute w-[420px] h-[420px] bg-[#2699aa] opacity-30 rounded-full left-[-80px] top-[-80px] p-0 m-0" />
        </div>

        {/* Page title — above the card */}
        <div className="relative z-10 mb-5">
          <h1 className="text-white text-[22px] font-semibold m-0">Create User</h1>
          <p className="text-[#90bcc4] text-[15px] mt-1">Fill in all fields to create a new account</p>
        </div>

        {/* Card */}
        <div className="relative z-10 bg-white w-full px-14 py-10 shadow-xl rounded-t-[20px] overflow-auto" style={{ height: 'calc(100% - 70px)' }}>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Row 1 */}
            <div className="flex gap-6">
              <div className="flex-1">
                <label className="text-sm text-gray-700">First Name</label>
                <input
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  placeholder="John"
                  className="w-full border-b border-gray-300 focus:border-teal-600 outline-none py-1 bg-transparent"
                />
                {fieldErrors.first_name && <p className="text-red-600 text-xs mt-1">{fieldErrors.first_name}</p>}
              </div>
              <div className="flex-1">
                <label className="text-sm text-gray-700">Last Name</label>
                <input
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  placeholder="Doe"
                  className="w-full border-b border-gray-300 focus:border-teal-600 outline-none py-1 bg-transparent"
                />
                {fieldErrors.last_name && <p className="text-red-600 text-xs mt-1">{fieldErrors.last_name}</p>}
              </div>
            </div>

            {/* Email */}
            <div className="flex gap-6">
              <div className="flex-1">
                <label className="text-sm text-gray-700">Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="john@gmail.com"
                  className="w-full border-b border-gray-300 focus:border-teal-600 outline-none py-1 bg-transparent"
                />
                {fieldErrors.email && <p className="text-red-600 text-xs mt-1">{fieldErrors.email}</p>}
              </div>

              {/* Mobile */}
              <div className="flex-1">
                <label className="text-sm text-gray-700">Mobile</label>
                <input
                  name="mobile"
                  value={form.mobile}
                  onChange={handleChange}
                  placeholder="0771234567"
                  maxLength={10}
                  className="w-full border-b border-gray-300 focus:border-teal-600 outline-none py-1 bg-transparent"
                />
                {fieldErrors.mobile && <p className="text-red-600 text-xs mt-1">{fieldErrors.mobile}</p>}
              </div>
            </div>

            {/* Row 2 */}
            <div className="flex gap-6">
              <div className="flex-1">
                <label className="text-sm text-gray-700">Role</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full border-b border-gray-300 focus:border-teal-600 outline-none py-1 bg-transparent"
                >
                  <option value="">Select role</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
                {fieldErrors.role && <p className="text-red-600 text-xs mt-1">{fieldErrors.role}</p>}
              </div>

              <div className="flex-1 relative">
                <label className="text-sm text-gray-700">Password</label>
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="********"
                  className="w-full border-b border-gray-300 focus:border-teal-600 outline-none py-1 pr-10 bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-7 text-sm"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
                {fieldErrors.password && <p className="text-red-600 text-xs mt-1">{fieldErrors.password}</p>}
              </div>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}
            {success && <p className="text-teal-700 text-sm">{success}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => navigate('/dashboard/users')}
                className="bg-[#0e5a6a] text-white text-md px-6 py-3 rounded hover:opacity-90"
              >
                View User
              </button>

              <button
                type="submit"
                disabled={loading}
                className="bg-[#2699aa] text-white text-md px-6 py-3 rounded hover:opacity-90"
              >
                {loading ? 'Saving...' : 'Save User'}
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

export default CreateUserPage
