/**
 * Centralized Configuration for Portfolio Canvas & Physics Simulation.
 * All tunable parameters for node latching, target equilibrium distances,
 * collision buffers, and spring dynamics are defined here.
 */

export interface PhysicsConfig {
  /** Target center-to-center equilibrium distance between connected terminal cards (px) */
  desirableDistance: number;
  /** Minimum collision clearance buffer to prevent visual box overlap (px) */
  minSeparation: number;
  /** Restorative spring stiffness pulling connected nodes to desirableDistance */
  springStrength: number;
  /** Anti-overlap repulsion force constant */
  repulsionStrength: number;
  /** Weak gravitational center attraction to keep constellation roughly centered */
  centerAttraction: number;
  /** Velocity damping coefficient per frame (0-1) */
  damping: number;
  /** Maximum number of persistent bonds any individual node can hold */
  maxConnectionsPerNode: number;
  /** Separation distance at which an actively dragged node breaks its connection (px) */
  disconnectDragDistance: number;
  /** Maximum search radius to discover and latch onto a new neighbor (px) */
  latchSearchRadius: number;
}

export const PHYSICS_CONFIG: PhysicsConfig = {
  desirableDistance: 580,
  minSeparation: 520,
  springStrength: 0.04,
  repulsionStrength: 300000,
  centerAttraction: 0.00004,
  damping: 0.92,
  maxConnectionsPerNode: 2,
  disconnectDragDistance: 1050,
  latchSearchRadius: 1500,
};
