import { ipcMain } from 'electron'
import {
  createBrand,
  getBrands,
  updateBrand,
  deleteBrand
} from '../../controllers/productsController/brandController'

export const registerBrandIpc = () => {
  ipcMain.handle('brand:create', async (_, data) => {
    try {
      return await createBrand(data)
    } catch (err) {
      console.error('IPC brand:create error:', err)
      return { success: false, error: 'Failed to create brand' }
    }
  })

  ipcMain.handle('brand:getAll', async () => {
    try {
      return await getBrands()
    } catch (err) {
      console.error('IPC brand:getAll error:', err)
      return { success: false, error: 'Failed to fetch brands' }
    }
  })

  ipcMain.handle('brand:getById', async (_, id) => {
    try {
      return await getBrands({ id })
    } catch (err) {
      console.error('IPC brand:getById error:', err)
      return { success: false, error: 'Failed to fetch brand' }
    }
  })

  ipcMain.handle('brand:update', async (_, data) => {
    try {
      return await updateBrand(data)
    } catch (err) {
      console.error('IPC brand:update error:', err)
      return { success: false, error: 'Failed to update brand' }
    }
  })

  ipcMain.handle('brand:delete', async (_, id) => {
    try {
      return await deleteBrand({ id })
    } catch (err) {
      console.error('IPC brand:delete error:', err)
      return { success: false, error: 'Failed to delete brand' }
    }
  })
}
