import { DEFAULT_PHYSICS_CONFIG, type PhysicsConfig } from "./physics/types"

export const SITE_CONFIG = {
  name: "Antonis Papageorgiou · Portfolio",
  author: "Antonis Papageorgiou",
  title: "CS Student & Developer",
  description: "Interactive graph-based physics canvas portfolio.",
  status: "CS @ DUTH · Dev @ Crowdpolicy",
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
  padding: 20,
  nodeRadius: 4.5,
}

export const PHYSICS_CONFIG: PhysicsConfig = {
  ...DEFAULT_PHYSICS_CONFIG,
}
