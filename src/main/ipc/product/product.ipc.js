import { ipcMain } from 'electron'
import {
  handleCreateProduct,
  handleGetAllProducts,
  handleGetProductById,
  handleUpdateProduct,
  handleDeleteProduct,
  handleUpdateProductStatus
} from '../../controllers/productsController/productController'

export const registerProductIpc = () => {
  ipcMain.handle('product:create', async (_, data) => {
    try {
      return await handleCreateProduct(data)
    } catch (err) {
      console.error('IPC product:create error:', err)
      return { success: false, error: 'Failed to create product' }
    }
  })

  ipcMain.handle('product:getAll', async () => {
    try {
      return await handleGetAllProducts()
    } catch (err) {
      console.error('IPC product:getAll error:', err)
      return { success: false, error: 'Failed to fetch products' }
    }
  })

  ipcMain.handle('product:getById', async (_, id) => {
    try {
      return await handleGetProductById(id)
    } catch (err) {
      console.error('IPC product:getById error:', err)
      return { success: false, error: 'Failed to fetch product' }
    }
  })

  ipcMain.handle('product:update', async (_, data) => {
    try {
      return await handleUpdateProduct(data)
    } catch (err) {
      console.error('IPC product:update error:', err)
      return { success: false, error: 'Failed to update product' }
    }
  })

  ipcMain.handle('product:delete', async (_, id) => {
    try {
      return await handleDeleteProduct(id)
    } catch (err) {
      console.error('IPC product:delete error:', err)
      return { success: false, error: 'Failed to delete product' }
    }
  })

  ipcMain.handle('product:updateStatus', async (_, data) => {
    try {
      return await handleUpdateProductStatus(data)
    } catch (err) {
      console.error('IPC product:updateStatus error:', err)
      return { success: false, error: 'Failed to update product status' }
    }
  })
}
