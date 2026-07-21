import { Routes, Route } from 'react-router-dom'
import MainLayout from './components/Layout/MainLayout'
import LoginPage from './components/Authentication/Login'
import ResetPassword from './components/Authentication/ResetPassword'
import DashboardPage from './components/Dashboard/DashboardPage'
import useLicense from './hooks/useLicense'
import ActivationScreen from './license/ActivationScreen'
import LicenseCheckingScreen from './license/LicenseCheckingScreen'
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
import CreateBrand from './components/Brand/CreateBrand'
import ViewBrands from './components/Brand/ViewBrands'
import EditBrand from './components/Brand/EditBrand'
import CreateCategory from './components/Category/CreateCategory'
import ViewCategory from './components/Category/ViewCategory'
import EditCategory from './components/Category/EditCategory'
import ViewVariations from './components/Variation/ViewVariations'
import CreateVariation from './components/Variation/CreateVariation'
import EditVariation from './components/Variation/EditVariation'
import ViewUnits from './components/Unit/ViewUnits'
import CreateUnit from './components/Unit/CreateUnit'
import EditUnit from './components/Unit/EditUnit'
import ViewProduct from './components/Product/ViewProduct'
import CreateProduct from './components/Product/CreateProduct'
import EditProduct from './components/Product/EditProduct'
import CreateGRN from './components/grn/CreateGRN'
import EditGRN from './components/grn/EditGRN'
import ViewGRN from './components/grn/ViewGRN'
import CreateGRNReturn from './components/ReturnGRN/ReturnGRN'
import ViewReturnGRN from './components/ReturnGRN/ViewReturnGRN'
import CreateQuotation from './components/Quotation/CreateQuotation'
import ViewQuatation from './components/Quotation/ViewQuatation'
import EditQuotation from './components/Quotation/EditQuotation'
import GeneralSettings from './components/Settings/GeneralSettings'
import MailSettings from './components/Settings/MailSettings'
import CreateExpenses from './components/Expenses/CreateExpenses'
import ViewExpenses from './components/Expenses/ViewExpenses'
import EditExpenses from './components/Expenses/EditExpenses'
import CreateService from './components/Service/CreateService'
import EditService from './components/Service/EditService'
import ViewService from './components/Service/ViewService'
import CreateWarranty from './components/Warranty/CreateWarranty'
import EditWarranty from './components/Warranty/EditWarranty'
import ViewWarranty from './components/Warranty/ViewWarranty'

function App() {
  const { isLicensed, checkLicense } = useLicense()

  if (isLicensed === null) {
    return <LicenseCheckingScreen />
  }

  if (isLicensed === false) {
    return <ActivationScreen onActivated={checkLicense} />
  }
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
        <Route path="products/brands" element={<ViewBrands />} />
        <Route path="products/brands/create" element={<CreateBrand />} />
        <Route path="products/brands/edit/:id" element={<EditBrand />} />
        <Route path="products/categories" element={<ViewCategory />} />
        <Route path="products/categories/create" element={<CreateCategory />} />
        <Route path="products/categories/edit/:id" element={<EditCategory />} />
        <Route path="products/variations" element={<ViewVariations />} />
        <Route path="products/variations/create" element={<CreateVariation />} />
        <Route path="products/variations/edit/:id" element={<EditVariation />} />
        <Route path="products/units" element={<ViewUnits />} />
        <Route path="products/units/create" element={<CreateUnit />} />
        <Route path="products/units/edit/:id" element={<EditUnit />} />
        <Route path="products" element={<ViewProduct />} />
        <Route path="products/create" element={<CreateProduct />} />
        <Route path="products/edit/:id" element={<EditProduct />} />
        <Route path="grn" element={<ViewGRN />} />
        <Route path="grn/create" element={<CreateGRN />} />
        <Route path="grn/edit/:id" element={<EditGRN />} />
        <Route path="grn/return/:id" element={<CreateGRNReturn />} />
        <Route path="grn/return" element={<ViewReturnGRN />} />
        <Route path="quotation" element={<ViewQuatation />} />
        <Route path="quotation/create" element={<CreateQuotation />} />
        <Route path="quotation/edit/:id" element={<EditQuotation />} />
        <Route path="expenses" element={<ViewExpenses />} />
        <Route path="expenses/create" element={<CreateExpenses />} />
        <Route path="expenses/edit/:id" element={<EditExpenses />} />
        <Route path="services" element={<ViewService />} />
        <Route path="services/create" element={<CreateService />} />
        <Route path="services/edit/:id" element={<EditService />} />
        <Route path="settings/general" element={<GeneralSettings />} />
        <Route path="settings/mail" element={<MailSettings />} />
        <Route path="warranty" element={<ViewWarranty />} />
        <Route path="warranty/create" element={<CreateWarranty />} />
        <Route path="warranty/edit/:id" element={<EditWarranty />} />
      </Route>
    </Routes>
  )
}

export default App
