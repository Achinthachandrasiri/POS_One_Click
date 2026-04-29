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

const TreeLines = ({ itemCount }) => {
  const itemHeight = 40
  const lineX = 12

  return (
    <svg
      className="absolute left-0 top-0 pointer-events-none"
      width={lineX + 24}
      height={itemCount * itemHeight}
      style={{ overflow: 'visible' }}
    >
      {/* Vertical trunk */}
      <line
        x1={lineX}
        y1={0}
        x2={lineX}
        y2={(itemCount - 1) * itemHeight + 20}
        stroke="#ffffff"
        strokeWidth="1.5"
      />

      {/* Smooth cubic bezier curve branch for each item */}
      {Array.from({ length: itemCount }).map((_, i) => {
        const startY = i === 0 ? 0 : i * itemHeight
        const endY = i * itemHeight + 20
        const endX = lineX + 22

        return (
          <path
            key={i}
            // Start at trunk, curve down-then-right smoothly
            d={`M ${lineX} ${startY} C ${lineX} ${endY}, ${lineX} ${endY}, ${endX} ${endY}`}
            stroke="#ffffff"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        )
      })}
    </svg>
  )
}

const Sidebar = () => {
  const navigate = useNavigate()
  const [peopleOpen, setPeopleOpen] = useState(false)

  const subItems = [
    { label: 'Users', icon: <FiUser />, path: '/dashboard/users' },
    { label: 'Customers', icon: <FiUserPlus />, path: '/dashboard/customers' },
    { label: 'Suppliers', icon: <FiUsers />, path: '/dashboard/suppliers' },
  ]

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

          {/* Sub items with curved tree lines */}
          {peopleOpen && (
            <div className="relative flex flex-col mt-1 ml-6 gap-0">
              <TreeLines itemCount={subItems.length} />
              {subItems.map((item, i) => (
                <button
                  key={i}
                  onClick={() => navigate(item.path)}
                  className="relative flex items-center gap-3 pl-9 pr-3 py-2.5 text-[15px] text-[#ffffff] hover:text-white hover:bg-[#0e5a6a] rounded-md text-left"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

      </nav>

      {/* Logout */}
      <div className="px-3 pb-6">
        <button
          onClick={() => navigate('/')}
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
