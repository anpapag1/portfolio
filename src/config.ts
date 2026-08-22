/**
 * Centralized Configuration for Portfolio Canvas, Background Grid & Physics Simulation.
 * All tunable parameters for background grid, node latching, target equilibrium distances,
 * collision buffers, and spring dynamics are defined here.
 */

export interface GridConfig {
  /** Visual style of the background grid: 'dots', 'crosses', 'lines', or 'none' */
  style: 'dots' | 'crosses' | 'lines' | 'none';
  /** Distance between grid units (px) */
  spacing: number;
  /** Radius of dots or arm length of crosses (px) */
  dotRadius: number;
  /** Base RGB color components in 'r, g, b' format (default: '232, 232, 232') */
  color: string;
  /** Base opacity multiplier */
  opacity: number;
  /** Minimum opacity floor when zoomed far out */
  minOpacity: number;
  /** Maximum opacity ceiling when zoomed close in */
  maxOpacity: number;
  /** Whether dot radius or cross size scales with camera zoom */
  scaleWithZoom: boolean;
}

export const GRID_CONFIG: GridConfig = {
  style: 'dots',
  spacing: 48,
  dotRadius: 1,
  color: '232, 232, 232',
  opacity: 0.1,
  minOpacity: 0.04,
  maxOpacity: 0.2,
  scaleWithZoom: true,
};

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
