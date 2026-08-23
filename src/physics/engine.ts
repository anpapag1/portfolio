import type { PhysicsBody, Bond, PhysicsConfig } from "./types"
import { mkBondId } from "./graph"

export interface PhysicsStepResult {
  totalVelocity: number
  isStable: boolean
}

/**
 * Executes a single numerical physics integration step with hard AABB collision projection,
 * real dynamic dimension support, edge-to-edge repulsion, and cluster boundary tethering.
 */
export function stepPhysics(
  bodies: PhysicsBody[],
  bonds: Bond[],
  config: PhysicsConfig,
): PhysicsStepResult {
  // 1. Reset accelerations
  for (const b of bodies) {
    b.ax = 0
    b.ay = 0
  }

  // Pre-calculate connected pairs & bond counts
  const connectedSet = new Set<string>()
  const bondCounts: Record<string, number> = {}
  for (const b of bodies) {
    bondCounts[b.id] = 0
  }
  for (const bond of bonds) {
    connectedSet.add(mkBondId(bond.a, bond.b))
    bondCounts[bond.a] = (bondCounts[bond.a] || 0) + 1
    bondCounts[bond.b] = (bondCounts[bond.b] || 0) + 1
  }

  // 2. Spring forces for directly connected nodes (Hooke's Law)
  for (const bond of bonds) {
    const a = bodies.find((b) => b.id === bond.a)
    const bBody = bodies.find((b) => b.id === bond.b)
    if (!a || !bBody) continue

    const dx = bBody.x - a.x
    const dy = bBody.y - a.y
    const d = Math.sqrt(dx * dx + dy * dy) || 0.001
    const f = config.springK * (d - config.targetDist)
    const fx = (dx / d) * f
    const fy = (dy / d) * f

    if (!a.pinned && !a.dragging) {
      a.ax += fx
      a.ay += fy
    }
    if (!bBody.pinned && !bBody.dragging) {
      bBody.ax -= fx
      bBody.ay -= fy
    }
  }

  // 3. Pairwise Repulsion (Non-connected nodes & clearance)
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i]
      const b = bodies[j]
      const isConnected = connectedSet.has(mkBondId(a.id, b.id))
      const dx = b.x - a.x
      const dy = b.y - a.y
      const d = Math.sqrt(dx * dx + dy * dy) || 0.1

      if (!isConnected) {
        const aFull = (bondCounts[a.id] || 0) >= config.maxBonds
        const bFull = (bondCounts[b.id] || 0) >= config.maxBonds
        const handsFull = aFull || bFull
        const maxRange = handsFull ? 920 : 800
        const repulsionPower = handsFull
          ? config.repulsion * 1.5
          : config.repulsion

        if (d < maxRange) {
          const effective = Math.max(d, config.minDist * 0.8)
          const f = (repulsionPower / (effective * effective)) * (1 - d / maxRange)
          const fx = (dx / d) * f
          const fy = (dy / d) * f
          if (!a.pinned && !a.dragging) {
            a.ax -= fx / a.mass
            a.ay -= fy / a.mass
          }
          if (!b.pinned && !b.dragging) {
            b.ax += fx / b.mass
            b.ay += fy / b.mass
          }
        }
      }
    }
  }

  // 4. Hard AABB Rectangular Collision & Position Projection Solver (ALL PAIRS)
  const cardGap = 56 // 56px guaranteed breathing room between cards
  let hasOverlap = false

  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i]
      const b = bodies[j]

      const minDx = (a.w + b.w) / 2 + cardGap
      const minDy = (a.h + b.h) / 2 + cardGap
      const dx = b.x - a.x
      const dy = b.y - a.y
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)

      const overlapX = minDx - absDx
      const overlapY = minDy - absDy

      if (overlapX > 0 && overlapY > 0) {
        hasOverlap = true
        const signX = dx >= 0 ? 1 : -1
        const signY = dy >= 0 ? 1 : -1

        // Apply smooth elastic position relaxation & repulsion along the penetration axis
        if (overlapX < overlapY) {
          const shift = overlapX * 0.25
          if (!a.pinned && !a.dragging && !b.pinned && !b.dragging) {
            a.x -= signX * shift * 0.5
            a.px -= signX * shift * 0.5
            b.x += signX * shift * 0.5
            b.px += signX * shift * 0.5
          } else if (!a.pinned && !a.dragging) {
            a.x -= signX * shift
            a.px -= signX * shift
          } else if (!b.pinned && !b.dragging) {
            b.x += signX * shift
            b.px += signX * shift
          }

          // Elastic acceleration impulse
          const force = overlapX * 0.12
          if (!a.pinned && !a.dragging) a.ax -= signX * force
          if (!b.pinned && !b.dragging) b.ax += signX * force
        } else {
          const shift = overlapY * 0.25
          if (!a.pinned && !a.dragging && !b.pinned && !b.dragging) {
            a.y -= signY * shift * 0.5
            a.py -= signY * shift * 0.5
            b.y += signY * shift * 0.5
            b.py += signY * shift * 0.5
          } else if (!a.pinned && !a.dragging) {
            a.y -= signY * shift
            a.py -= signY * shift
          } else if (!b.pinned && !b.dragging) {
            b.y += signY * shift
            b.py += signY * shift
          }

          // Elastic acceleration impulse
          const force = overlapY * 0.12
          if (!a.pinned && !a.dragging) a.ay -= signY * force
          if (!b.pinned && !b.dragging) b.ay += signY * force
        }
      }
    }
  }

  // 5. Cluster Centroid & Soft Tethering Boundary
  let sumX = 0
  let sumY = 0
  for (const b of bodies) {
    sumX += b.x
    sumY += b.y
  }
  const centroidX = sumX / (bodies.length || 1)
  const centroidY = sumY / (bodies.length || 1)

  for (const b of bodies) {
    if (b.pinned || b.dragging) continue

    // Gentle global gravity toward origin
    b.ax -= b.x * config.centerPull
    b.ay -= b.y * config.centerPull

    // Soft elastic tether if pulled beyond cluster perimeter
    const distToCenter = Math.hypot(b.x - centroidX, b.y - centroidY)
    if (distToCenter > config.clusterTetherRadius) {
      const excess = distToCenter - config.clusterTetherRadius
      const tetherF = config.clusterTetherK * excess * excess
      const dirX = (centroidX - b.x) / (distToCenter || 1)
      const dirY = (centroidY - b.y) / (distToCenter || 1)
      b.ax += dirX * tetherF
      b.ay += dirY * tetherF
    }
  }

  // 6. Verlet Integration with Terminal Velocity & Solid Sleep Lock
  let totalVelocity = 0

  for (const b of bodies) {
    if (b.pinned || b.dragging) continue

    let vx = (b.x - b.px) * config.damping
    let vy = (b.y - b.py) * config.damping
    const speed = Math.hypot(vx, vy)
    const force = Math.hypot(b.ax, b.ay)

    // Sleep state check (cannot sleep if there is an active collision/overlap)
    if (!hasOverlap && speed < config.sleepVelocity && force < config.sleepForce) {
      b.px = b.x
      b.py = b.y
      b.vx = 0
      b.vy = 0
    } else {
      // Terminal velocity cap
      if (speed > config.maxVelocity) {
        vx = (vx / speed) * config.maxVelocity
        vy = (vy / speed) * config.maxVelocity
      }

      // Max acceleration cap per frame
      const maxA = 5.5
      if (force > maxA) {
        b.ax = (b.ax / force) * maxA
        b.ay = (b.ay / force) * maxA
      }

      totalVelocity += speed
      b.px = b.x
      b.py = b.y
      b.vx = vx
      b.vy = vy
      b.x += vx + b.ax
      b.y += vy + b.ay
    }
  }

  const avgVelocity = totalVelocity / (bodies.length || 1)
  const isStable = !hasOverlap && avgVelocity < 0.2

  return {
    totalVelocity,
    isStable,
  }
}
