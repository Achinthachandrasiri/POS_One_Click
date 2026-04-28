import { ipcMain } from 'electron'
import {
  handleCreateSupplier,
  handleGetAllSuppliers,
  handleGetSupplierById,
  handleUpdateSupplier,
  handleDeleteSupplier
} from '../../controllers/supplierController/supplierController'

export const registerSupplierIpc = () => {
  ipcMain.handle('supplier:create', async (_, data) => {
    try {
      return await handleCreateSupplier(data)
    } catch (err) {
      console.error('IPC supplier:create error:', err)
      return { success: false, error: 'Failed to create supplier' }
    }
  })

  ipcMain.handle('supplier:getAll', async () => {
    try {
      return await handleGetAllSuppliers()
    } catch (err) {
      console.error('IPC supplier:getAll error:', err)
      return { success: false, error: 'Failed to fetch suppliers' }
    }
  })

  ipcMain.handle('supplier:getById', async (_, id) => {
    try {
      return await handleGetSupplierById(id)
    } catch (err) {
      console.error('IPC supplier:getById error:', err)
      return { success: false, error: 'Failed to fetch supplier' }
    }
  })

  ipcMain.handle('supplier:update', async (_, data) => {
    try {
      return await handleUpdateSupplier(data)
    } catch (err) {
      console.error('IPC supplier:update error:', err)
      return { success: false, error: 'Failed to update supplier' }
    }
  })

  ipcMain.handle('supplier:delete', async (_, id) => {
    try {
      return await handleDeleteSupplier(id)
    } catch (err) {
      console.error('IPC supplier:delete error:', err)
      return { success: false, error: 'Failed to delete supplier' }
    }
  })
}