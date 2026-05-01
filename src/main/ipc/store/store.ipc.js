import { ipcMain } from 'electron'
import {
  handleCreateStore,
  handleGetAllStores,
  handleGetStoreById,
  handleUpdateStore,
  handleDeleteStore
} from '../../controllers/storeController/storeController'

export const registerStoreIpc = () => {
  ipcMain.handle('store:create', async (_, data) => {
    try {
      return await handleCreateStore(data)
    } catch (err) {
      console.error('IPC store:create error:', err)
      return { success: false, error: 'Failed to create store' }
    }
  })

  ipcMain.handle('store:getAll', async () => {
    try {
      return await handleGetAllStores()
    } catch (err) {
      console.error('IPC store:getAll error:', err)
      return { success: false, error: 'Failed to fetch stores' }
    }
  })

  ipcMain.handle('store:getById', async (_, id) => {
    try {
      return await handleGetStoreById(id)
    } catch (err) {
      console.error('IPC store:getById error:', err)
      return { success: false, error: 'Failed to fetch store' }
    }
  })

  ipcMain.handle('store:update', async (_, data) => {
    try {
      return await handleUpdateStore(data)
    } catch (err) {
      console.error('IPC store:update error:', err)
      return { success: false, error: 'Failed to update store' }
    }
  })

  ipcMain.handle('store:delete', async (_, id) => {
    try {
      return await handleDeleteStore(id)
    } catch (err) {
      console.error('IPC store:delete error:', err)
      return { success: false, error: 'Failed to delete store' }
    }
  })
}
