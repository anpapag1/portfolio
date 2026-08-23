export interface PhysicsBody {
  id: string
  x: number
  y: number
  px: number
  py: number
  ax: number
  ay: number
  vx: number
  vy: number
  mass: number
  w: number
  h: number
  pinned: boolean
  dragging: boolean
}

export interface Bond {
  id: string
  a: string
  b: string
}

export interface PhysicsConfig {
  damping: number
  targetDist: number
  breakDist: number
  repulsion: number
  minDist: number
  springK: number
  centerPull: number
  neighborRadius: number
  maxBonds: number
  minBonds: number
  clusterTetherRadius: number
  clusterTetherK: number
  maxVelocity: number
  sleepVelocity: number
  sleepForce: number
}

export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  damping: 0.85,
  targetDist: 520,
  breakDist: 960,
  repulsion: 72000,
  minDist: 440,
  springK: 0.0016,
  centerPull: 0.00003,
  neighborRadius: 820,
  maxBonds: 3,
  minBonds: 1,
  clusterTetherRadius: 1400,
  clusterTetherK: 0.0005,
  maxVelocity: 16,
  sleepVelocity: 0.12,
  sleepForce: 0.18,
}
