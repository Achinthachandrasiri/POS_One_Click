import { ipcMain } from 'electron'
import { handleSendOtp, handleVerifyOtp, handleChangePassword } from '../../controllers/authController/resetPasswordController'

export const registerResetPasswordIpc = () => {
  ipcMain.handle('auth:sendOtp', async (_, data) => {
    return await handleSendOtp(data)
  })

  ipcMain.handle('auth:verifyOtp', async (_, data) => {
    return await handleVerifyOtp(data)
  })

  ipcMain.handle('auth:changePassword', async (_, data) => {
    return await handleChangePassword(data)
  })
}
