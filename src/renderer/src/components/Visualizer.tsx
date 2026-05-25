import { useRef, useEffect } from 'react'

const PHI = 1.618033988749895

interface Particle {
  x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number
}

interface VisualizerProps {
  bgColor: string
  orbColor: string
  accentColor: string
  particleColor: string
  isPlaying: boolean
  geometrySpeed?: number
  onTick?: () => void
}

function hexToRgb(hex: string): [number, number, number] {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!r) return [0, 0, 0]
  return [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)]
}

function rgba(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r},${g},${b},${Math.max(0, a)})`
}

// Smooth ease-in for element reveal
function easeIn(t: number): number {
  const c = Math.max(0, Math.min(1, t))
  return c * c
}

function elementAlpha(bp: number, threshold: number, span = 0.12): number {
  return easeIn((bp - threshold) / span)
}

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  n: number, radius: number, rotation: number
): void {
  ctx.beginPath()
  for (let i = 0; i <= n; i++) {
    const angle = (i / n) * Math.PI * 2 + rotation
    const x = cx + radius * Math.cos(angle)
    const y = cy + radius * Math.sin(angle)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
}

// Flower of Life — reveal circles one by one as revealFraction goes 0→1
function drawFlowerOfLife(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  r: number, rotation: number,
  color: string, alpha: number, revealFraction: number
): void {
  if (alpha <= 0.005) return
  ctx.strokeStyle = rgba(color, alpha)
  ctx.lineWidth = 0.6
  ctx.setLineDash([])

  const total = 7
  const count = Math.min(total, Math.floor(revealFraction * total) + 1)
  const partial = (revealFraction * total) % 1

  for (let i = 0; i < count; i++) {
    let arcEnd = Math.PI * 2
    if (i === count - 1 && revealFraction < 1) arcEnd = partial * Math.PI * 2

    if (i === 0) {
      ctx.beginPath()
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + arcEnd)
      ctx.stroke()
    } else {
      const angle = ((i - 1) / 6) * Math.PI * 2 + rotation
      const ox = cx + r * Math.cos(angle)
      const oy = cy + r * Math.sin(angle)
      ctx.beginPath()
      ctx.arc(ox, oy, r, -Math.PI / 2, -Math.PI / 2 + arcEnd)
      ctx.stroke()
    }
  }
}

// Metatron's Cube — progressively reveal lines between all 13 circle centers
function drawMetatronLines(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  r: number, rotation: number,
  color: string, alpha: number, revealFraction: number
): void {
  if (alpha <= 0.005) return

  const nodes: [number, number][] = [[cx, cy]]
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + rotation
    nodes.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)])
  }
  // Outer ring at 2r, offset by 30°
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + rotation + Math.PI / 6
    nodes.push([cx + r * 1.95 * Math.cos(angle), cy + r * 1.95 * Math.sin(angle)])
  }

  // Build all pairs
  const pairs: [[number, number], [number, number]][] = []
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      pairs.push([nodes[i], nodes[j]])
    }
  }

  const linesToDraw = Math.floor(revealFraction * pairs.length)
  ctx.strokeStyle = rgba(color, alpha)
  ctx.lineWidth = 0.4
  ctx.setLineDash([])

  for (let k = 0; k < linesToDraw; k++) {
    const [a, b] = pairs[k]
    ctx.beginPath()
    ctx.moveTo(a[0], a[1])
    ctx.lineTo(b[0], b[1])
    ctx.stroke()
  }
}

export function Visualizer({
  bgColor, orbColor, accentColor, particleColor, isPlaying, geometrySpeed = 1.0, onTick
}: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timeRef = useRef(0)
  const buildProgressRef = useRef(0)
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number | null>(null)

  // Live refs so animation loop always reads current props
  const bgColorRef = useRef(bgColor)
  const orbColorRef = useRef(orbColor)
  const accentColorRef = useRef(accentColor)
  const particleColorRef = useRef(particleColor)
  const isPlayingRef = useRef(isPlaying)
  const geometrySpeedRef = useRef(geometrySpeed)
  const onTickRef = useRef(onTick)

  bgColorRef.current = bgColor
  orbColorRef.current = orbColor
  accentColorRef.current = accentColor
  particleColorRef.current = particleColor
  isPlayingRef.current = isPlaying
  geometrySpeedRef.current = geometrySpeed
  onTickRef.current = onTick

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleResize = (): void => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      // Init / reinit particles
      const count = 35 + Math.floor(Math.random() * 20)
      particlesRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -(0.15 + Math.random() * 0.4),
        life: Math.random() * 200,
        maxLife: 120 + Math.random() * 160,
        size: 1 + Math.random() * 2,
      }))
    }
    handleResize()
    window.addEventListener('resize', handleResize)

    const animate = (): void => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      timeRef.current += 0.016
      const t = timeRef.current
      const playing = isPlayingRef.current

      // Build progress: grows to 1 over ~18s when playing, decays over 4s when stopped
      const bpSpeed = playing ? 1 / 1080 : -1 / 240
      buildProgressRef.current = Math.max(0, Math.min(1, buildProgressRef.current + bpSpeed))
      const bp = buildProgressRef.current

      const bg = bgColorRef.current
      const orb = orbColorRef.current
      const accent = accentColorRef.current
      const pColor = particleColorRef.current

      const W = canvas.width
      const H = canvas.height
      const cx = W / 2
      const cy = H / 2
      const base = Math.min(W, H) * 0.36
      const spd = geometrySpeedRef.current

      // Gentle breathe when playing
      const breathe = 1 + (playing ? 0.022 * Math.sin(t * 0.65) : 0)
      const B = base * breathe

      // Flower of Life radius (smaller, inner)
      const folR = base * 0.22

      // ── BACKGROUND ──────────────────────────────────────────────────────
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      // Ambient glow — always present, deepens when playing
      const glowAlpha = 0.12 + (playing ? 0.18 : 0) * bp
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, base * 2.2)
      glow.addColorStop(0, rgba(orb, glowAlpha * 0.55))
      glow.addColorStop(0.45, rgba(orb, glowAlpha * 0.18))
      glow.addColorStop(1, rgba(orb, 0))
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, W, H)

      // ── PARTICLES ───────────────────────────────────────────────────────
      particlesRef.current = particlesRef.current.map((p) => {
        p.life -= 1
        if (p.life <= 0) {
          return {
            x: Math.random() * W,
            y: H * 0.55 + Math.random() * H * 0.45,
            vx: (Math.random() - 0.5) * 0.25,
            vy: -(0.15 + Math.random() * 0.4),
            life: p.maxLife,
            maxLife: p.maxLife,
            size: 1 + Math.random() * 2,
          }
        }
        return { ...p, x: p.x + p.vx + (Math.random() - 0.5) * 0.08, y: p.y + p.vy, vx: p.vx * 0.99 }
      })
      for (const p of particlesRef.current) {
        const a = Math.sin((p.life / p.maxLife) * Math.PI) * 0.5
        const pStr = pColor.startsWith('rgba') ? pColor.replace(/[\d.]+\)$/, `${a.toFixed(3)})`) : rgba(pColor, a)
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = pStr
        ctx.fill()
      }

      // ── METATRON'S CUBE ─────────────────────────────────────────────────
      const metA = elementAlpha(bp, 0.20, 0.18) * 0.07
      const metReveal = Math.max(0, Math.min(1, (bp - 0.22) / 0.20))
      if (metA > 0.003) {
        drawMetatronLines(ctx, cx, cy, folR, t * 0.012 * spd, '#ffffff', metA, metReveal)
      }

      // ── FLOWER OF LIFE ──────────────────────────────────────────────────
      const folA = elementAlpha(bp, 0.08, 0.14) * 0.18
      const folReveal = Math.max(0, Math.min(1, (bp - 0.08) / 0.16))
      if (folA > 0.003) {
        drawFlowerOfLife(ctx, cx, cy, folR, t * 0.012 * spd, orb, folA, folReveal)
      }

      // ── GOLDEN RATIO RINGS ──────────────────────────────────────────────
      const ringA = elementAlpha(bp, 0.38, 0.14)
      if (ringA > 0.01) {
        ctx.shadowBlur = 10
        ctx.shadowColor = rgba(accent, ringA * 0.35)
        ;[B, B / PHI, B / (PHI * PHI), B / (PHI * PHI * PHI)].forEach((r, i) => {
          const a = ringA * (1 - i * 0.18) * 0.38
          if (a < 0.008) return
          ctx.strokeStyle = rgba(accent, a)
          ctx.lineWidth = 0.7 + (i === 0 ? 0.3 : 0)
          ctx.setLineDash([])
          ctx.beginPath()
          ctx.arc(cx, cy, r, 0, Math.PI * 2)
          ctx.stroke()
        })
        ctx.shadowBlur = 0
      }

      ctx.setLineDash([])

      // ── 12-GON (outermost polygon) ──────────────────────────────────────
      const d12A = elementAlpha(bp, 0.44, 0.13)
      if (d12A > 0.01) {
        ctx.shadowBlur = 8
        ctx.shadowColor = rgba(accent, d12A * 0.25)
        ctx.strokeStyle = rgba(accent, d12A * 0.30)
        ctx.lineWidth = 0.8
        drawPolygon(ctx, cx, cy, 12, B, t * 0.007 * spd)
        ctx.stroke()
        ctx.shadowBlur = 0
      }

      // ── HEXAGRAM (Star of David — two interlocked triangles) ────────────
      const hexA = elementAlpha(bp, 0.52, 0.14)
      if (hexA > 0.01) {
        ctx.shadowBlur = 14
        ctx.shadowColor = rgba(accent, hexA * 0.5)
        ctx.strokeStyle = rgba(accent, hexA * 0.55)
        ctx.lineWidth = 1.1
        drawPolygon(ctx, cx, cy, 3, B * 0.70, t * 0.014 * spd)
        ctx.stroke()
        drawPolygon(ctx, cx, cy, 3, B * 0.70, -t * 0.011 * spd + Math.PI / 3)
        ctx.stroke()
        ctx.shadowBlur = 0
      }

      // ── PENTAGON ────────────────────────────────────────────────────────
      const pentA = elementAlpha(bp, 0.60, 0.12)
      if (pentA > 0.01) {
        ctx.shadowBlur = 10
        ctx.shadowColor = rgba(accent, pentA * 0.35)
        ctx.strokeStyle = rgba(accent, pentA * 0.42)
        ctx.lineWidth = 0.9
        drawPolygon(ctx, cx, cy, 5, B * 0.53, -t * 0.020 * spd)
        ctx.stroke()
        ctx.shadowBlur = 0
      }

      // ── OCTAGON ─────────────────────────────────────────────────────────
      const octA = elementAlpha(bp, 0.66, 0.12)
      if (octA > 0.01) {
        ctx.shadowBlur = 8
        ctx.shadowColor = rgba(accent, octA * 0.25)
        ctx.strokeStyle = rgba(accent, octA * 0.33)
        ctx.lineWidth = 0.8
        drawPolygon(ctx, cx, cy, 8, B * 0.40, t * 0.017 * spd)
        ctx.stroke()
        ctx.shadowBlur = 0
      }

      // ── INNER TRIANGLE (brightest, most prominent) ───────────────────────
      const triA = elementAlpha(bp, 0.73, 0.13)
      if (triA > 0.01) {
        ctx.shadowBlur = 18
        ctx.shadowColor = rgba(accent, triA * 0.7)
        ctx.strokeStyle = rgba(accent, triA * 0.75)
        ctx.lineWidth = 1.4
        drawPolygon(ctx, cx, cy, 3, B * 0.26, t * 0.028 * spd)
        ctx.stroke()
        ctx.shadowBlur = 0
      }

      // ── CENTER GEOMETRY CROSS-LINES ─────────────────────────────────────
      const crossA = elementAlpha(bp, 0.80, 0.12) * 0.28
      if (crossA > 0.005) {
        ctx.strokeStyle = rgba(accent, crossA)
        ctx.lineWidth = 0.5
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2 + t * 0.006 * spd
          ctx.beginPath()
          ctx.moveTo(cx, cy)
          ctx.lineTo(cx + B * 0.92 * Math.cos(angle), cy + B * 0.92 * Math.sin(angle))
          ctx.stroke()
        }
      }

      // ── CENTER DOT ──────────────────────────────────────────────────────
      const dotA = elementAlpha(bp, 0.86, 0.12)
      if (dotA > 0.01) {
        const pulse = 1 + 0.4 * Math.sin(t * 1.8) * dotA
        ctx.shadowBlur = 22 * dotA
        ctx.shadowColor = rgba(accent, 0.9)
        ctx.fillStyle = rgba(accent, dotA * 0.95)
        ctx.beginPath()
        ctx.arc(cx, cy, 3.5 * pulse, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }

      onTickRef.current?.()
      rafRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', handleResize)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, []) // stable — all props accessed via refs

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, display: 'block', width: '100vw', height: '100vh' }}
    />
  )
}
