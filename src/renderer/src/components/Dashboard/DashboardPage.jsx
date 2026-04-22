const DashboardPage = () => {
  return (
    <>
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
    </>
  )
}

export default DashboardPage
