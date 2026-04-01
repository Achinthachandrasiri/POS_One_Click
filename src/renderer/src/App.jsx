import { Routes, Route } from 'react-router-dom'
import LoginPage from './components/Authentication/Login'
import ResetPassword from './components/Authentication/ResetPassword'
//import CreateUserPage from './components/User/CreateUser'

function App() {
 return(
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPassword />} />
    </Routes>
  )
}

export default App
