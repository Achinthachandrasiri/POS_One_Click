import { ipcMain } from 'electron'
import {
  handleCreateOffer,
  handleGetAllOffers,
  handleGetOfferById,
  handleUpdateOffer,
  handleDeleteOffer
} from '../../controllers/offerController/offerController'

export const registerOfferIpc = () => {
  ipcMain.handle('offer:create', async (_, data) => {
    try {
      return await handleCreateOffer(data)
    } catch (err) {
      console.error('IPC offer:create error:', err)
      return { success: false, error: 'Failed to create offer' }
    }
  })

  ipcMain.handle('offer:getAll', async (_, data) => {
    try {
      return await handleGetAllOffers(data)
    } catch (err) {
      console.error('IPC offer:getAll error:', err)
      return { success: false, error: 'Failed to fetch offers' }
    }
  })

  ipcMain.handle('offer:getById', async (_, id) => {
    try {
      return await handleGetOfferById({ id })
    } catch (err) {
      console.error('IPC offer:getById error:', err)
      return { success: false, error: 'Failed to fetch offer' }
    }
  })

  ipcMain.handle('offer:update', async (_, data) => {
    try {
      return await handleUpdateOffer(data)
    } catch (err) {
      console.error('IPC offer:update error:', err)
      return { success: false, error: 'Failed to update offer' }
    }
  })

  ipcMain.handle('offer:delete', async (_, id) => {
    try {
      return await handleDeleteOffer({ id })
    } catch (err) {
      console.error('IPC offer:delete error:', err)
      return { success: false, error: 'Failed to delete offer' }
    }
  })
}
