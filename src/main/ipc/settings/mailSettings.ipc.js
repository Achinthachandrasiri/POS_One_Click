import { ipcMain } from 'electron'
import {
  handleGetMailSettings,
  handleSaveMailSettings
} from '../../controllers/settingsController/mailSettingsController'

export const registerMailSettingsIpc = () => {
  ipcMain.handle('settings:getMail', async () => {
    try {
      return await handleGetMailSettings()
    } catch (err) {
      console.error('IPC settings:getMail error:', err)
      return { success: false, error: 'Failed to fetch mail settings' }
    }
  })

  ipcMain.handle('settings:saveMail', async (_, data) => {
    try {
      return await handleSaveMailSettings(data)
    } catch (err) {
      console.error('IPC settings:saveMail error:', err)
      return { success: false, error: 'Failed to save mail settings' }
    }
  })
}