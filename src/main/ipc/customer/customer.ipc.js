import { ipcMain } from 'electron'
import {
  handleCreateCustomer,
  handleGetAllCustomers,
  handleGetCustomerById,
  handleUpdateCustomer,
  handleDeleteCustomer
} from '../../controllers/customerController/customerController'

export const registerCustomerIpc = () => {
  ipcMain.handle('customer:create', async (_, data) => {
    try {
      return await handleCreateCustomer(data)
    } catch (err) {
      console.error('IPC customer:create error:', err)
      return { success: false, error: 'Failed to create customer' }
    }
  })
  ipcMain.handle('customer:getAll', async () => {
    try {
      return await handleGetAllCustomers()
    } catch (err) {
      console.error('IPC customer:getAll error:', err)
      return { success: false, error: 'Failed to fetch customers' }
    }
  })
  ipcMain.handle('customer:getById', async (_, id) => {
    try {
      return await handleGetCustomerById(id)
    } catch (err) {
      console.error('IPC customer:getById error:', err)
      return { success: false, error: 'Failed to fetch customer' }
    }
  })
  ipcMain.handle('customer:update', async (_, data) => {
    try {
      return await handleUpdateCustomer(data)
    } catch (err) {
      console.error('IPC customer:update error:', err)
      return { success: false, error: 'Failed to update customer' }
    }
  })
  ipcMain.handle('customer:delete', async (_, id) => {
    try {
      return await handleDeleteCustomer(id)
    } catch (err) {
      console.error('IPC customer:delete error:', err)
      return { success: false, error: 'Failed to delete customer' }
    }
  })
}
