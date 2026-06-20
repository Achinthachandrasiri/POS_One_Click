import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiHome,
  FiUsers,
  FiUser,
  FiUserPlus,
  FiChevronDown,
  FiChevronRight,
  FiShoppingCart,
  FiDollarSign,
  FiBox,
  FiTag,
  FiGrid,
  FiSliders,
  FiPackage,
  FiSettings,
  FiMail
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
      {/* Vertical trunk — runs down to just before last item curve */}
      <line
        x1={lineX}
        y1={0}
        x2={lineX}
        y2={(itemCount - 1) * itemHeight + 12}
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Curved L-branch per item: drops down trunk then sweeps right */}
      {Array.from({ length: itemCount }).map((_, i) => {
        const branchY = i * itemHeight + 20
        const curveStart = branchY - 8
        const endX = lineX + 22
        return (
          <path
            key={i}
            d={`M ${lineX} ${curveStart} Q ${lineX} ${branchY} ${endX} ${branchY}`}
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
  const [productsOpen, setProductsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const subItems = [
    { label: 'Users', icon: <FiUser />, path: '/dashboard/users' },
    { label: 'Customers', icon: <FiUserPlus />, path: '/dashboard/customers' },
    { label: 'Suppliers', icon: <FiUsers />, path: '/dashboard/suppliers' },
  ]

  const productSubItems = [
    { label: 'Brand', icon: <FiTag />, path: '/dashboard/products/brands' },
    { label: 'Category', icon: <FiGrid />, path: '/dashboard/products/categories' },
    { label: 'Variation', icon: <FiSliders />, path: '/dashboard/products/variations' },
    { label: 'Unit', icon: <FiPackage />, path: '/dashboard/products/units' },
    { label: 'Products', icon: <FiBox />, path: '/dashboard/products' }
  ]

  const settingsSubItems = [
    { label: 'General Settings', icon: <FiSliders />, path: '/dashboard/settings/general' },
    { label: 'Mail Settings', icon: <FiMail />, path: '/dashboard/settings/mail' },
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

        {/* Products — expandable */}
        <div>
          <button
            onClick={() => setProductsOpen(!productsOpen)}
            className="flex items-center justify-between w-full px-4 py-2.5 text-[15px] text-white hover:bg-[#0e5a6a] rounded-md"
          >
            <div className="flex items-center gap-3">
              <FiBox />
              <span>Products</span>
            </div>
            <span className="text-md">
              {productsOpen ? <FiChevronDown /> : <FiChevronRight />}
            </span>
          </button>

          {/* Product sub items with curved tree lines */}
          {productsOpen && (
            <div className="relative flex flex-col mt-1 ml-6 gap-0">
              <TreeLines itemCount={productSubItems.length} />
              {productSubItems.map((item, i) => (
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

        {/* Store */}
        <button
          onClick={() => navigate('/dashboard/stores')}
          className="flex items-center gap-3 px-4 py-2.5 text-[15px] text-white hover:bg-[#0e5a6a] rounded-md"
        >
          <FiShoppingCart />
          <span>Store</span>
        </button>

        {/* Expenses */}
        <button
          onClick={() => navigate('/dashboard/expenses')}
          className="flex items-center gap-3 px-4 py-2.5 text-[15px] text-white hover:bg-[#0e5a6a] rounded-md"
        >
          <FiDollarSign />
          <span>Expenses</span>
        </button>

        {/* Settings — expandable */}
        <div>
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="flex items-center justify-between w-full px-4 py-2.5 text-[15px] text-white hover:bg-[#0e5a6a] rounded-md"
          >
            <div className="flex items-center gap-3">
              <FiSettings />
              <span>Settings</span>
            </div>
            <span className="text-md">
              {settingsOpen ? <FiChevronDown /> : <FiChevronRight />}
            </span>
          </button>

          {settingsOpen && (
            <div className="relative flex flex-col mt-1 ml-6 gap-0">
              <TreeLines itemCount={settingsSubItems.length} />
              {settingsSubItems.map((item, i) => (
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
