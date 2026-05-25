import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  setPlaying: (isPlaying: boolean): void => { ipcRenderer.send('set-playing', isPlaying) },
  hideWindow: (): void => { ipcRenderer.send('hide-window') },
  onStopAudio: (cb: () => void): void => { ipcRenderer.on('stop-audio', cb) },
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
