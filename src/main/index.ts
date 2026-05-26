import { app, shell, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { exec } from 'child_process'
import { writeFileSync, unlinkSync } from 'fs'
import { tmpdir } from 'os'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

// ── TRAY ICON GENERATION ───────────────────────────────────────────────────────
// Uses inline SVG → base64 data URL → nativeImage. No native deps needed.

function makeTrayIcon(angle: number, playing: boolean): Electron.NativeImage {
  const S = 32 // @2x for Retina
  const cx = S / 2
  const cy = S / 2

  let svgContent: string

  if (!playing) {
    // Static: thin circle with center dot — the Meridian symbol at rest
    svgContent = `
      <circle cx="${cx}" cy="${cy}" r="11" fill="none" stroke="white" stroke-width="1.8"/>
      <circle cx="${cx}" cy="${cy}" r="2.5" fill="white"/>`
  } else {
    // Animated: two counter-rotating triangles (hexagram in motion)
    const r1 = 11
    const r2 = 6.5
    const pts1 = [0, 1, 2].map((i) => {
      const a = angle + (i / 3) * Math.PI * 2 - Math.PI / 2
      return `${(cx + r1 * Math.cos(a)).toFixed(2)},${(cy + r1 * Math.sin(a)).toFixed(2)}`
    }).join(' ')
    const pts2 = [0, 1, 2].map((i) => {
      const a = -angle * 0.65 + Math.PI / 6 + (i / 3) * Math.PI * 2 - Math.PI / 2
      return `${(cx + r2 * Math.cos(a)).toFixed(2)},${(cy + r2 * Math.sin(a)).toFixed(2)}`
    }).join(' ')

    svgContent = `
      <polygon points="${pts1}" fill="none" stroke="white" stroke-width="1.6"/>
      <polygon points="${pts2}" fill="none" stroke="white" stroke-width="1.2"/>
      <circle cx="${cx}" cy="${cy}" r="1.8" fill="white"/>`
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${svgContent}</svg>`
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
  const img = nativeImage.createFromDataURL(dataUrl)
  img.setTemplateImage(true) // adapts to light/dark menu bar automatically
  return img
}

// ── APP SETUP ─────────────────────────────────────────────────────────────────

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let trayAngle = 0
let trayAnimInterval: ReturnType<typeof setInterval> | null = null
let forceQuit = false

function startTrayAnimation(): void {
  if (trayAnimInterval || !tray) return
  trayAnimInterval = setInterval(() => {
    trayAngle += 0.055 // one full rotation ~6.5 seconds
    tray!.setImage(makeTrayIcon(trayAngle, true))
  }, 50) // 20 fps — smooth enough, not heavy
}

function stopTrayAnimation(): void {
  if (trayAnimInterval) {
    clearInterval(trayAnimInterval)
    trayAnimInterval = null
  }
  tray?.setImage(makeTrayIcon(0, false))
}

function buildTrayMenu(): Electron.Menu {
  return Menu.buildFromTemplate([
    {
      label: 'Show Meridian',
      click: () => {
        mainWindow?.show()
        mainWindow?.focus()
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        forceQuit = true
        app.quit()
      },
    },
  ])
}

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

  // Hide to tray instead of closing on macOS — stop audio first
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

function createTray(): void {
  tray = new Tray(makeTrayIcon(0, false))
  tray.setToolTip('Meridian')
  tray.setContextMenu(buildTrayMenu())

  // Left-click toggles the window
  tray.on('click', () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      createWindow()
      return
    }
    if (mainWindow.isVisible() && mainWindow.isFocused()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

app.whenReady().then(() => {
  // Meridian is a menu bar app — never show a Dock icon
  app.dock?.hide()

  electronApp.setAppUserModelId('com.bencarey.meridian')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // ── IPC handlers ────────────────────────────────────────────────────────
  ipcMain.on('set-playing', (_, isPlaying: boolean) => {
    if (isPlaying) startTrayAnimation()
    else stopTrayAnimation()
  })

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
  createTray()

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
