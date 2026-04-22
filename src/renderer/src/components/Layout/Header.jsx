const Header = ({ user }) => {
  return (
    <header className="flex items-center justify-between px-8 py-5 bg-[#ffffff0d] border-b border-[#ffffff18]">

      <div>
        <h1 className="text-white text-[20px] font-semibold m-0">Dashboard</h1>
        <p className="text-[#90bcc4] text-[13px] mt-1">
          Welcome back! Here's what's happening.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#1a6b7a] flex items-center justify-center text-white font-bold">
          {user?.username?.[0]?.toUpperCase() ?? 'U'}
        </div>
        <span className="text-[#cce6ea] text-[14px]">
          {user?.username ?? 'User'}
        </span>
      </div>

    </header>
  )
}

export default Header
