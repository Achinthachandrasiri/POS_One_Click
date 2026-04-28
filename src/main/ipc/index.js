import { registerAuthIpc } from './auth/auth.ipc'
import { registerUserIpc } from './user/user.ipc'
import { registerResetPasswordIpc } from './auth/resetPassword.ipc'
import { registerCustomerIpc } from './customer/customer.ipc'
import { registerSupplierIpc } from './supplier/supplier.ipc'

export const registerIpcHandlers = () => {
  registerAuthIpc()
  registerUserIpc()
  registerResetPasswordIpc()
  registerCustomerIpc()
  registerSupplierIpc()
}
