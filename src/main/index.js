import { app, BrowserWindow, protocol } from 'electron'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
const { Menu } = require('electron')
import 'dotenv/config'
import { connectDB } from './database/dbConfig'
import { registerIpcHandlers } from './ipc'

console.log('App starting...')

// ── Must be called BEFORE app.whenReady() ────────────────────────────────────
protocol.registerSchemesAsPrivileged([
  { scheme: 'safe-file', privileges: { secure: true, standard: true } }
])

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

  Menu.setApplicationMenu(null)
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

  // ── safe-file:// protocol handler ─────────────────────────────────────────
  protocol.handle('safe-file', async (request) => {
    console.log('[safe-file] incoming URL:', request.url)
    try {
      const fileUrl = request.url.replace('safe-file://', 'file://')
      console.log('[safe-file] converted to file URL:', fileUrl)
      const filePath = fileURLToPath(fileUrl)
      console.log('[safe-file] resolved file path:', filePath)

      const data = await fs.promises.readFile(filePath)
      return new Response(data, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'max-age=31536000, immutable'
        }
      })
    } catch (err) {
      console.error('[safe-file] Failed to load:', err)
      return new Response('Not found', { status: 404 })
    }
  })

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
