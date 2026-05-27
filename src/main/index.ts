import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { exec } from 'child_process'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

// ── APP SETUP ─────────────────────────────────────────────────────────────────

let mainWindow: BrowserWindow | null = null
let forceQuit = false

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 16, y: 20 },
    backgroundColor: '#0A0A08',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: false,
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  // X button hides the window — audio keeps playing, re-open from Dock
  mainWindow.on('close', (event) => {
    if (!forceQuit && process.platform === 'darwin') {
      event.preventDefault()
      mainWindow!.webContents.send('stop-audio')
      mainWindow!.hide()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.bencarey.meridian')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // ── IPC handlers ────────────────────────────────────────────────────────
  ipcMain.on('hide-window', () => {
    mainWindow?.hide()
  })

  ipcMain.handle('get-next-meeting', async () => {
    return new Promise<{ title: string; secondsUntil: number } | null>((resolve) => {
      // Use bundled Objective-C EventKit helper — works with any calendar source
      // (Google Calendar via Notion Calendar, iCloud, Exchange, etc.)
      const helperPath = is.dev
        ? join(__dirname, '../../resources/meridian-cal')
        : join(process.resourcesPath, 'meridian-cal')

      const timer = setTimeout(() => resolve(null), 10000)

      exec(`"${helperPath}"`, (err, stdout) => {
        clearTimeout(timer)
        if (err || !stdout || stdout.trim() === 'none') { resolve(null); return }
        const raw = stdout.trim()
        const sep = raw.lastIndexOf('|')
        if (sep === -1) { resolve(null); return }
        const title = raw.slice(0, sep)
        const secs = parseInt(raw.slice(sep + 1), 10)
        if (!title || isNaN(secs) || secs <= 0) { resolve(null); return }
        resolve({ title, secondsUntil: secs })
      })
    })
  })

  createWindow()

  // Clicking the Dock icon shows the window
  app.on('activate', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show()
      mainWindow.focus()
    } else {
      createWindow()
    }
  })
})

app.on('before-quit', () => {
  forceQuit = true
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
