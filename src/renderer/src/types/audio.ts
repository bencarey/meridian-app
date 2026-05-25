export type PresetId = 'deep-focus' | 'flow-state' | 'creative' | 'power' | 'build';
export type DurationOption = 25 | 45 | 60 | 90 | null;

export interface Preset {
  id: PresetId;
  name: string;
  label: string;
  description: string;
  binauralHz: number;
  carrierLeft: number;
  carrierRight: number;
  noiseType: 'brown' | 'pink' | 'white';
  droneHz?: number;
  scale: number[];     // frequencies in Hz
  rootNote: number;    // root note freq for sub-bass
  geometrySpeed?: number; // multiplier for visualizer rotation speed, default 1.0
  bgColor: string;
  orbColor: string;
  accentColor: string;
  particleColor: string;
}

export const PRESETS: Record<PresetId, Preset> = {
  'deep-focus': {
    id: 'deep-focus',
    name: 'DEEP FOCUS',
    label: 'DEEP',
    description: 'Theta waves for deep concentration',
    binauralHz: 6,
    carrierLeft: 200,
    carrierRight: 206,
    noiseType: 'brown',
    droneHz: 73.42, // D2
    scale: [146.83, 164.81, 185.00, 220.00, 246.94, 293.66, 329.63, 369.99],
    rootNote: 146.83,
    bgColor: '#07090F',
    orbColor: '#1A237E',
    accentColor: '#5C6BC0',
    particleColor: 'rgba(92,107,192,0.6)',
  },
  'flow-state': {
    id: 'flow-state',
    name: 'FLOW STATE',
    label: 'FLOW',
    description: 'Alpha waves for effortless flow',
    binauralHz: 10,
    carrierLeft: 200,
    carrierRight: 210,
    noiseType: 'pink',
    droneHz: 98.00, // G2
    scale: [196.00, 220.00, 246.94, 293.66, 329.63, 392.00, 440.00, 493.88],
    rootNote: 196.00,
    bgColor: '#071209',
    orbColor: '#1B5E20',
    accentColor: '#66BB6A',
    particleColor: 'rgba(102,187,106,0.5)',
  },
  'creative': {
    id: 'creative',
    name: 'CREATIVE',
    label: 'CREATE',
    description: 'Alpha-theta border for creative insight',
    binauralHz: 8,
    carrierLeft: 200,
    carrierRight: 208,
    noiseType: 'pink',
    droneHz: 110.00, // A2
    scale: [220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33],
    rootNote: 220.00,
    bgColor: '#0F0714',
    orbColor: '#4A148C',
    accentColor: '#AB47BC',
    particleColor: 'rgba(171,75,188,0.5)',
  },
  'power': {
    id: 'power',
    name: 'POWER',
    label: 'POWER',
    description: 'Beta waves for peak performance',
    binauralHz: 18,
    carrierLeft: 200,
    carrierRight: 218,
    noiseType: 'white',
    droneHz: 82.41, // E2
    scale: [164.81, 196.00, 220.00, 246.94, 293.66, 329.63, 392.00, 440.00],
    rootNote: 164.81,
    bgColor: '#0F0704',
    orbColor: '#BF360C',
    accentColor: '#FF7043',
    particleColor: 'rgba(255,112,67,0.5)',
  },
  'build': {
    id: 'build',
    name: 'BUILD',
    label: 'BUILD',
    description: 'Gamma waves for intense technical focus',
    binauralHz: 40,
    carrierLeft: 200,
    carrierRight: 240,
    noiseType: 'brown',
    droneHz: 65.41,  // C2 — deep, grounding
    scale: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25],
    rootNote: 130.81,
    geometrySpeed: 1.55,
    bgColor: '#06090E',
    orbColor: '#0A2038',
    accentColor: '#00B4D8',
    particleColor: 'rgba(0,180,216,0.5)',
  },
};

export const PRESET_ORDER: PresetId[] = ['deep-focus', 'flow-state', 'creative', 'power', 'build'];
