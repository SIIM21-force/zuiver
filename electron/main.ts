import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import path from 'node:path'
import fs from 'node:fs'

const require = createRequire(import.meta.url)

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    backgroundColor: '#0a0a0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      webSecurity: false,
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // Show window when ready to avoid blank flash
  win.once('ready-to-show', () => {
    win?.show()
  })

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// ──── IPC Handlers ────────────────────────────────────────

// Open file picker for audio files
ipcMain.handle('dialog:openFiles', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Audio Files', extensions: ['mp3', 'wav', 'flac', 'ogg', 'aac', 'm4a'] }
    ],
  })
  return result.canceled ? [] : result.filePaths
})

// Open folder picker to load all audio files from a directory
ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  })
  if (result.canceled || result.filePaths.length === 0) return []

  const folderPath = result.filePaths[0]
  const audioExtensions = ['.mp3', '.wav', '.flac', '.ogg', '.aac', '.m4a']
  const files = fs.readdirSync(folderPath)
    .filter(f => audioExtensions.includes(path.extname(f).toLowerCase()))
    .map(f => path.join(folderPath, f))

  return files
})

// Read a file as buffer
ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
  const buffer = fs.readFileSync(filePath)
  return buffer
})

// Recognize song via Shazam (node-shazam handles fingerprinting + API)
ipcMain.handle('shazam:recognize', async (_event, filePath: string) => {
  try {
    const { Shazam } = require('node-shazam')
    const shazam = new Shazam()
    const result: any = await shazam.recognise(filePath, 'en-US')

    if (result && result.track) {
      return {
        found: true,
        title: result.track.title || null,
        artist: result.track.subtitle || null,
        album: result.track.sections
          ?.find((s: any) => s.type === 'SONG')
          ?.metadata?.find((m: any) => m.title === 'Album')?.text || null,
        artwork: result.track.images?.coverart || null,
        genre: result.track.genres?.primary || null,
      }
    }

    return { found: false }
  } catch (err: any) {
    return { found: false, error: err.message }
  }
})

// Parse audio metadata from file (done in main process where Node APIs work)
ipcMain.handle('metadata:parse', async (_event, filePath: string) => {
  try {
    const mm: any = await import('music-metadata')
    const metadata = await mm.parseFile(filePath, { duration: true })

    let artwork: string | undefined
    const pictures = metadata.common.picture
    if (pictures && pictures.length > 0) {
      const pic = pictures[0]
      try {
        // music-metadata may return 'image/jpeg' or just 'jpeg' — normalize it
        let mime = pic.format || 'image/jpeg'
        if (!mime.includes('/')) {
          mime = `image/${mime}`
        }

        if (pic.data && pic.data.length > 0) {
          const b64 = Buffer.from(pic.data).toString('base64')
          artwork = `data:${mime};base64,${b64}`
        }
      } catch (artErr) {
        console.warn(`[metadata] Failed to encode artwork for ${filePath}:`, artErr)
      }
    }

    return {
      title: metadata.common.title || '',
      artist: metadata.common.artist || '',
      album: metadata.common.album || '',
      duration: metadata.format.duration || 0,
      artwork,
    }
  } catch (err: any) {
    return {
      title: '',
      artist: '',
      album: '',
      duration: 0,
      error: err.message,
    }
  }
})

// Window controls (for custom titlebar)
ipcMain.handle('window:minimize', () => win?.minimize())
ipcMain.handle('window:maximize', () => {
  if (win?.isMaximized()) {
    win.unmaximize()
  } else {
    win?.maximize()
  }
})
ipcMain.handle('window:close', () => win?.close())
ipcMain.handle('window:isMaximized', () => win?.isMaximized())

// ──── App Lifecycle ───────────────────────────────────────

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
