import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiHome,
  FiUsers,
  FiUser,
  FiUserPlus,
  FiChevronDown,
  FiChevronRight,
} from "react-icons/fi"

const Sidebar = () => {
  const navigate = useNavigate()
  const [peopleOpen, setPeopleOpen] = useState(false)

  const handleLogout = () => {
    navigate('/')
  }

  return (
    <aside className="relative z-10 flex flex-col w-[260px] min-h-full bg-[#1a3d4d] shadow-[2px_0_12px_rgba(0,0,0,0.18)]">

      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-[30.6px] border-b border-[#ffffff18]">
        <div className="w-8 h-8 rounded-full bg-[#1a6b7a] flex items-center justify-center text-white text-sm font-bold">A</div>
        <span className="text-white text-[15px] font-semibold tracking-wide">Alpha Devs</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-3 pt-5 flex-1">

        {/* Dashboard */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-3 px-4 py-2.5 text-[15px] text-white hover:bg-[#0e5a6a] rounded-md"
        >
          <FiHome />
          <span>Dashboard</span>
        </button>

        {/* People — expandable */}
        <div>
          <button
            onClick={() => setPeopleOpen(!peopleOpen)}
            className="flex items-center justify-between w-full px-4 py-2.5 text-[15px] text-white hover:bg-[#0e5a6a] rounded-md"
          >
            <div className="flex items-center gap-3">
              <FiUsers />
              <span>People</span>
            </div>
            <span className="text-md">
              {peopleOpen ? <FiChevronDown /> : <FiChevronRight />}
            </span>
          </button>

          {/* Sub items */}
          {peopleOpen && (
            <div className="flex flex-col mt-1 ml-4 border-l border-[#ffffff25] pl-3 gap-1">
              <button
                onClick={() => navigate('/dashboard/users')}
                className="flex items-center gap-3 px-3 py-2 text-[16px] text-[#ffffff] hover:text-white hover:bg-[#0e5a6a] rounded-md"
              >
                <FiUser />
                <span>Users</span>
              </button>
              <button
                onClick={() => navigate('/dashboard/customers')}
                className="flex items-center gap-3 px-3 py-2 text-[16px] text-[#ffffff] hover:text-white hover:bg-[#0e5a6a] rounded-md"
              >
                <FiUserPlus />
                <span>Customers</span>
              </button>
              <button
                onClick={() => navigate('/dashboard/suppliers')}
                className="flex items-center gap-3 px-3 py-2 text-[16px] text-[#ffffff] hover:text-white hover:bg-[#0e5a6a] rounded-md"
              >
                <FiUsers />
                <span>Suppliers</span>
              </button>
            </div>
          )}
        </div>

      </nav>

      {/* Logout */}
      <div className="px-3 pb-6">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 text-[15px] text-white hover:bg-[#0e5a6a] rounded-md w-full text-left"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
