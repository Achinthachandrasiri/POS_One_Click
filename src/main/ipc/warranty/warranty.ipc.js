import { ipcMain } from 'electron'
import {
  handleCreateWarrantyType,
  handleGetAllWarrantyTypes,
  handleGetWarrantyTypeById,
  handleUpdateWarrantyType,
  handleDeleteWarrantyType
} from '../../controllers/warrantyController/warrantyController'

export const registerWarrantyTypeIpc = () => {
  ipcMain.handle('warrantyType:create', async (_, data) => {
    try {
      return await handleCreateWarrantyType(data)
    } catch (err) {
      console.error('IPC warrantyType:create error:', err)
      return { success: false, error: 'Failed to create warranty type' }
    }
  })

  ipcMain.handle('warrantyType:getAll', async () => {
    try {
      return await handleGetAllWarrantyTypes()
    } catch (err) {
      console.error('IPC warrantyType:getAll error:', err)
      return { success: false, error: 'Failed to fetch warranty types' }
    }
  })

  ipcMain.handle('warrantyType:getById', async (_, id) => {
    try {
      return await handleGetWarrantyTypeById({ id })
    } catch (err) {
      console.error('IPC warrantyType:getById error:', err)
      return { success: false, error: 'Failed to fetch warranty type' }
    }
  })

  ipcMain.handle('warrantyType:update', async (_, data) => {
    try {
      return await handleUpdateWarrantyType(data)
    } catch (err) {
      console.error('IPC warrantyType:update error:', err)
      return { success: false, error: 'Failed to update warranty type' }
    }
  })

  ipcMain.handle('warrantyType:delete', async (_, data) => {
    try {
      return await handleDeleteWarrantyType(data)
    } catch (err) {
      console.error('IPC warrantyType:delete error:', err)
      return { success: false, error: 'Failed to delete warranty type' }
    }
  })
}
