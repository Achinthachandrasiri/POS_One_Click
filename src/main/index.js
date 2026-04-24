import { app, BrowserWindow } from 'electron'
import path from 'path'
const { Menu } = require('electron')
import 'dotenv/config'
import { connectDB } from './database/dbConfig'
import { registerIpcHandlers } from './ipc'

console.log('App starting...')

function createWindow() {
  console.log('Creating window...')

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    fullscreen: false,
    webPreferences: {
      preload: path.join(import.meta.dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  //  REMOVE TOP MENU BAR
  Menu.setApplicationMenu(null)

  // Optional (extra safety)
  win.setMenuBarVisibility(false)
  win.webContents.openDevTools()

  win.maximize()

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(import.meta.dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  console.log('App ready')
  await connectDB()
  registerIpcHandlers()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
