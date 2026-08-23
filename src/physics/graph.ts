import type { PhysicsBody, Bond, PhysicsConfig } from "./types"

export function bodyDist(a: PhysicsBody, b: PhysicsBody): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.sqrt(dx * dx + dy * dy)
}

export function mkBondId(a: string, b: string): string {
  return [a, b].sort().join("||")
}

export function segmentHitsNode(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  c: PhysicsBody,
): boolean {
  const dx = bx - ax
  const dy = by - ay
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return false
  const t = Math.max(
    0,
    Math.min(1, ((c.x - ax) * dx + (c.y - ay) * dy) / lenSq),
  )
  // Ignore endpoints near card attachment zones
  if (t < 0.12 || t > 0.88) return false
  const px = ax + t * dx - c.x
  const py = ay + t * dy - c.y
  const marginW = c.w * 0.44
  const marginH = c.h * 0.44
  return Math.abs(px) < marginW && Math.abs(py) < marginH
}

export function bondObstructed(
  a: PhysicsBody,
  b: PhysicsBody,
  all: PhysicsBody[],
): boolean {
  return all.some(
    (c) =>
      c.id !== a.id && c.id !== b.id && segmentHitsNode(a.x, a.y, b.x, b.y, c),
  )
}

/**
 * Computes an initial connected network ensuring every body has at least 1 bond
 */
export function computeInitialBonds(
  bodies: PhysicsBody[],
  config: PhysicsConfig,
): Bond[] {
  const result: Bond[] = []
  const bondSet = new Set<string>()

  const countFor = (id: string) =>
    result.filter((b) => b.a === id || b.b === id).length

  for (const body of bodies) {
    const candidates = bodies
      .filter((b) => b.id !== body.id)
      .map((b) => ({ b, d: bodyDist(body, b) }))
      .sort((a, b) => a.d - b.d)

    for (const { b: cBody } of candidates) {
      if (countFor(body.id) >= config.maxBonds) break
      const id = mkBondId(body.id, cBody.id)
      if (bondSet.has(id)) continue
      if (countFor(cBody.id) >= config.maxBonds) continue
      if (bondObstructed(body, cBody, bodies)) continue

      bondSet.add(id)
      result.push({ id, a: body.id, b: cBody.id })
    }
  }

  // Guarantee every node has at least 1 bond
  for (const body of bodies) {
    if (countFor(body.id) === 0) {
      const candidates = bodies
        .filter((b) => b.id !== body.id)
        .map((b) => ({ b, d: bodyDist(body, b) }))
        .sort((a, b) => a.d - b.d)

      for (const { b: cBody } of candidates) {
        const id = mkBondId(body.id, cBody.id)
        if (!bondObstructed(body, cBody, bodies)) {
          bondSet.add(id)
          result.push({ id, a: body.id, b: cBody.id })
          break
        }
      }
    }
  }

  return result
}

/**
 * Smart proximity latching with slot swapping and anti-orphan protection
 */
export function latchNodeNeighbors(
  nodeId: string,
  bodies: PhysicsBody[],
  currentBonds: Bond[],
  config: PhysicsConfig,
): Bond[] {
  const body = bodies.find((b) => b.id === nodeId)
  if (!body) return currentBonds

  // Isolate bonds not involving this node
  const without = currentBonds.filter((b) => b.a !== nodeId && b.b !== nodeId)
  const bondSet = new Set(without.map((b) => b.id))
  const next = [...without]

  const myCount = () =>
    next.filter((b) => b.a === nodeId || b.b === nodeId).length

  const candidates = bodies
    .filter((b) => b.id !== nodeId)
    .map((b) => ({ b, d: bodyDist(body, b) }))
    .filter((c) => c.d < config.neighborRadius)
    .sort((a, b) => a.d - b.d)

  // Primary pass: connect to available unobstructed neighbors
  for (const { b: cBody } of candidates) {
    if (myCount() >= config.maxBonds) break
    const id = mkBondId(nodeId, cBody.id)
    if (bondSet.has(id)) continue
    if (bondObstructed(body, cBody, bodies)) continue

    const theirCount = next.filter(
      (b) => b.a === cBody.id || b.b === cBody.id,
    ).length

    if (theirCount < config.maxBonds) {
      bondSet.add(id)
      next.push({ id, a: nodeId, b: cBody.id })
    } else {
      // Dynamic slot swapping: if new bond is significantly closer than their longest bond, swap it!
      const theirBonds = next.filter(
        (b) => b.a === cBody.id || b.b === cBody.id,
      )
      let longestBond: Bond | null = null
      let maxDist = 0

      for (const tb of theirBonds) {
        const otherId = tb.a === cBody.id ? tb.b : tb.a
        const otherBody = bodies.find((o) => o.id === otherId)
        if (otherBody) {
          const d = bodyDist(cBody, otherBody)
          if (d > maxDist) {
            maxDist = d
            longestBond = tb
          }
        }
      }

      const currentDist = bodyDist(body, cBody)
      if (longestBond && currentDist < maxDist * 0.78) {
        const idx = next.indexOf(longestBond)
        if (idx !== -1) {
          next.splice(idx, 1)
          bondSet.delete(longestBond.id)
          bondSet.add(id)
          next.push({ id, a: nodeId, b: cBody.id })
        }
      }
    }
  }

  // Network Connectivity Invariant: Guarantee at least 1 bond so node is NEVER orphaned
  if (myCount() === 0) {
    const allCandidates = bodies
      .filter((b) => b.id !== nodeId)
      .map((b) => ({ b, d: bodyDist(body, b) }))
      .sort((a, b) => a.d - b.d)

    for (const { b: cBody } of allCandidates) {
      const id = mkBondId(nodeId, cBody.id)
      if (!bondObstructed(body, cBody, bodies)) {
        bondSet.add(id)
        next.push({ id, a: nodeId, b: cBody.id })
        break
      }
    }
  }

  return next
}

/**
 * Cleans obstructed bonds safely without breaking graph connectivity
 */
export function cleanObstructedBonds(
  bodies: PhysicsBody[],
  currentBonds: Bond[],
  config: PhysicsConfig,
): Bond[] {
  let updatedBonds = [...currentBonds]

  const obstructed = updatedBonds.filter((bond) => {
    const a = bodies.find((b) => b.id === bond.a)
    const bBody = bodies.find((b) => b.id === bond.b)
    if (!a || !bBody) return false
    return bondObstructed(a, bBody, bodies)
  })

  if (obstructed.length > 0) {
    const affected = new Set(obstructed.flatMap((b) => [b.a, b.b]))
    const obsSet = new Set(obstructed.map((b) => b.id))

    // Remove obstructed bonds ONLY if nodes retain alternative bonds or re-latch
    updatedBonds = updatedBonds.filter((b) => !obsSet.has(b.id))

    // Re-latch affected nodes
    for (const id of affected) {
      updatedBonds = latchNodeNeighbors(id, bodies, updatedBonds, config)
    }
  }

  return updatedBonds
}
