import { ipcMain } from 'electron'
import {
  handleGetGeneralSettings,
  handleSaveGeneralSettings
} from '../../controllers/settingsController/generalSettingsController'

export const registerGeneralSettingsIpc = () => {
  ipcMain.handle('settings:getGeneral', async () => {
    try {
      return await handleGetGeneralSettings()
    } catch (err) {
      console.error('IPC settings:getGeneral error:', err)
      return { success: false, error: 'Failed to fetch general settings' }
    }
  })

  ipcMain.handle('settings:saveGeneral', async (_, data) => {
    try {
      return await handleSaveGeneralSettings(data)
    } catch (err) {
      console.error('IPC settings:saveGeneral error:', err)
      return { success: false, error: 'Failed to save general settings' }
    }
  })
}