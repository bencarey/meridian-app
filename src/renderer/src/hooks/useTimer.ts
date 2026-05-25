import { useState, useRef, useCallback, useEffect } from 'react'
import { DurationOption } from '../types/audio'

interface TimerState {
  secondsRemaining: number | null
  progress: number
  startTimer: (durationMinutes: DurationOption, onComplete?: () => void) => void
  startTimerSeconds: (seconds: number, onComplete?: () => void) => void
  resetTimer: () => void
}

export function useTimer(): TimerState {
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null)
  const [progress, setProgress] = useState(0)

  const endTimeRef = useRef<number | null>(null)
  const totalSecondsRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const onCompleteRef = useRef<(() => void) | undefined>(undefined)

  const tick = useCallback(() => {
    if (endTimeRef.current === null || totalSecondsRef.current === null) return

    const now = Date.now()
    const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000))
    const total = totalSecondsRef.current
    const prog = total > 0 ? (total - remaining) / total : 0

    setSecondsRemaining(remaining)
    setProgress(prog)

    if (remaining > 0) {
      rafRef.current = requestAnimationFrame(tick)
    } else {
      endTimeRef.current = null
      totalSecondsRef.current = null
      const cb = onCompleteRef.current
      onCompleteRef.current = undefined
      cb?.()
    }
  }, [])

  const startTimerSeconds = useCallback(
    (seconds: number, onComplete?: () => void) => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      onCompleteRef.current = onComplete
      const end = Date.now() + seconds * 1000
      endTimeRef.current = end
      totalSecondsRef.current = seconds
      setSecondsRemaining(seconds)
      setProgress(0)
      rafRef.current = requestAnimationFrame(tick)
    },
    [tick]
  )

  const startTimer = useCallback(
    (durationMinutes: DurationOption, onComplete?: () => void) => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }

      if (durationMinutes === null || durationMinutes === 'meeting') {
        onCompleteRef.current = undefined
        endTimeRef.current = null
        totalSecondsRef.current = null
        setSecondsRemaining(null)
        setProgress(0)
        return
      }

      startTimerSeconds(durationMinutes * 60, onComplete)
    },
    [startTimerSeconds]
  )

  const resetTimer = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    onCompleteRef.current = undefined
    endTimeRef.current = null
    totalSecondsRef.current = null
    setSecondsRemaining(null)
    setProgress(0)
  }, [])

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return { secondsRemaining, progress, startTimer, startTimerSeconds, resetTimer }
}
