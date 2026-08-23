import { DEFAULT_PHYSICS_CONFIG, type PhysicsConfig } from "./physics/types"

export const SITE_CONFIG = {
  name: "Portfolio",
  author: "Constantin",
  title: "Creative Developer & System Architect",
  description: "Interactive graph-based physics canvas portfolio.",
  status: "Available for interesting projects",
}

export const VIEWPORT_CONFIG = {
  minZoom: 0.18,
  maxZoom: 3.5,
  zoomFactor: 1.22,
  lerpSpeed: 0.072,
  fitPadding: 48,
  interactiveZoomThreshold: 0.72,
}

export const MINIMAP_CONFIG = {
  width: 240,
  height: 110,
  minSpanX: 1600,
  minSpanY: 1100,
  padding: 24,
  nodeRadius: 3.5,
}

export const PHYSICS_CONFIG: PhysicsConfig = {
  ...DEFAULT_PHYSICS_CONFIG,
}
