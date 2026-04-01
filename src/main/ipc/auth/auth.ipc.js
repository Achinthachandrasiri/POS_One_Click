import { ipcMain } from 'electron'
import { handleLogin } from '../../controllers/authController/loginController'

export const registerAuthIpc = () => {
  ipcMain.handle('auth:login', async (_, data) => {
    return await handleLogin(data)
  })

  // ipcMain.handle('auth:logout', async (_, data) => {
  //   // handleLogout(data)
  // })
}
