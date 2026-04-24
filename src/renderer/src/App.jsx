import { Routes, Route } from 'react-router-dom'
import MainLayout from './components/Layout/MainLayout'
import LoginPage from './components/Authentication/Login'
import ResetPassword from './components/Authentication/ResetPassword'
import DashboardPage from './components/Dashboard/DashboardPage'
import CreateUser from './components/User/CreateUser'
import ViewUser from './components/User/ViewUser'
import CreateCustomer from './components/Customer/CreateCustomer'
import EditCustomer from './components/Customer/EditCustomer'
import ViewCustomer from './components/Customer/ViewCustomer'

function App() {
  return (
    <Routes>
      {/* Auth routes (outside layout) */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* App layout routes */}
      <Route path="/dashboard" element={<MainLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="users/create" element={<CreateUser />} />
        <Route path="users" element={<ViewUser />} />
        <Route path="customers" element={<ViewCustomer />} />
        <Route path="customers/create" element={<CreateCustomer />} />
        <Route path="customers/edit/:id" element={<EditCustomer />} />
      </Route>
    </Routes>
  )
}

export default App
