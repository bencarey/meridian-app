import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { exec } from 'child_process'
import { writeFileSync, unlinkSync } from 'fs'
import { tmpdir } from 'os'
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
      const script = `tell application "Calendar"
  set now to current date
  set cutoff to now + 28800
  set earliest to missing value
  set earliestSecs to 0
  set earliestTitle to ""
  repeat with c in (every calendar)
    try
      set evts to (every event of c whose start date >= now and start date < cutoff)
      repeat with e in evts
        set d to start date of e
        set s to (d - now) as integer
        if earliest is missing value or s < earliestSecs then
          set earliest to e
          set earliestSecs to s
          set earliestTitle to summary of e
        end if
      end repeat
    end try
  end repeat
  if earliest is missing value then
    return "none"
  end if
  return earliestTitle & "|" & (earliestSecs as text)
end tell`

      const scriptPath = join(tmpdir(), 'meridian-cal.scpt')
      try {
        writeFileSync(scriptPath, script, 'utf8')
      } catch {
        resolve(null)
        return
      }

      const timeout = setTimeout(() => {
        try { unlinkSync(scriptPath) } catch {}
        resolve(null)
      }, 6000)

      exec(`osascript "${scriptPath}"`, (err, stdout) => {
        clearTimeout(timeout)
        try { unlinkSync(scriptPath) } catch {}
        if (err || !stdout || stdout.trim() === 'none') {
          resolve(null)
          return
        }
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
