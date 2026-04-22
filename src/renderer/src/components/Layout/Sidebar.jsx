import { useNavigate } from 'react-router-dom'

const Sidebar = () => {
  const navigate = useNavigate()

  const handleLogout = () => {
    navigate('/')
  }

  return (
    <aside className="relative z-10 flex flex-col w-[220px] min-h-full bg-[#1a3d4d] shadow-[2px_0_12px_rgba(0,0,0,0.18)]">

      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-7 border-b border-[#ffffff18]">
        <div className="w-8 h-8 rounded-full bg-[#1a6b7a] flex items-center justify-center text-white text-sm font-bold">A</div>
        <span className="text-white text-[15px] font-semibold tracking-wide">Alpha Devs</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-3 pt-5 flex-1">
        {[
          { icon: '🏠', label: 'Dashboard', path: '/dashboard' },
          { icon: '👤', label: 'User', path: '/dashboard/create-user' },
          { icon: '👤', label: 'Profile', path: '/profile' },
          { icon: '⚙️', label: 'Settings', path: '/settings' },
        ].map(({ icon, label, path }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-[#b0cdd4] hover:bg-[#ffffff12] hover:text-white"
          >
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-6">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-[#b0cdd4] hover:bg-[#ffffff12] hover:text-white w-full text-left"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
