import { ipcMain } from 'electron'
import {
  handleCreateUser,
  handleGetAllUsers,
  handleGetUserById,
  handleUpdateUser,
  handleDeleteUser,
  handleUnlockUser
} from '../../controllers/userController/userController'

export const registerUserIpc = () => {
  ipcMain.handle('user:create', async (_, data) => await handleCreateUser(data))
  ipcMain.handle('user:getAll', async () => await handleGetAllUsers())
  ipcMain.handle('user:getById', async (_, id) => await handleGetUserById(id))
  ipcMain.handle('user:update', async (_, data) => await handleUpdateUser(data))
  ipcMain.handle('user:delete', async (_, id) => await handleDeleteUser(id))
  ipcMain.handle('user:unlock', async (_, id) => await handleUnlockUser(id))
}
