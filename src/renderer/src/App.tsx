import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Visualizer } from './components/Visualizer'
import { ControlOverlay } from './components/ControlOverlay'
import { useAudioEngine } from './hooks/useAudioEngine'
import { useTimer } from './hooks/useTimer'
import { PRESETS, PresetId, DurationOption, Preset } from './types/audio'

function App(): React.JSX.Element {
  const [activePresetId, setActivePresetId] = useState<PresetId>('deep-focus')
  const [activeDuration, setActiveDuration] = useState<DurationOption>(25)
  const [volume, setVolumeState] = useState(0.7)
  const [controlsVisible, setControlsVisible] = useState(true)

  // Color state — managed here, passed to Visualizer
  const [bgColor, setBgColor] = useState(PRESETS['deep-focus'].bgColor)
  const [orbColor, setOrbColor] = useState(PRESETS['deep-focus'].orbColor)
  const [accentColor, setAccentColor] = useState(PRESETS['deep-focus'].accentColor)
  const [particleColor, setParticleColor] = useState(PRESETS['deep-focus'].particleColor)

  // Lerp state
  const lerpBgRef = useRef({
    from: [7, 9, 15] as [number, number, number],
    to: [7, 9, 15] as [number, number, number],
    t: 1,
  })
  const lerpOrbRef = useRef({
    from: [26, 35, 126] as [number, number, number],
    to: [26, 35, 126] as [number, number, number],
    t: 1,
  })

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const audio = useAudioEngine()
  const timer = useTimer()

  const activePreset: Preset = PRESETS[activePresetId]

  // Idle detection
  const resetIdleTimer = useCallback(() => {
    setControlsVisible(true)
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    idleTimerRef.current = setTimeout(() => {
      setControlsVisible(false)
    }, 3000)
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', resetIdleTimer)
    window.addEventListener('mousedown', resetIdleTimer)
    window.addEventListener('keydown', resetIdleTimer)
    resetIdleTimer()
    return () => {
      window.removeEventListener('mousemove', resetIdleTimer)
      window.removeEventListener('mousedown', resetIdleTimer)
      window.removeEventListener('keydown', resetIdleTimer)
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    }
  }, [resetIdleTimer])

  // Color lerp helpers
  function hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return [0, 0, 0]
    return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
  }

  function rgbToHex(r: number, g: number, b: number): string {
    return (
      '#' +
      [r, g, b]
        .map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0'))
        .join('')
    )
  }

  const startPresetTransition = useCallback(
    (preset: Preset) => {
      // Start bg lerp from current
      lerpBgRef.current = {
        from: hexToRgb(bgColor),
        to: hexToRgb(preset.bgColor),
        t: 0,
      }
      lerpOrbRef.current = {
        from: hexToRgb(orbColor),
        to: hexToRgb(preset.orbColor),
        t: 0,
      }
      setAccentColor(preset.accentColor)
      setParticleColor(preset.particleColor)
    },
    [bgColor, orbColor]
  )

  // Called each animation frame by Visualizer
  const onVisualizerTick = useCallback(() => {
    const bg = lerpBgRef.current
    if (bg.t < 1) {
      const newT = Math.min(1, bg.t + 0.008)
      lerpBgRef.current = { ...bg, t: newT }
      const r = bg.from[0] + (bg.to[0] - bg.from[0]) * newT
      const g = bg.from[1] + (bg.to[1] - bg.from[1]) * newT
      const b = bg.from[2] + (bg.to[2] - bg.from[2]) * newT
      setBgColor(rgbToHex(r, g, b))
    }

    const orb = lerpOrbRef.current
    if (orb.t < 1) {
      const newT = Math.min(1, orb.t + 0.008)
      lerpOrbRef.current = { ...orb, t: newT }
      const r = orb.from[0] + (orb.to[0] - orb.from[0]) * newT
      const g = orb.from[1] + (orb.to[1] - orb.from[1]) * newT
      const b = orb.from[2] + (orb.to[2] - orb.from[2]) * newT
      setOrbColor(rgbToHex(r, g, b))
    }
  }, [])

  const handlePresetChange = useCallback(
    (id: PresetId) => {
      const preset = PRESETS[id]
      setActivePresetId(id)
      startPresetTransition(preset)
      if (audio.isPlaying) {
        audio.stop()
        setTimeout(() => {
          audio.start(preset, volume)
        }, 200)
      }
    },
    [audio, volume, startPresetTransition]
  )

  const handleDurationChange = useCallback((d: DurationOption) => {
    setActiveDuration(d)
  }, [])

  const handleTogglePlay = useCallback(async () => {
    if (audio.isPlaying) {
      audio.stop()
      timer.resetTimer()
      window.api?.setPlaying(false)
    } else {
      await audio.start(activePreset, volume)
      timer.startTimer(activeDuration)
      window.api?.setPlaying(true)
    }
  }, [audio, timer, activePreset, volume, activeDuration])

  const handleVolumeChange = useCallback(
    (v: number) => {
      setVolumeState(v)
      audio.setVolume(v)
    },
    [audio]
  )

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        background: '#0a0a08',
      }}
    >
      {/* Full-screen canvas visualizer */}
      <Visualizer
        bgColor={bgColor}
        orbColor={orbColor}
        accentColor={accentColor}
        particleColor={particleColor}
        isPlaying={audio.isPlaying}
        geometrySpeed={activePreset.geometrySpeed ?? 1.0}
        onTick={onVisualizerTick}
      />

      {/* Header bar — draggable for macOS frameless window */}
      <div
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          height: '52px',
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '80px',
          paddingRight: '24px',
          WebkitAppRegion: 'drag',
        } as React.CSSProperties}
      >
        <span
          style={{
            fontSize: '11px',
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: 500,
            letterSpacing: '0.25em',
            color: 'rgba(255,255,255,0.65)',
            textTransform: 'uppercase',
            userSelect: 'none',
            WebkitAppRegion: 'no-drag',
          } as React.CSSProperties}
        >
          Meridian
        </span>
        <div style={{ flex: 1 }} />
        {audio.isPlaying && (
          <span
            style={{
              fontSize: '13px',
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontWeight: 200,
              letterSpacing: '0.05em',
              color: 'rgba(255,255,255,0.50)',
              fontVariantNumeric: 'tabular-nums',
              userSelect: 'none',
              WebkitAppRegion: 'no-drag',
            } as React.CSSProperties}
          >
            {timer.secondsRemaining !== null
              ? `${String(Math.floor(timer.secondsRemaining / 60)).padStart(2, '0')}:${String(timer.secondsRemaining % 60).padStart(2, '0')}`
              : '∞'}
          </span>
        )}
      </div>

      {/* Control overlay */}
      <ControlOverlay
        visible={controlsVisible}
        isPlaying={audio.isPlaying}
        activePreset={activePreset}
        activeDuration={activeDuration}
        volume={volume}
        secondsRemaining={timer.secondsRemaining}
        onPresetChange={handlePresetChange}
        onDurationChange={handleDurationChange}
        onTogglePlay={handleTogglePlay}
        onVolumeChange={handleVolumeChange}
      />
    </div>
  )
}

export default App
