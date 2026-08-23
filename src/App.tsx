import { useEffect, useRef, useState, useCallback } from "react"
import { Menu, X } from "lucide-react"
import { PORTFOLIO_NODES } from "./data/portfolio"
import type { PhysicsBody, Bond } from "./types"
import {
  computeInitialBonds,
  latchNodeNeighbors,
  cleanObstructedBonds,
} from "./physics/graph"
import { stepPhysics } from "./physics/engine"
import { HUD } from "./components/HUD"
import { NodeCardContent } from "./components/cards/CardContent"
import { VIEWPORT_CONFIG, MINIMAP_CONFIG, PHYSICS_CONFIG } from "./config"

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

function initBodies(): PhysicsBody[] {
  const activeNodes = PORTFOLIO_NODES.filter((node) => node.id !== "profile")
  const N = activeNodes.length
  // Shuffle order so any card can land in any direction on every load
  const shuffledSlots = activeNodes
    .map((_, i) => i)
    .sort(() => Math.random() - 0.5)
  const globalRotation = Math.random() * Math.PI * 2

  return activeNodes.map((node, i) => {
    const slot = shuffledSlots[i]
    const angle =
      globalRotation +
      (slot / (N || 1)) * Math.PI * 2 +
      (Math.random() - 0.5) * 0.45
    const radius = 40 + Math.random() * 95
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius

    // Outward launch impulse in randomized direction
    const impulseAngle = angle + (Math.random() - 0.5) * 0.6
    const impulse = 3.8 + Math.random() * 3.2
    const vx0 = Math.cos(impulseAngle) * impulse
    const vy0 = Math.sin(impulseAngle) * impulse

    return {
      id: node.id,
      x,
      y,
      px: x - vx0,
      py: y - vy0,
      ax: 0,
      ay: 0,
      vx: vx0,
      vy: vy0,
      mass: 1,
      pinned: false,
      dragging: false,
      w: node.width || 320,
      h: node.height || 280,
    }
  })
}

