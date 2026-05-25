import { Preset } from '../types/audio'

interface TimerDisplayProps {
  isPlaying: boolean
  secondsRemaining: number | null
  preset: Preset
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function TimerDisplay({ isPlaying, secondsRemaining, preset }: TimerDisplayProps) {
  const opacity = isPlaying ? 0.85 : 0

  return (
    <div
      style={{
        position: 'fixed',
        top: '35%',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        zIndex: 10,
        opacity,
        transition: 'opacity 1s ease',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontWeight: 500,
          letterSpacing: '0.2em',
          color: 'rgba(255,255,255,0.6)',
          marginBottom: '8px',
          textTransform: 'uppercase',
        }}
      >
        {preset.name}
      </div>
      <div
        style={{
          fontSize: '72px',
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontWeight: 100,
          fontVariantNumeric: 'tabular-nums',
          color: 'rgba(255,255,255,0.85)',
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}
      >
        {secondsRemaining !== null ? formatTime(secondsRemaining) : '∞'}
      </div>
    </div>
  )
}
