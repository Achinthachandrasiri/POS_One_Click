import { Routes, Route } from 'react-router-dom'
import MainLayout from './components/Layout/MainLayout'
import LoginPage from './components/Authentication/Login'
import ResetPassword from './components/Authentication/ResetPassword'
import DashboardPage from './components/Dashboard/DashboardPage'
import CreateUser from './components/User/CreateUser'
import ViewUser from './components/User/ViewUser'
import CreateCustomer from './components/Customer/CreateCustomer'
import EditCustomer from './components/Customer/EditCustomer'
import EditUser from './components/User/EditUser'
import ViewCustomer from './components/Customer/ViewCustomer'
import CreateSupplier from './components/Supplier/CreateSupplier'
import EditSupplier from './components/Supplier/EditSupplier'
import ViewSupplier from './components/Supplier/ViewSupplier'
import CreateStore from './components/Store/CreateStore'
import ViewStore from './components/Store/ViewStore'
import EditStore from './components/Store/EditStore'

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
        <Route path="users/edit/:id" element={<EditUser />} />
        <Route path="customers" element={<ViewCustomer />} />
        <Route path="customers/create" element={<CreateCustomer />} />
        <Route path="customers/edit/:id" element={<EditCustomer />} />
        <Route path="suppliers" element={<ViewSupplier />} />
        <Route path="suppliers/create" element={<CreateSupplier />} />
        <Route path="suppliers/edit/:id" element={<EditSupplier />} />
        <Route path="stores/create" element={<CreateStore />} />
        <Route path="stores" element={<ViewStore />} />
        <Route path="stores/edit/:id" element={<EditStore />} />
      </Route>
    </Routes>
  )
}

export default App
