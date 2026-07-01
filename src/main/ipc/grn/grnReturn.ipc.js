import { ipcMain } from 'electron'
import {
  handleCreateGRNReturn,
  handleGetAllGRNReturns,
  handleGetGRNReturnById,
  handleDeleteGRNReturn
} from '../../controllers/grnController/grnReturnController'

export const registerGRNReturnIpc = () => {
  ipcMain.handle('grnReturn:create', async (_, data) => {
    try {
      return await handleCreateGRNReturn(data)
    } catch (err) {
      console.error('IPC grnReturn:create error:', err)
      return { success: false, error: 'Failed to create GRN return' }
    }
  })

  ipcMain.handle('grnReturn:getAll', async () => {
    try {
      return await handleGetAllGRNReturns()
    } catch (err) {
      console.error('IPC grnReturn:getAll error:', err)
      return { success: false, error: 'Failed to fetch GRN returns' }
    }
  })

  ipcMain.handle('grnReturn:getById', async (_, id) => {
    try {
      return await handleGetGRNReturnById(id)
    } catch (err) {
      console.error('IPC grnReturn:getById error:', err)
      return { success: false, error: 'Failed to fetch GRN return' }
    }
  })

  ipcMain.handle('grnReturn:delete', async (_, id) => {
    try {
      return await handleDeleteGRNReturn(id)
    } catch (err) {
      console.error('IPC grnReturn:delete error:', err)
      return { success: false, error: 'Failed to delete GRN return' }
    }
  })
}
