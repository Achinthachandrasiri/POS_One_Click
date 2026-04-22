import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/Layout/MainLayout'
import DashboardPage from './components/Dashboard/DashboardPage'
import CreateUserPage from './components/User/CreateUser'
import LoginPage from './components/Authentication/Login'
import ResetPassword from './components/Authentication/ResetPassword'
import DashboardPage from './components/Dashboard/DashboardPage'
import CreateCustomer from './components/Customer/CreateCustomer'
import EditCustomer from './components/Customer/EditCustomer'
import ViewCustomer from './components/Customer/ViewCustomer'
import CreateUserPage from './components/User/CreateUser'

function App() {
  return (
    <Routes>
      {/* Login as the initial page */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/customers/create" element={<CreateCustomer />} />
      <Route path="/customers/view" element={<ViewCustomer />} />
      <Route path="/customers/edit/:id" element={<EditCustomer />} />
      <Route path="/dashboard" element={<MainLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="create-user" element={<CreateUserPage />} />
      </Route>
    </Routes>
  )
}

export default App
