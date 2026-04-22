import { useLocation, useNavigate } from 'react-router-dom'

const DashboardPage = ({ user }) => {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    navigate('/')
  }

  const navItems = [
    { icon: '🏠', label: 'Dashboard', path: '/dashboard' },
    { icon: '👥', label: 'Customers', path: '/customers/view' },
    { icon: '👤', label: 'Profile' },
    { icon: '⚙️', label: 'Settings' },
    { icon: '📊', label: 'Reports' },
    { icon: '🔔', label: 'Notifications' }
  ]

  return (
    <div className="fixed inset-0 flex overflow-hidden font-['Segoe_UI',sans-serif] bg-[#225166]">
      {/* Background */}
      <svg className="absolute w-full h-full pointer-events-none" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <ellipse cx="1180" cy="980" rx="680" ry="680" fill="#2699aa" opacity="0.55" />
        <ellipse cx="1220" cy="1020" rx="480" ry="480" fill="#30aabb" opacity="0.30" />
        <ellipse cx="-60" cy="-40" rx="320" ry="320" fill="#0e5a6a" opacity="0.40" />
      </svg>

      {/* Sidebar */}
      <aside className="relative z-10 flex flex-col w-[220px] min-h-full bg-[#1a3d4d] shadow-[2px_0_12px_rgba(0,0,0,0.18)]">
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-7 border-b border-[#ffffff18]">
          <div className="w-8 h-8 rounded-full bg-[#1a6b7a] flex items-center justify-center text-white text-sm font-bold">A</div>
          <span className="text-white text-[15px] font-semibold tracking-wide">Alpha Devs</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 px-3 pt-5 flex-1">
          {navItems.map(({ icon, label, path }) => {
            const active = path ? location.pathname === path : false

            return (
            <button
              key={label}
              onClick={() => path && navigate(path)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-[4px] text-[14px] cursor-pointer border-none text-left w-full transition-colors
                ${active
                  ? 'bg-[#1a6b7a] text-white'
                  : 'bg-transparent text-[#b0cdd4] hover:bg-[#ffffff12] hover:text-white'
                }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-6">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-[4px] text-[14px] cursor-pointer border-none bg-transparent text-[#b0cdd4] hover:bg-[#ffffff12] hover:text-white w-full text-left transition-colors"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col overflow-y-auto">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-8 py-5 bg-[#ffffff0d] border-b border-[#ffffff18]">
          <div>
            <h1 className="text-white text-[20px] font-semibold m-0">Dashboard</h1>
            <p className="text-[#90bcc4] text-[13px] m-0 mt-0.5">Welcome back! Here's what's happening.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#1a6b7a] flex items-center justify-center text-white text-[15px] font-bold">
              {user?.username?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <span className="text-[#cce6ea] text-[14px]">{user?.username ?? 'User'}</span>
          </div>
        </header>

        {/* Cards */}
        <div className="grid grid-cols-3 gap-5 px-8 pt-7">
          {[
            { label: 'Total Users', value: '1,284', icon: '👥', change: '+12%' },
            { label: 'Active Sessions', value: '47', icon: '🟢', change: '+3%' },
            { label: 'Reports Today', value: '9', icon: '📄', change: '-1%' },
          ].map(({ label, value, icon, change }) => (
            <div key={label} className="bg-white rounded-[4px] px-6 py-5 shadow-[0_4px_20px_rgba(0,0,0,0.12)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] text-[#777]">{label}</span>
                <span className="text-xl">{icon}</span>
              </div>
              <div className="text-[28px] font-semibold text-[#222]">{value}</div>
              <div className={`text-[12px] mt-1 ${change.startsWith('+') ? 'text-[#27ae60]' : 'text-[#c0392b]'}`}>
                {change} from yesterday
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mx-8 mt-6 bg-white rounded-[4px] shadow-[0_4px_20px_rgba(0,0,0,0.12)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#eee]">
            <h2 className="text-[15px] font-semibold text-[#222] m-0">Recent Activity</h2>
          </div>
          <table className="w-full border-collapse text-[14px]">
            <thead>
              <tr className="bg-[#f7f9fa]">
                {['User', 'Action', 'Time', 'Status'].map((h) => (
                  <th key={h} className="text-left px-6 py-3 text-[#777] font-medium text-[13px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { user: 'john@gmail.com', action: 'Logged in', time: '2 min ago', status: 'Success' },
                { user: 'jane@gmail.com', action: 'Updated profile', time: '15 min ago', status: 'Success' },
                { user: 'mike@gmail.com', action: 'Login attempt', time: '1 hr ago', status: 'Failed' },
                { user: 'sara@gmail.com', action: 'Generated report', time: '3 hr ago', status: 'Success' },
              ].map((row, i) => (
                <tr key={i} className="border-t border-[#f0f0f0] hover:bg-[#f7f9fa] transition-colors">
                  <td className="px-6 py-3 text-[#333]">{row.user}</td>
                  <td className="px-6 py-3 text-[#555]">{row.action}</td>
                  <td className="px-6 py-3 text-[#888]">{row.time}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[12px] font-medium
                      ${row.status === 'Success'
                        ? 'bg-[#e8f8f0] text-[#27ae60]'
                        : 'bg-[#fdecea] text-[#c0392b]'
                      }`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}

export default DashboardPage
