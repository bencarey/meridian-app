import { useState, useRef, useCallback, useEffect } from 'react'
import { DurationOption } from '../types/audio'

interface TimerState {
  secondsRemaining: number | null
  progress: number
  startTimer: (durationMinutes: DurationOption) => void
  resetTimer: () => void
}

export function useTimer(): TimerState {
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null)
  const [progress, setProgress] = useState(0)

  const endTimeRef = useRef<number | null>(null)
  const totalSecondsRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  const tick = useCallback(() => {
    if (endTimeRef.current === null || totalSecondsRef.current === null) return

    const now = Date.now()
    const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000))
    const total = totalSecondsRef.current
    const elapsed = total - remaining
    const prog = total > 0 ? elapsed / total : 0

    setSecondsRemaining(remaining)
    setProgress(prog)

    if (remaining > 0) {
      rafRef.current = requestAnimationFrame(tick)
    } else {
      endTimeRef.current = null
      totalSecondsRef.current = null
    }
  }, [])

  const startTimer = useCallback(
    (durationMinutes: DurationOption) => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }

      if (durationMinutes === null) {
        // Infinite session
        endTimeRef.current = null
        totalSecondsRef.current = null
        setSecondsRemaining(null)
        setProgress(0)
        return
      }

      const totalSeconds = durationMinutes * 60
      const end = Date.now() + totalSeconds * 1000
      endTimeRef.current = end
      totalSecondsRef.current = totalSeconds
      setSecondsRemaining(totalSeconds)
      setProgress(0)
      rafRef.current = requestAnimationFrame(tick)
    },
    [tick]
  )

  const resetTimer = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    endTimeRef.current = null
    totalSecondsRef.current = null
    setSecondsRemaining(null)
    setProgress(0)
  }, [])

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  return { secondsRemaining, progress, startTimer, resetTimer }
}
