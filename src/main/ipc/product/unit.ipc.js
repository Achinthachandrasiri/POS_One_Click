import { ipcMain } from 'electron'
import {
  createUnit,
  getUnits,
  updateUnit,
  deleteUnit
} from '../../controllers/productsController/unitController'

export const registerUnitIpc = () => {
  ipcMain.handle('unit:create', async (_, data) => {
    try {
      return await createUnit(data)
    } catch (err) {
      console.error('IPC unit:create error:', err)
      return { success: false, error: 'Failed to create unit' }
    }
  })

  ipcMain.handle('unit:getAll', async () => {
    try {
      return await getUnits()
    } catch (err) {
      console.error('IPC unit:getAll error:', err)
      return { success: false, error: 'Failed to fetch units' }
    }
  })

  ipcMain.handle('unit:getById', async (_, id) => {
    try {
      return await getUnits({ id })
    } catch (err) {
      console.error('IPC unit:getById error:', err)
      return { success: false, error: 'Failed to fetch unit' }
    }
  })

  ipcMain.handle('unit:update', async (_, data) => {
    try {
      return await updateUnit(data)
    } catch (err) {
      console.error('IPC unit:update error:', err)
      return { success: false, error: 'Failed to update unit' }
    }
  })

  ipcMain.handle('unit:delete', async (_, id) => {
    try {
      return await deleteUnit({ id })
    } catch (err) {
      console.error('IPC unit:delete error:', err)
      return { success: false, error: 'Failed to delete unit' }
    }
  })
}
