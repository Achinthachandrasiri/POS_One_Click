import { ipcMain } from 'electron'
import {
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService
} from '../../controllers/serviceController/serviceController'

export const registerServiceIpc = () => {
  ipcMain.handle('service:create', async (_, data) => {
    try {
      return await createService(data)
    } catch (err) {
      console.error('IPC service:create error:', err)
      return { success: false, error: 'Failed to create service' }
    }
  })

  ipcMain.handle('service:getAll', async (_, params) => {
    try {
      return await getServices(params)
    } catch (err) {
      console.error('IPC service:getAll error:', err)
      return { success: false, error: 'Failed to fetch services' }
    }
  })

  ipcMain.handle('service:getById', async (_, id) => {
    try {
      return await getServiceById(id)
    } catch (err) {
      console.error('IPC service:getById error:', err)
      return { success: false, error: 'Failed to fetch service' }
    }
  })

  ipcMain.handle('service:update', async (_, data) => {
    try {
      const { _id, ...rest } = data
      if (!_id) {
        return { success: false, error: 'Service id is required to update' }
      }
      return await updateService(_id, rest)
    } catch (err) {
      console.error('IPC service:update error:', err)
      return { success: false, error: 'Failed to update service' }
    }
  })

  ipcMain.handle('service:delete', async (_, id) => {
    try {
      return await deleteService(id)
    } catch (err) {
      console.error('IPC service:delete error:', err)
      return { success: false, error: 'Failed to delete service' }
    }
  })
}