export default function App() {
  // Physics & Canvas state in refs (60fps, no React re-renders)
  const bodiesRef = useRef<PhysicsBody[]>(initBodies())
  const bondsRef = useRef<Bond[]>([])
  const vpRef = useRef({ panX: 0, panY: 0, zoom: 1 })
  const targetVpRef = useRef<{
    panX: number
    panY: number
    zoom: number
  } | null>(null)
  const autoFocusRef = useRef(true)
  const physicsActiveRef = useRef(true)

  // Interaction tracking
  const dragRef = useRef<{ id: string; ox: number; oy: number } | null>(null)
  const panRef = useRef<{
    sx: number
    sy: number
    px: number
    py: number
  } | null>(null)
  const touchRef = useRef<{ id: number; ox: number; oy: number } | null>(null)
  const pinchRef = useRef<{ dist: number; cx: number; cy: number } | null>(null)

  // DOM node handles
  const containerRef = useRef<HTMLDivElement>(null)
  const transformRef = useRef<HTMLDivElement>(null)
  const bondCanvasRef = useRef<HTMLCanvasElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const minimapRef = useRef<HTMLCanvasElement>(null)
  const nodeEls = useRef<Map<string, HTMLDivElement>>(new Map())
  const rafRef = useRef(0)

  // Stats DOM refs
  const statsEls = useRef({
    coords: null as HTMLSpanElement | null,
    physics: null as HTMLSpanElement | null,
    bondCount: null as HTMLSpanElement | null,
  })

  // React state
  const [bonds, setBonds] = useState<Bond[]>([])
  const [isPaused, setIsPaused] = useState(false)
  const [hudOpen, setHudOpen] = useState(false)
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768

  // ── Graph Topology Latching ──────────────────────────────────
  const latchNeighbors = useCallback((nodeId: string) => {
    const next = latchNodeNeighbors(
      nodeId,
      bodiesRef.current,
      bondsRef.current,
      PHYSICS_CONFIG,
    )
    bondsRef.current = next
    setBonds([...next])
  }, [])

  // ── Viewport Helpers ─────────────────────────────────────────
  const updateTransform = useCallback(() => {
    const { panX, panY, zoom } = vpRef.current
    const W = window.innerWidth
    const H = window.innerHeight
    if (transformRef.current) {
      transformRef.current.style.transform = `translate(${W / 2 + panX}px, ${H / 2 + panY}px) scale(${zoom})`
    }
  }, [])

  const screenToWorld = useCallback((sx: number, sy: number) => {
    const { panX, panY, zoom } = vpRef.current
    const W = window.innerWidth
    const H = window.innerHeight
    return { x: (sx - W / 2 - panX) / zoom, y: (sy - H / 2 - panY) / zoom }
  }, [])

  const zoomToward = useCallback(
    (newZoom: number, cx: number, cy: number, smooth = false) => {
      autoFocusRef.current = false
      const vp = vpRef.current
      const W = window.innerWidth
      const H = window.innerHeight
      const currentZoom = targetVpRef.current?.zoom ?? vp.zoom
      const currentPanX = targetVpRef.current?.panX ?? vp.panX
      const currentPanY = targetVpRef.current?.panY ?? vp.panY

      const clamped = Math.max(
        VIEWPORT_CONFIG.minZoom,
        Math.min(VIEWPORT_CONFIG.maxZoom, newZoom),
      )
      const wx = (cx - W / 2 - currentPanX) / currentZoom
      const wy = (cy - H / 2 - currentPanY) / currentZoom
      const targetPanX = cx - W / 2 - wx * clamped
      const targetPanY = cy - H / 2 - wy * clamped

      if (smooth) {
        targetVpRef.current = {
          panX: targetPanX,
          panY: targetPanY,
          zoom: clamped,
        }
      } else {
        targetVpRef.current = null
        vp.zoom = clamped
        vp.panX = targetPanX
        vp.panY = targetPanY
        updateTransform()
      }
    },
    [updateTransform],
  )

  // ── Minimap Renderer ─────────────────────────────────────────
  const drawMinimap = useCallback(() => {
    const canvas = minimapRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const CW = canvas.width
    const CH = canvas.height

    ctx.clearRect(0, 0, CW, CH)

    const bodies = bodiesRef.current.filter((b) => b.id !== "profile")
    if (bodies.length === 0) return

    // Centroid and dynamic bounding span
    let sumX = 0
    let sumY = 0
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    for (const b of bodies) {
      sumX += b.x
      sumY += b.y
      minX = Math.min(minX, b.x)
      maxX = Math.max(maxX, b.x)
      minY = Math.min(minY, b.y)
      maxY = Math.max(maxY, b.y)
    }

    const clusterCenterX = sumX / bodies.length
    const clusterCenterY = sumY / bodies.length

    const spanX = Math.max(maxX - minX + 600, MINIMAP_CONFIG.minSpanX)
    const spanY = Math.max(maxY - minY + 450, MINIMAP_CONFIG.minSpanY)
    const scale = Math.min(
      (CW - MINIMAP_CONFIG.padding) / spanX,
      (CH - MINIMAP_CONFIG.padding) / spanY,
    )

    const toMapX = (wx: number) => CW / 2 + (wx - clusterCenterX) * scale
    const toMapY = (wy: number) => CH / 2 + (wy - clusterCenterY) * scale

    // Bonds
    for (const bond of bondsRef.current) {
      const a = bodiesRef.current.find((b) => b.id === bond.a)
      const bBody = bodiesRef.current.find((b) => b.id === bond.b)
      if (!a || !bBody) continue
      ctx.beginPath()
      ctx.strokeStyle = "rgba(255,255,255,0.1)"
      ctx.lineWidth = 0.6
      ctx.moveTo(toMapX(a.x), toMapY(a.y))
      ctx.lineTo(toMapX(bBody.x), toMapY(bBody.y))
      ctx.stroke()
    }

    // Nodes
    for (const body of bodiesRef.current) {
      const node = PORTFOLIO_NODES.find((n) => n.id === body.id)
      if (!node || node.id === "profile") continue
      const mx = toMapX(body.x)
      const my = toMapY(body.y)
      ctx.fillStyle = node.color
      ctx.globalAlpha = 0.9
      ctx.beginPath()
      ctx.arc(mx, my, MINIMAP_CONFIG.nodeRadius, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1

    // Viewport rect
    const vp = vpRef.current
    const VW = window.innerWidth
    const VH = window.innerHeight
    const vLeft = (-VW / 2 - vp.panX) / vp.zoom
    const vTop = (-VH / 2 - vp.panY) / vp.zoom
    const vWidth = VW / vp.zoom
    const vHeight = VH / vp.zoom

    const rx = toMapX(vLeft)
    const ry = toMapY(vTop)
    const rw = vWidth * scale
    const rh = vHeight * scale
    ctx.fillStyle = "rgba(255,255,255,0.08)"
    ctx.beginPath()
    ctx.roundRect(rx, ry, rw, rh, 4)
    ctx.fill()
  }, [])

  // ── Initialize on Mount ──────────────────────────────────────
  useEffect(() => {
    const initial = computeInitialBonds(
      bodiesRef.current,
      PHYSICS_CONFIG,
    )
    bondsRef.current = initial
    setBonds(initial)

    // Initial camera fit
    const bodies = bodiesRef.current
    if (bodies.length > 0) {
      const pad = 48
      const minX = Math.min(...bodies.map((b) => b.x - b.w / 2))
      const maxX = Math.max(...bodies.map((b) => b.x + b.w / 2))
      const minY = Math.min(...bodies.map((b) => b.y - b.h / 2))
      const maxY = Math.max(...bodies.map((b) => b.y + b.h / 2))
      const W = window.innerWidth
      const H = window.innerHeight
      const scaleX = (W - pad * 2) / (maxX - minX || 1)
      const scaleY = (H - pad * 2) / (maxY - minY || 1)
      const fitZoom = Math.min(scaleX, scaleY, 1)
      const cx = (minX + maxX) / 2
      const cy = (minY + maxY) / 2
      vpRef.current = {
        panX: -cx * fitZoom,
        panY: -cy * fitZoom,
        zoom: fitZoom,
      }
      targetVpRef.current = { ...vpRef.current }
    }
    updateTransform()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync Bond Count Stat ─────────────────────────────────────
  useEffect(() => {
    if (statsEls.current.bondCount) {
      statsEls.current.bondCount.textContent = String(bonds.length)
    }
  }, [bonds])

  // ── Physics + Render Loop ───────────────────────────────────
  useEffect(() => {
    let frameCount = 0
    const tick = () => {
      const bodies = bodiesRef.current
      const bonds = bondsRef.current
      const vp = vpRef.current
      frameCount++

      // 1. Step physics
      if (physicsActiveRef.current) {
        const { isStable } = stepPhysics(bodies, bonds, PHYSICS_CONFIG)

        const statsEl = statsEls.current
        if (statsEl.physics) {
          const dot = statsEl.physics
            .previousElementSibling as HTMLElement | null
          if (dot) {
            dot.style.background = isStable ? "#22c55e" : "#f97316"
            if (isStable) dot.classList.remove("active")
            else dot.classList.add("active")
          }
          statsEl.physics.textContent = isStable ? "STABLE" : "ACTIVE"
          statsEl.physics.style.color = isStable ? "#22c55e" : "#f97316"
        }
      }

      // 2. Camera auto-focus on startup
      if (autoFocusRef.current && bodies.length > 0) {
        const pad = 48
        const minX = Math.min(...bodies.map((b) => b.x - b.w / 2))
        const maxX = Math.max(...bodies.map((b) => b.x + b.w / 2))
        const minY = Math.min(...bodies.map((b) => b.y - b.h / 2))
        const maxY = Math.max(...bodies.map((b) => b.y + b.h / 2))
        const W = window.innerWidth
        const H = window.innerHeight
        const scaleX = (W - pad * 2) / (maxX - minX || 1)
        const scaleY = (H - pad * 2) / (maxY - minY || 1)
        const fitZoom = Math.min(scaleX, scaleY, 1)
        const cx = (minX + maxX) / 2
        const cy = (minY + maxY) / 2
        targetVpRef.current = {
          panX: -cx * fitZoom,
          panY: -cy * fitZoom,
          zoom: fitZoom,
        }
      }

      // 3. Smooth camera lerp
      if (targetVpRef.current) {
        const t = 0.072
        const tv = targetVpRef.current
        vp.panX += (tv.panX - vp.panX) * t
        vp.panY += (tv.panY - vp.panY) * t
        vp.zoom += (tv.zoom - vp.zoom) * t
        updateTransform()
        const diff =
          Math.abs(tv.panX - vp.panX) +
          Math.abs(tv.panY - vp.panY) +
          Math.abs(tv.zoom - vp.zoom) * 100
        if (diff < 0.3) {
          vp.panX = tv.panX
          vp.panY = tv.panY
          vp.zoom = tv.zoom
          targetVpRef.current = null
          updateTransform()
        }
      }

      // 4. Update node card positions in DOM & sync real dynamic dimensions
      for (const b of bodies) {
        const el = nodeEls.current.get(b.id)
        if (el) {
          if (el.offsetWidth > 0) b.w = el.offsetWidth
          if (el.offsetHeight > 0) b.h = el.offsetHeight
          el.style.transform = `translate(${b.x - b.w / 2}px, ${b.y - b.h / 2}px)`
        }
      }

      // 5. Render dual-pass glow bond lines
      const bc = bondCanvasRef.current
      if (bc) {
        const W = window.innerWidth
        const H = window.innerHeight
        if (bc.width !== W || bc.height !== H) {
          bc.width = W
          bc.height = H
        }
        const bctx = bc.getContext("2d")!
        bctx.clearRect(0, 0, W, H)

        bctx.save()
        bctx.translate(W / 2 + vp.panX, H / 2 + vp.panY)
        bctx.scale(vp.zoom, vp.zoom)

        for (const bond of bonds) {
          const a = bodies.find((b) => b.id === bond.a)
          const bBody = bodies.find((b) => b.id === bond.b)
          if (!a || !bBody) continue
          const nodeA = PORTFOLIO_NODES.find((n) => n.id === bond.a)
          const nodeB = PORTFOLIO_NODES.find((n) => n.id === bond.b)
          if (!nodeA || !nodeB) continue

          const dx = bBody.x - a.x
          const dy = bBody.y - a.y
          const d = Math.sqrt(dx * dx + dy * dy) || 1
          const opacity = Math.max(
            0,
            Math.min(1, 1 - d / PHYSICS_CONFIG.breakDist),
          )
          const perp = Math.min(90, d * 0.12)
          const nx = (-dy / d) * perp
          const ny = (dx / d) * perp
          const cp1x = a.x + dx / 3 + nx
          const cp1y = a.y + dy / 3 + ny
          const cp2x = a.x + (2 * dx) / 3 - nx
          const cp2y = a.y + (2 * dy) / 3 - ny

          const grad = bctx.createLinearGradient(a.x, a.y, bBody.x, bBody.y)
          grad.addColorStop(0, nodeA.color)
          grad.addColorStop(1, nodeB.color)

          // Glow pass
          bctx.save()
          bctx.filter = "blur(6px)"
          bctx.beginPath()
          bctx.moveTo(a.x, a.y)
          bctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, bBody.x, bBody.y)
          bctx.strokeStyle = grad
          bctx.globalAlpha = opacity * 0.35
          bctx.lineWidth = 14
          bctx.stroke()
          bctx.restore()

          // Sharp line
          bctx.beginPath()
          bctx.moveTo(a.x, a.y)
          bctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, bBody.x, bBody.y)
          bctx.strokeStyle = grad
          bctx.globalAlpha = opacity * 0.7
          bctx.lineWidth = 1.5
          bctx.stroke()
        }

        bctx.restore()
        bctx.globalAlpha = 1
      }

      // 6. Parallax grid background
      if (bgRef.current) {
        const px = ((vp.panX % 40) + 40) % 40
        const py = ((vp.panY % 40) + 40) % 40
        bgRef.current.style.backgroundPosition = `${px}px ${py}px`
      }

      // 7. Periodic bond obstruction cleanup & startup expansion dynamic relatching
      if (frameCount < 180 && frameCount % 20 === 0) {
        for (const b of bodies) {
          bondsRef.current = latchNodeNeighbors(
            b.id,
            bodies,
            bondsRef.current,
            PHYSICS_CONFIG,
          )
        }
        setBonds([...bondsRef.current])
      } else if (frameCount % 30 === 0) {
        const next = cleanObstructedBonds(
          bodies,
          bondsRef.current,
          PHYSICS_CONFIG,
        )
        if (next.length !== bondsRef.current.length) {
          bondsRef.current = next
          setBonds([...next])
        }
      }

      drawMinimap()
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [updateTransform, drawMinimap])

  // ── Interaction Handlers ─────────────────────────────────────
  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation()
      if (e.button !== 0) return
      autoFocusRef.current = false
      const body = bodiesRef.current.find((b) => b.id === id)
      if (!body) return
      const world = screenToWorld(e.clientX, e.clientY)
      body.dragging = true
      dragRef.current = { id, ox: world.x - body.x, oy: world.y - body.y }
      const el = nodeEls.current.get(id)
      if (el) {
        el.classList.add("dragging")
        el.style.zIndex = "30"
      }
      nodeEls.current.forEach((item, nid) => {
        if (nid !== id) item.style.zIndex = "10"
      })
    },
    [screenToWorld],
  )

  const handleDoubleClick = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const body = bodiesRef.current.find((b) => b.id === id)
    if (!body) return
    targetVpRef.current = { panX: -body.x, panY: -body.y, zoom: 1.1 }
  }, [])

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    autoFocusRef.current = false
    panRef.current = {
      sx: e.clientX,
      sy: e.clientY,
      px: vpRef.current.panX,
      py: vpRef.current.panY,
    }
  }, [])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const world = screenToWorld(e.clientX, e.clientY)
      if (statsEls.current.coords) {
        statsEls.current.coords.textContent = `${Math.round(world.x)}, ${Math.round(world.y)}`
      }

      if (dragRef.current) {
        const { id, ox, oy } = dragRef.current
        const body = bodiesRef.current.find((b) => b.id === id)
        if (!body) return
        body.px = body.x
        body.py = body.y
        body.x = world.x - ox
        body.y = world.y - oy

        const nb = latchNodeNeighbors(
          id,
          bodiesRef.current,
          bondsRef.current,
          PHYSICS_CONFIG,
        )
        if (nb !== bondsRef.current) {
          bondsRef.current = nb
          setBonds([...nb])
        }
        return
      }

      if (panRef.current) {
        const { sx, sy, px, py } = panRef.current
        vpRef.current.panX = px + (e.clientX - sx)
        vpRef.current.panY = py + (e.clientY - sy)
        updateTransform()
        targetVpRef.current = null
      }
    },
    [screenToWorld, updateTransform],
  )

  const handleMouseUp = useCallback(() => {
    if (dragRef.current) {
      const { id } = dragRef.current
      const body = bodiesRef.current.find((b) => b.id === id)
      if (body) body.dragging = false
      const el = nodeEls.current.get(id)
      if (el) el.classList.remove("dragging")
      dragRef.current = null
      latchNeighbors(id)
    }
    panRef.current = null
  }, [latchNeighbors])

  // ── Native Non-Passive Wheel & Gesture Listeners ─────────────
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault()
      autoFocusRef.current = false
      targetVpRef.current = null

      if (e.ctrlKey || e.metaKey) {
        // Trackpad continuous pinch-to-zoom
        const factor = Math.exp(-e.deltaY * 0.006)
        zoomToward(vpRef.current.zoom * factor, e.clientX, e.clientY)
      } else {
        // Trackpad 2-finger pan & mouse wheel scroll
        vpRef.current.panX -= e.deltaX
        vpRef.current.panY -= e.deltaY
        updateTransform()
      }
    }

    const preventGesture = (e: Event) => e.preventDefault()

    container.addEventListener("wheel", handleNativeWheel, { passive: false })
    window.addEventListener("gesturestart", preventGesture, { passive: false })
    window.addEventListener("gesturechange", preventGesture, { passive: false })
    window.addEventListener("gestureend", preventGesture, { passive: false })

    return () => {
      container.removeEventListener("wheel", handleNativeWheel)
      window.removeEventListener("gesturestart", preventGesture)
      window.removeEventListener("gesturechange", preventGesture)
      window.removeEventListener("gestureend", preventGesture)
    }
  }, [zoomToward, updateTransform])

  // ── Touch Handlers ───────────────────────────────────────────
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()
      autoFocusRef.current = false

      if (e.touches.length === 2) {
        const t0 = e.touches[0]
        const t1 = e.touches[1]
        const dist = Math.hypot(
          t1.clientX - t0.clientX,
          t1.clientY - t0.clientY,
        )
        pinchRef.current = {
          dist,
          cx: (t0.clientX + t1.clientX) / 2,
          cy: (t0.clientY + t1.clientY) / 2,
        }
        dragRef.current = null
        panRef.current = null
        return
      }

      const touch = e.touches[0]
      const world = screenToWorld(touch.clientX, touch.clientY)
      let hitId: string | null = null
      for (const body of bodiesRef.current) {
        if (
          Math.abs(world.x - body.x) < body.w / 2 &&
          Math.abs(world.y - body.y) < body.h / 2
        ) {
          hitId = body.id
          break
        }
      }

      if (hitId) {
        const body = bodiesRef.current.find((b) => b.id === hitId)!
        body.dragging = true
        dragRef.current = {
          id: hitId,
          ox: world.x - body.x,
          oy: world.y - body.y,
        }
        touchRef.current = {
          id: touch.identifier,
          ox: touch.clientX,
          oy: touch.clientY,
        }
        const el = nodeEls.current.get(hitId)
        if (el) {
          el.classList.add("dragging")
          el.style.zIndex = "30"
        }
      } else {
        panRef.current = {
          sx: touch.clientX,
          sy: touch.clientY,
          px: vpRef.current.panX,
          py: vpRef.current.panY,
        }
      }
    },
    [screenToWorld],
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()

      if (e.touches.length === 2 && pinchRef.current) {
        const t0 = e.touches[0]
        const t1 = e.touches[1]
        const dist = Math.hypot(
          t1.clientX - t0.clientX,
          t1.clientY - t0.clientY,
        )
        const { dist: prevDist, cx, cy } = pinchRef.current
        zoomToward(vpRef.current.zoom * (dist / prevDist), cx, cy)
        pinchRef.current = { dist, cx, cy }
        return
      }

      const touch = e.touches[0]
      if (dragRef.current) {
        const { id, ox, oy } = dragRef.current
        const body = bodiesRef.current.find((b) => b.id === id)
        if (!body) return
        const world = screenToWorld(touch.clientX, touch.clientY)
        body.px = body.x
        body.py = body.y
        body.x = world.x - ox
        body.y = world.y - oy

        const nb = latchNodeNeighbors(
          id,
          bodiesRef.current,
          bondsRef.current,
          PHYSICS_CONFIG,
        )
        if (nb !== bondsRef.current) {
          bondsRef.current = nb
          setBonds([...nb])
        }
      } else if (panRef.current) {
        const { sx, sy, px, py } = panRef.current
        vpRef.current.panX = px + (touch.clientX - sx)
        vpRef.current.panY = py + (touch.clientY - sy)
        updateTransform()
      }
    },
    [screenToWorld, zoomToward, updateTransform],
  )

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()
      pinchRef.current = null
      if (e.touches.length === 0) {
        if (dragRef.current) {
          const { id } = dragRef.current
          const body = bodiesRef.current.find((b) => b.id === id)
          if (body) body.dragging = false
          const el = nodeEls.current.get(id)
          if (el) el.classList.remove("dragging")
          dragRef.current = null
          latchNeighbors(id)
        }
        panRef.current = null
        touchRef.current = null
      }
    },
    [latchNeighbors],
  )

  // ── HUD Callbacks ────────────────────────────────────────────
  const focusNode = useCallback((id: string) => {
    const body = bodiesRef.current.find((b) => b.id === id)
    if (!body) return
    targetVpRef.current = { panX: -body.x, panY: -body.y, zoom: 1.15 }
  }, [])

  const fitAll = useCallback(() => {
    const bodies = bodiesRef.current
    if (bodies.length === 0) return
    const pad = VIEWPORT_CONFIG.fitPadding
    const minX = Math.min(...bodies.map((b) => b.x - b.w / 2))
    const maxX = Math.max(...bodies.map((b) => b.x + b.w / 2))
    const minY = Math.min(...bodies.map((b) => b.y - b.h / 2))
    const maxY = Math.max(...bodies.map((b) => b.y + b.h / 2))
    const W = window.innerWidth
    const H = window.innerHeight
    const scaleX = (W - pad * 2) / (maxX - minX || 1)
    const scaleY = (H - pad * 2) / (maxY - minY || 1)
    const fitZoom = Math.min(scaleX, scaleY, 1)
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    targetVpRef.current = {
      panX: -cx * fitZoom,
      panY: -cy * fitZoom,
      zoom: fitZoom,
    }
  }, [])

  const zoomIn = useCallback(() => {
    autoFocusRef.current = false
    const baseZoom = targetVpRef.current?.zoom ?? vpRef.current.zoom
    zoomToward(
      baseZoom * 1.3,
      window.innerWidth / 2,
      window.innerHeight / 2,
      true,
    )
  }, [zoomToward])

  const zoomOut = useCallback(() => {
    autoFocusRef.current = false
    const baseZoom = targetVpRef.current?.zoom ?? vpRef.current.zoom
    zoomToward(
      baseZoom / 1.3,
      window.innerWidth / 2,
      window.innerHeight / 2,
      true,
    )
  }, [zoomToward])

  const togglePhysics = useCallback(() => {
    physicsActiveRef.current = !physicsActiveRef.current
    setIsPaused((p) => !p)
  }, [])

  // ── Keyboard Shortcuts ───────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return

      if (e.key === "+" || e.key === "=" || (e.ctrlKey && e.key === "=")) {
        e.preventDefault()
        zoomIn()
      } else if (e.key === "-" || (e.ctrlKey && e.key === "-")) {
        e.preventDefault()
        zoomOut()
      } else if (e.key.toLowerCase() === "f") {
        fitAll()
      } else if (e.code === "Space") {
        e.preventDefault()
        togglePhysics()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [zoomIn, zoomOut, fitAll, togglePhysics])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      style={{ background: "#0f0f0f", touchAction: "none" }}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Dot-grid background */}
      <div ref={bgRef} className="absolute inset-0 canvas-bg" />

      {/* Bond canvas */}
      <canvas
        ref={bondCanvasRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      {/* Radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 85% 85% at 50% 50%, transparent 35%, rgba(10,10,10,0.7) 100%)",
          zIndex: 1,
        }}
      />

      {/* Canvas transform container */}
      <div
        ref={transformRef}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transformOrigin: "0 0",
          willChange: "transform",
          zIndex: 3,
        }}
      >
        {PORTFOLIO_NODES.filter((n) => n.id !== "profile").map((node) => {
          const body = bodiesRef.current.find((b) => b.id === node.id)
          const initX = body ? body.x - node.width / 2 : 0
          const initY = body ? body.y - node.height / 2 : 0
          return (
            <div
              key={node.id}
              ref={(el) => {
                if (el) nodeEls.current.set(node.id, el)
              }}
              className="node-card"
              style={{
                width: node.width,
                transform: `translate(${initX}px, ${initY}px)`,
                background: `rgba(${hexToRgb(node.color)}, 0.06)`,
                borderColor: `rgba(${hexToRgb(node.color)}, 0.18)`,
                zIndex: 10,
              }}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              onDoubleClick={(e) => handleDoubleClick(e, node.id)}
            >
              <NodeCardContent node={node} />
            </div>
          )
        })}
      </div>

      {/* Mobile HUD Toggle */}
      {isMobile && (
        <button
          type="button"
          onClick={() => setHudOpen((o) => !o)}
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            zIndex: 200,
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "#888",
            fontSize: 18,
            cursor: "pointer",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {hudOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      )}

      {/* HUD overlay */}
      <div style={{ zIndex: 50, position: "relative" }}>
        {(!isMobile || hudOpen) && (
          <HUD
            nodes={PORTFOLIO_NODES.filter((n) => n.id !== "profile")}
            profile={PORTFOLIO_NODES.find((n) => n.id === "profile")!}
            bonds={bonds}
            isPaused={isPaused}
            minimapRef={minimapRef}
            statsEls={statsEls}
            onFocusNode={(id) => {
              focusNode(id)
              setHudOpen(false)
            }}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onFitAll={fitAll}
            onTogglePhysics={togglePhysics}
          />
        )}
      </div>
    </div>
  )
}
