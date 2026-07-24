import { ipcMain } from 'electron'
import {
  handleCreateRole,
  handleDeleteRole,
  handleGetAllRoles,
  handleUpdateRole
} from '../../controllers/roleController/roleController'

export const registerRoleIpc = () => {
  ipcMain.handle('role:getAll', async () => {
    try {
      return await handleGetAllRoles()
    } catch (err) {
      console.error('IPC role:getAll error:', err)
      return { success: false, error: 'Failed to fetch roles' }
    }
  })

  ipcMain.handle('role:create', async (_, data) => {
    try {
      return await handleCreateRole(data)
    } catch (err) {
      console.error('IPC role:create error:', err)
      return { success: false, error: 'Failed to create role' }
    }
  })

  ipcMain.handle('role:update', async (_, data) => {
    try {
      return await handleUpdateRole(data)
    } catch (err) {
      console.error('IPC role:update error:', err)
      return { success: false, error: 'Failed to update role' }
    }
  })

  ipcMain.handle('role:delete', async (_, id) => {
    try {
      return await handleDeleteRole(id)
    } catch (err) {
      console.error('IPC role:delete error:', err)
      return { success: false, error: 'Failed to delete role' }
    }
  })
}