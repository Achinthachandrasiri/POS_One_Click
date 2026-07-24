import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserHooks } from '../../hooks/userHooks'

const normalizeRoleName = (value) => value?.trim().toLowerCase().replace(/[^a-z0-9]/g, '')

const ViewUser = () => {
  const navigate = useNavigate()
  const { getAllUsers, deleteUser, loading, error, canSeeSuperAdmin } = useUserHooks()
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')

  const loadUsers = async () => {
    const res = await getAllUsers()
    if (res?.success) {
      setUsers(res.users || [])
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this user?')
    if (!confirmDelete) return

    const res = await deleteUser(id)
    if (res?.success) {
      setUsers((prev) => prev.filter((u) => u._id !== id))
    }
  }

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    const visibleUsers = canSeeSuperAdmin
      ? users
      : users.filter((u) => normalizeRoleName(u.role) !== 'superadmin')

    if (!q) return visibleUsers
    return visibleUsers.filter((u) =>
      `${u.first_name} ${u.last_name} ${u.email} ${u.mobile} ${u.role}`
        .toLowerCase()
        .includes(q)
    )
  }, [search, users, canSeeSuperAdmin])

  return (
    <div className="relative min-h-full px-8 pt-8 pb-0 overflow-hidden">
      <div className="flex flex-col h-[630px]">

        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-[880px] h-[780px] bg-[#2699aa] opacity-40 rounded-full right-[-200px] bottom-[-200px]" />
          <div className="absolute w-[580px] h-[580px] bg-[#30aabb] opacity-25 rounded-full right-[-120px] bottom-[-120px]" />
          <div className="absolute w-[420px] h-[420px] bg-[#2699aa] opacity-30 rounded-full left-[-80px] top-[-80px] p-0 m-0" />
        </div>

        {/* Page title */}
        <div className="relative z-10 mb-5">
          <h1 className="text-white text-[22px] font-semibold m-0">Users</h1>
          <p className="text-[#90bcc4] text-[15px] mt-1">Manage user records</p>
        </div>

        {/* Card */}
        <div className="relative z-10 bg-white w-full px-14 py-10 shadow-xl rounded-t-[20px] overflow-auto" style={{ height: 'calc(100% - 70px)' }}>
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="flex mt-4 gap-2">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border-2 border-gray-400 rounded-lg focus:outline-none focus:border-[#1a6b7a] text-sm text-gray-700 placeholder-gray-400 p-3 w-80 bg-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end mt-4 gap-2">
              <button
                onClick={() => navigate('/dashboard/users/create')}
                className="bg-[#1a6b7a] border-2 border-[#1a6b7a] text-white text-md px-6 py-3 rounded-lg hover:opacity-90"
              >
                + Create User
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-600 text-xs mb-3">{error}</p>
          )}

          {/* Table */}
          <div className="border border-gray-200 rounded overflow-auto max-h-[60vh]">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="bg-[#f5fbfd] text-[#2a5b67] text-xs">
                  <th className="text-left px-3 py-2 border-b">First Name</th>
                  <th className="text-left px-3 py-2 border-b">Last Name</th>
                  <th className="text-left px-3 py-2 border-b">Email</th>
                  <th className="text-left px-3 py-2 border-b">Mobile</th>
                  <th className="text-left px-3 py-2 border-b">Role</th>
                  <th className="text-right px-3 py-2 border-b">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-gray-500 text-xs">
                      {search ? 'No users match your search' : 'No users found'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2">{user.first_name}</td>
                      <td className="px-3 py-2">{user.last_name}</td>
                      <td className="px-3 py-2">{user.email}</td>
                      <td className="px-3 py-2">{user.mobile}</td>
                      <td className="px-3 py-2 capitalize">{user.role}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex gap-2 justify-end w-full">
                          <button
                            onClick={() => navigate(`/dashboard/users/edit/${user._id}`)}
                            className="bg-white text-blue-500 text-sm px-3 py-1 rounded hover:opacity-90"
                          >
                            <i className="fas fa-pen"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(user._id)}
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

export default ViewUser
