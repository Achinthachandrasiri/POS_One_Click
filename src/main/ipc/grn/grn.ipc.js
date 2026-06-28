import { ipcMain } from 'electron'
import {
  handleCreateGRN,
  handleUpdateGRN,
  handleGetAllGRNs,
  handleGetGRNById,
  handleDeleteGRN
} from '../../controllers/grnController/grnController'

export const registerGRNIpc = () => {
  ipcMain.handle('grn:create', async (_, data) => {
    try {
      return await handleCreateGRN(data)
    } catch (err) {
      console.error('IPC grn:create error:', err)
      return { success: false, error: 'Failed to create GRN' }
    }
  })

  ipcMain.handle('grn:getAll', async () => {
    try {
      return await handleGetAllGRNs()
    } catch (err) {
      console.error('IPC grn:getAll error:', err)
      return { success: false, error: 'Failed to fetch GRNs' }
    }
  })

  ipcMain.handle('grn:getById', async (_, id) => {
    try {
      return await handleGetGRNById(id)
    } catch (err) {
      console.error('IPC grn:getById error:', err)
      return { success: false, error: 'Failed to fetch GRN' }
    }
  })

  ipcMain.handle('grn:delete', async (_, id) => {
    try {
      return await handleDeleteGRN(id)
    } catch (err) {
      console.error('IPC grn:delete error:', err)
      return { success: false, error: 'Failed to delete GRN' }
    }
  })

  ipcMain.handle('grn:update', async (_, id, data) => {
    try {
      return await handleUpdateGRN(id, data)
    } catch (err) {
      console.error('IPC grn:update error:', err)
      return { success: false, error: 'Failed to update GRN' }
    }
  })
}
