import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const MainLayout = () => {
  return (
    <div className="fixed inset-0 flex bg-[#225166]">

      <Sidebar />

      <main className="flex-1 flex flex-col">
        <Header />

        <div className="p-6 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default MainLayout
