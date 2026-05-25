// Color lerp utilities used internally by App.tsx
// This module provides helper types for visual color transition state.

export interface ColorLerpState {
  from: [number, number, number]
  to: [number, number, number]
  t: number
}

export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return [0, 0, 0]
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
}

export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0'))
      .join('')
  )
}

export function advanceLerp(
  state: ColorLerpState,
  speed = 0.008
): { newState: ColorLerpState; color: string } {
  const newT = Math.min(1, state.t + speed)
  const r = state.from[0] + (state.to[0] - state.from[0]) * newT
  const g = state.from[1] + (state.to[1] - state.from[1]) * newT
  const b = state.from[2] + (state.to[2] - state.from[2]) * newT
  return {
    newState: { ...state, t: newT },
    color: rgbToHex(r, g, b),
  }
}
