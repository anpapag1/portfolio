import { describe, it, expect } from "vitest"
import {
  computeInitialBonds,
  latchNodeNeighbors,
  cleanObstructedBonds,
  bodyDist,
  mkBondId,
} from "../physics/graph"
import { DEFAULT_PHYSICS_CONFIG } from "../physics/types"
import type { PhysicsBody } from "../types"

function createMockBodies(): PhysicsBody[] {
  return [
    {
      id: "a",
      x: 0,
      y: 0,
      px: 0,
      py: 0,
      ax: 0,
      ay: 0,
      vx: 0,
      vy: 0,
      mass: 1,
      pinned: false,
      dragging: false,
      w: 300,
      h: 200,
    },
    {
      id: "b",
      x: 400,
      y: 0,
      px: 400,
      py: 0,
      ax: 0,
      ay: 0,
      vx: 0,
      vy: 0,
      mass: 1,
      pinned: false,
      dragging: false,
      w: 300,
      h: 200,
    },
    {
      id: "c",
      x: 800,
      y: 0,
      px: 800,
      py: 0,
      ax: 0,
      ay: 0,
      vx: 0,
      vy: 0,
      mass: 1,
      pinned: false,
      dragging: false,
      w: 300,
      h: 200,
    },
  ]
}

describe("Graph Topology Manager", () => {
  it("computes distance and canonical bond ids correctly", () => {
    const bodies = createMockBodies()
    expect(bodyDist(bodies[0], bodies[1])).toBe(400)
    expect(mkBondId("b", "a")).toBe("a||b")
    expect(mkBondId("a", "b")).toBe("a||b")
  })

  it("ensures initial graph connectivity with zero orphan nodes", () => {
    const bodies = createMockBodies()
    const bonds = computeInitialBonds(bodies, DEFAULT_PHYSICS_CONFIG)

    expect(bonds.length).toBeGreaterThanOrEqual(2)
    // Every body should have at least 1 bond
    for (const body of bodies) {
      const count = bonds.filter((b) => b.a === body.id || b.b === body.id).length
      expect(count).toBeGreaterThanOrEqual(1)
    }
  })

  it("latches closest neighbors and respects max bonds limit", () => {
    const bodies = createMockBodies()
    let bonds = computeInitialBonds(bodies, DEFAULT_PHYSICS_CONFIG)

    bonds = latchNodeNeighbors("a", bodies, bonds, DEFAULT_PHYSICS_CONFIG)
    const countA = bonds.filter((b) => b.a === "a" || b.b === "a").length
    expect(countA).toBeLessThanOrEqual(DEFAULT_PHYSICS_CONFIG.maxBonds)
    expect(countA).toBeGreaterThanOrEqual(1)
  })

  it("safely cleans obstructed bonds while maintaining connectivity", () => {
    const bodies = createMockBodies()
    let bonds = computeInitialBonds(bodies, DEFAULT_PHYSICS_CONFIG)

    const cleaned = cleanObstructedBonds(bodies, bonds, DEFAULT_PHYSICS_CONFIG)
    expect(cleaned.length).toBeGreaterThan(0)
    for (const body of bodies) {
      const count = cleaned.filter((b) => b.a === body.id || b.b === body.id).length
      expect(count).toBeGreaterThanOrEqual(1)
    }
  })
})
