import { ipcMain } from 'electron'
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory
} from '../../controllers/productsController/categoryController'

export const registerCategoryIpc = () => {
  ipcMain.handle('category:create', async (_, data) => {
    try {
      return await createCategory(data)
    } catch (err) {
      console.error('IPC category:create error:', err)
      return { success: false, error: 'Failed to create category' }
    }
  })

  ipcMain.handle('category:getAll', async () => {
    try {
      return await getCategories()
    } catch (err) {
      console.error('IPC category:getAll error:', err)
      return { success: false, error: 'Failed to fetch categories' }
    }
  })

  ipcMain.handle('category:getById', async (_, id) => {
    try {
      return await getCategories({ id })
    } catch (err) {
      console.error('IPC category:getById error:', err)
      return { success: false, error: 'Failed to fetch category' }
    }
  })

  ipcMain.handle('category:update', async (_, data) => {
    try {
      return await updateCategory(data)
    } catch (err) {
      console.error('IPC category:update error:', err)
      return { success: false, error: 'Failed to update category' }
    }
  })

  ipcMain.handle('category:delete', async (_, id) => {
    try {
      return await deleteCategory({ id })
    } catch (err) {
      console.error('IPC category:delete error:', err)
      return { success: false, error: 'Failed to delete category' }
    }
  })
}
