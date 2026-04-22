import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/Layout/MainLayout'
import DashboardPage from './components/Dashboard/DashboardPage'
import CreateUserPage from './components/User/CreateUser'
import LoginPage from './components/Authentication/Login'
import ResetPassword from './components/Authentication/ResetPassword'

function App() {
  return (
    <Routes>
      {/* Login as the initial page */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/dashboard" element={<MainLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="create-user" element={<CreateUserPage />} />
      </Route>
    </Routes>
  )
}

export default App
