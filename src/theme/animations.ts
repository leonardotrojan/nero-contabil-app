export const springs = {
  gentle: {
    damping: 20,
    stiffness: 200,
    mass: 1,
  },
  snappy: {
    damping: 18,
    stiffness: 350,
    mass: 0.8,
  },
  bouncy: {
    damping: 12,
    stiffness: 200,
    mass: 1,
  },
  slow: {
    damping: 30,
    stiffness: 120,
    mass: 1,
  },
} as const;

export const durations = {
  instant: 80,
  fast: 150,
  normal: 250,
  slow: 400,
  slower: 600,
} as const;

export const easings = {
  easeOut: [0, 0, 0.3, 1] as [number, number, number, number],
  easeIn: [0.4, 0, 1, 1] as [number, number, number, number],
  easeInOut: [0.4, 0, 0.3, 1] as [number, number, number, number],
  spring: [0.175, 0.885, 0.32, 1.275] as [number, number, number, number],
} as const;
