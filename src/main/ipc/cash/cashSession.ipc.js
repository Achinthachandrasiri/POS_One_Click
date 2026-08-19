import { ipcMain } from 'electron'
import {
  handleOpenSession,
  handleCloseSession,
  handleCheckActiveSession,
  handleGetActiveSessions,
  handleGetSessionById,
  handleGetAllSessions
} from '../../controllers/cashSessionController/cashSessionController'

export const registerCashSessionIpc = () => {
  ipcMain.handle('cashSession:open', async (_, data) => {
    try {
      return await handleOpenSession(data)
    } catch (err) {
      console.error('IPC cashSession:open error:', err)
      return { success: false, error: 'Failed to open cash session' }
    }
  })
  ipcMain.handle('cashSession:close', async (_, data) => {
    try {
      return await handleCloseSession(data)
    } catch (err) {
      console.error('IPC cashSession:close error:', err)
      return { success: false, error: 'Failed to close cash session' }
    }
  })
  ipcMain.handle('cashSession:checkActive', async (_, data) => {
    try {
      return await handleCheckActiveSession(data)
    } catch (err) {
      console.error('IPC cashSession:checkActive error:', err)
      return { success: false, error: 'Failed to check active session' }
    }
  })
  ipcMain.handle('cashSession:getActive', async (_, data) => {
    try {
      return await handleGetActiveSessions(data)
    } catch (err) {
      console.error('IPC cashSession:getActive error:', err)
      return { success: false, error: 'Failed to fetch active cash sessions' }
    }
  })
  ipcMain.handle('cashSession:getById', async (_, id) => {
    try {
      return await handleGetSessionById({ _id: id })
    } catch (err) {
      console.error('IPC cashSession:getById error:', err)
      return { success: false, error: 'Failed to fetch cash session' }
    }
  })
  ipcMain.handle('cashSession:getAll', async (_, data) => {
    try {
      return await handleGetAllSessions(data)
    } catch (err) {
      console.error('IPC cashSession:getAll error:', err)
      return { success: false, error: 'Failed to fetch cash sessions' }
    }
  })
}
