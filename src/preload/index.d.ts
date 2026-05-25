import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      setPlaying: (isPlaying: boolean) => void
      hideWindow: () => void
      onStopAudio: (cb: () => void) => void
      getNextMeeting: () => Promise<{ title: string; secondsUntil: number } | null>
    }
  }
}
