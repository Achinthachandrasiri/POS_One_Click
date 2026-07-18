import { ipcMain } from 'electron'
import {
  handleCreateExpense,
  handleGetAllExpenses,
  handleGetExpenseById,
  handleUpdateExpense,
  handleDeleteExpense
} from '../../controllers/expensesController/expensesController'

export const registerExpenseIpc = () => {
  ipcMain.handle('expense:create', async (_, data) => {
    try {
      return await handleCreateExpense(data)
    } catch (err) {
      console.error('IPC expense:create error:', err)
      return { success: false, error: 'Failed to create expense' }
    }
  })

  ipcMain.handle('expense:getAll', async () => {
    try {
      return await handleGetAllExpenses()
    } catch (err) {
      console.error('IPC expense:getAll error:', err)
      return { success: false, error: 'Failed to fetch expenses' }
    }
  })

  ipcMain.handle('expense:getById', async (_, id) => {
    try {
      return await handleGetExpenseById({ id })
    } catch (err) {
      console.error('IPC expense:getById error:', err)
      return { success: false, error: 'Failed to fetch expense' }
    }
  })

  ipcMain.handle('expense:update', async (_, data) => {
    try {
      return await handleUpdateExpense(data)
    } catch (err) {
      console.error('IPC expense:update error:', err)
      return { success: false, error: 'Failed to update expense' }
    }
  })

  ipcMain.handle('expense:delete', async (_, data) => {
    try {
      return await handleDeleteExpense(data)
    } catch (err) {
      console.error('IPC expense:delete error:', err)
      return { success: false, error: 'Failed to delete expense' }
    }
  })
}
