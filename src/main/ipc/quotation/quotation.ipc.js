import { ipcMain } from 'electron'
import {
  createQuotation as handleCreateQuotation,
  updateQuotation as handleUpdateQuotation,
  getQuotations as handleGetAllQuotations,
  getQuotationById as handleGetQuotationById,
  deleteQuotation as handleDeleteQuotation
} from '../../controllers/quotationController/quotationController'

export const registerQuotationIpc = () => {
  ipcMain.handle('quotation:create', async (_, data) => {
    try {
      return await handleCreateQuotation(data)
    } catch (err) {
      console.error('IPC quotation:create error:', err)
      return { success: false, error: 'Failed to create Quotation' }
    }
  })

  ipcMain.handle('quotation:getAll', async (_, filters) => {
    try {
      return await handleGetAllQuotations(filters)
    } catch (err) {
      console.error('IPC quotation:getAll error:', err)
      return { success: false, error: 'Failed to fetch Quotations' }
    }
  })

  ipcMain.handle('quotation:getById', async (_, id) => {
    try {
      return await handleGetQuotationById(id)
    } catch (err) {
      console.error('IPC quotation:getById error:', err)
      return { success: false, error: 'Failed to fetch Quotation' }
    }
  })

  ipcMain.handle('quotation:delete', async (_, id) => {
    try {
      return await handleDeleteQuotation(id)
    } catch (err) {
      console.error('IPC quotation:delete error:', err)
      return { success: false, error: 'Failed to delete Quotation' }
    }
  })

  ipcMain.handle('quotation:update', async (_, id, data) => {
    try {
      return await handleUpdateQuotation(id, data)
    } catch (err) {
      console.error('IPC quotation:update error:', err)
      return { success: false, error: 'Failed to update Quotation' }
    }
  })
}
