import { describe, it, expect } from "vitest"
import { stepPhysics } from "../physics/engine"
import { computeInitialBonds } from "../physics/graph"
import { DEFAULT_PHYSICS_CONFIG } from "../physics/types"
import type { PhysicsBody } from "../types"

function createMockBodies(): PhysicsBody[] {
  return [
    {
      id: "a",
      x: -200,
      y: 0,
      px: -200,
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
      x: 200,
      y: 0,
      px: 200,
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

describe("Physics Engine", () => {
  it("executes numerical step and returns stability status", () => {
    const bodies = createMockBodies()
    const bonds = computeInitialBonds(bodies, DEFAULT_PHYSICS_CONFIG)

    const result = stepPhysics(bodies, bonds, DEFAULT_PHYSICS_CONFIG)
    expect(result).toHaveProperty("totalVelocity")
    expect(result).toHaveProperty("isStable")
  })

  it("forces overlapping bodies apart via AABB collision separation", () => {
    const bodies = createMockBodies()
    // Intentionally overlap body A and body B directly on top of each other
    bodies[0].x = 10
    bodies[0].px = 10
    bodies[1].x = 0
    bodies[1].px = 0

    const bonds = computeInitialBonds(bodies, DEFAULT_PHYSICS_CONFIG)
    stepPhysics(bodies, bonds, DEFAULT_PHYSICS_CONFIG)

    // Body A should be pushed to the right, Body B to the left
    expect(bodies[0].ax).toBeGreaterThan(0)
    expect(bodies[1].ax).toBeLessThan(0)
  })

  it("separates tall cards past their full height bounds", () => {
    const bodies: PhysicsBody[] = [
      {
        id: "c1",
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
        w: 340,
        h: 480, // Dynamic tall card
      },
      {
        id: "c2",
        x: 0,
        y: 200, // Vertically overlapping
        px: 0,
        py: 200,
        ax: 0,
        ay: 0,
        vx: 0,
        vy: 0,
        mass: 1,
        pinned: false,
        dragging: false,
        w: 340,
        h: 480,
      },
    ]

    const bonds = computeInitialBonds(bodies, DEFAULT_PHYSICS_CONFIG)
    const result = stepPhysics(bodies, bonds, DEFAULT_PHYSICS_CONFIG)

    // Because they overlap, isStable should be false (collision wake lock)
    expect(result.isStable).toBe(false)
    // Vertical positions should be projected apart
    expect(bodies[0].y).toBeLessThan(0)
    expect(bodies[1].y).toBeGreaterThan(200)
  })

  it("applies soft cluster tether when node exceeds perimeter", () => {
    const bodies = createMockBodies()
    bodies[0].x = -2500
    bodies[0].px = -2500

    const bonds = computeInitialBonds(bodies, DEFAULT_PHYSICS_CONFIG)
    stepPhysics(bodies, bonds, DEFAULT_PHYSICS_CONFIG)

    // Accelerations should pull node back toward the centroid (positive x direction)
    expect(bodies[0].ax).toBeGreaterThan(0)
  })

  it("settles into solid sleep state after repeated dampening", () => {
    const bodies = createMockBodies()
    const bonds = computeInitialBonds(bodies, DEFAULT_PHYSICS_CONFIG)

    // Run 100 simulation ticks
    let lastResult = { totalVelocity: 10, isStable: false }
    for (let i = 0; i < 100; i++) {
      lastResult = stepPhysics(bodies, bonds, DEFAULT_PHYSICS_CONFIG)
    }

    expect(lastResult.isStable).toBe(true)
  })
})
