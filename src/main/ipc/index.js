import { registerAuthIpc } from './auth/auth.ipc'
import { registerUserIpc } from './user/user.ipc'
import { registerResetPasswordIpc } from './auth/resetPassword.ipc'

export const registerIpcHandlers = () => {
  registerAuthIpc()
  registerUserIpc()
  registerResetPasswordIpc()
}
