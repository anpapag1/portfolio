import { useEffect, useRef, useState, useCallback } from "react"
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
import { PrivacyPolicyView } from "./components/privacy/PrivacyPolicyView"
import { PrivacyPolicyDirectory } from "./components/privacy/PrivacyPolicyDirectory"
import { useTheme } from "./hooks/useTheme"


function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

function initBodies(includeSecret = false): PhysicsBody[] {
  const activeNodes = PORTFOLIO_NODES.filter(
    (node) => node.id !== "profile" && (!node.secret || includeSecret),
  )
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
  const [isSecretUnlocked, setIsSecretUnlocked] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const spacePressTimestampsRef = useRef<number[]>([])

  // Physics & Canvas state in refs (60fps, no React re-renders)
  const bodiesRef = useRef<PhysicsBody[]>(initBodies(false))
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

  // React state
  const [bonds, setBonds] = useState<Bond[]>([])
  const [isPaused, setIsPaused] = useState(false)
  const [isHudCollapsed, setIsHudCollapsed] = useState(false)
  const [pathname, setPathname] = useState(() =>
    typeof window !== "undefined" ? window.location.pathname : "/"
  )
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768
  const lastTapRef = useRef<{ id: string; time: number; x: number; y: number } | null>(null)

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname)
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  const navigate = useCallback((path: string) => {
    window.history.pushState({}, "", path)
    setPathname(path)
  }, [])

  const isPrivacy = pathname.startsWith("/privacy-policy")

  useEffect(() => {
    if (isPrivacy) {
      document.documentElement.style.overflow = "auto"
      document.documentElement.style.touchAction = "auto"
      document.body.style.overflow = "auto"
      document.body.style.touchAction = "auto"
      document.body.style.userSelect = "auto"
      const root = document.getElementById("root")
      if (root) {
        root.style.overflow = "auto"
        root.style.touchAction = "auto"
      }
    } else {
      document.documentElement.style.overflow = "hidden"
      document.documentElement.style.touchAction = "none"
      document.body.style.overflow = "hidden"
      document.body.style.touchAction = "none"
      document.body.style.userSelect = "none"
      const root = document.getElementById("root")
      if (root) {
        root.style.overflow = "hidden"
        root.style.touchAction = "none"
      }
    }
  }, [isPrivacy])




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
      if (zoom < VIEWPORT_CONFIG.interactiveZoomThreshold) {
        transformRef.current.classList.add("overview-mode")
      } else {
        transformRef.current.classList.remove("overview-mode")
      }
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

  // Theme state
  const { theme, isDark, toggleTheme } = useTheme()

  // ── Minimap Renderer ─────────────────────────────────────────
  const drawMinimap = useCallback(() => {
    const canvas = minimapRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Auto-sync canvas internal pixel dimensions with its real displayed size for razor-sharp, zero-stretch rendering
    const rect = canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const displayW = Math.round(rect.width) || canvas.clientWidth || 140
    const displayH = Math.round(rect.height) || canvas.clientHeight || 80
    const pixelW = Math.round(displayW * dpr)
    const pixelH = Math.round(displayH * dpr)

    if (canvas.width !== pixelW || canvas.height !== pixelH) {
      canvas.width = pixelW
      canvas.height = pixelH
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.scale(dpr, dpr)

    const CW = displayW
    const CH = displayH

    const bodies = bodiesRef.current.filter((b) => b.id !== "profile")
    if (bodies.length === 0) {
      ctx.restore()
      return
    }

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

    const spanX = Math.max(maxX - minX + 500, MINIMAP_CONFIG.minSpanX)
    const spanY = Math.max(maxY - minY + 380, MINIMAP_CONFIG.minSpanY)
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
      ctx.strokeStyle = isDark
        ? "rgba(255,255,255,0.22)"
        : "rgba(0,0,0,0.18)"
      ctx.lineWidth = 1.0
      ctx.moveTo(toMapX(a.x), toMapY(a.y))
      ctx.lineTo(toMapX(bBody.x), toMapY(bBody.y))
      ctx.stroke()
    }

    // Nodes (Vibrant Glowing Dots)
    for (const body of bodiesRef.current) {
      const node = PORTFOLIO_NODES.find((n) => n.id === body.id)
      if (!node || node.id === "profile") continue
      const mx = toMapX(body.x)
      const my = toMapY(body.y)

      // Outer glow aura
      ctx.beginPath()
      ctx.arc(mx, my, MINIMAP_CONFIG.nodeRadius + 2.5, 0, Math.PI * 2)
      ctx.fillStyle = node.color
      ctx.globalAlpha = isDark ? 0.28 : 0.2
      ctx.fill()

      // Core vibrant dot
      ctx.beginPath()
      ctx.arc(mx, my, MINIMAP_CONFIG.nodeRadius, 0, Math.PI * 2)
      ctx.fillStyle = node.color
      ctx.globalAlpha = 1.0
      ctx.shadowColor = node.color
      ctx.shadowBlur = isDark ? 6 : 4
      ctx.fill()
      ctx.shadowBlur = 0
    }
    ctx.globalAlpha = 1

    // Viewport camera frame
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
    ctx.beginPath()
    ctx.fillStyle = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)"
    ctx.strokeStyle = isDark ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.25)"
    ctx.lineWidth = 1.0
    ctx.roundRect(rx, ry, rw, rh, 3)
    ctx.fill()
    ctx.stroke()

    ctx.restore()
  }, [isDark])

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
        stepPhysics(bodies, bonds, PHYSICS_CONFIG)
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
        const t = 0.16
        const tv = targetVpRef.current
        vp.panX += (tv.panX - vp.panX) * t
        vp.panY += (tv.panY - vp.panY) * t
        vp.zoom += (tv.zoom - vp.zoom) * t
        updateTransform()
        const diff =
          Math.abs(tv.panX - vp.panX) +
          Math.abs(tv.panY - vp.panY) +
          Math.abs(tv.zoom - vp.zoom) * 100
        if (diff < 0.5) {
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

          // Subtle Micro-Glow Pass
          bctx.save()
          bctx.filter = "blur(2.5px)"
          bctx.beginPath()
          bctx.moveTo(a.x, a.y)
          bctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, bBody.x, bBody.y)
          bctx.strokeStyle = grad
          bctx.globalAlpha = opacity * 0.18
          bctx.lineWidth = 4.5
          bctx.stroke()
          bctx.restore()

          // Core Crisp Line Pass
          bctx.beginPath()
          bctx.moveTo(a.x, a.y)
          bctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, bBody.x, bBody.y)
          bctx.strokeStyle = grad
          bctx.globalAlpha = opacity * 0.65
          bctx.lineWidth = 1.2
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

    if (isPrivacy) {
      return
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [updateTransform, drawMinimap, isPrivacy])

  // ── Interaction Handlers ─────────────────────────────────────
  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, id: string) => {
      const isOverview =
        vpRef.current.zoom < VIEWPORT_CONFIG.interactiveZoomThreshold
      if (isOverview) {
        e.preventDefault()
      }
      e.stopPropagation()
      if (e.button !== 0) return
      autoFocusRef.current = false
      setIsHudCollapsed(false)
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

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    autoFocusRef.current = false
    setIsHudCollapsed(false)
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

  // ── HUD Callbacks ────────────────────────────────────────────
  const focusNode = useCallback((id: string) => {
    const body = bodiesRef.current.find((b) => b.id === id)
    if (!body) return
    autoFocusRef.current = false

    // Settle node movement immediately so it does not drift away while camera is centering
    body.vx = 0
    body.vy = 0

    const isMob = typeof window !== "undefined" && window.innerWidth < 768
    const cardW = body.w || 320
    const cardH = body.h || 300
    const padX = isMob ? 36 : 140
    const padY = isMob ? 130 : 120

    const scaleX = (window.innerWidth - padX) / cardW
    const scaleY = (window.innerHeight - padY) / cardH
    const targetZoom = isMob
      ? Math.min(1.0, scaleX, scaleY)
      : Math.min(1.15, scaleX, scaleY)

    targetVpRef.current = {
      panX: -body.x * targetZoom,
      panY: -body.y * targetZoom,
      zoom: targetZoom,
    }

    if (isMob) {
      setIsHudCollapsed(true)
    }
  }, [])

  const fitAll = useCallback(() => {
    setIsHudCollapsed(false)
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
    setIsHudCollapsed(false)
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
    setIsHudCollapsed(false)
    const baseZoom = targetVpRef.current?.zoom ?? vpRef.current.zoom
    zoomToward(
      baseZoom / 1.3,
      window.innerWidth / 2,
      window.innerHeight / 2,
      true,
    )
  }, [zoomToward])

  const toggleSecretNode = useCallback(() => {
    const secretNode = PORTFOLIO_NODES.find((n) => n.id === "secret" || n.secret)
    if (!secretNode) return

    if (isSecretUnlocked) {
      // Hide secret node cleanly
      setIsSecretUnlocked(false)
      bodiesRef.current = bodiesRef.current.filter((b) => b.id !== secretNode.id)
      bondsRef.current = bondsRef.current.filter(
        (b) => b.a !== secretNode.id && b.b !== secretNode.id,
      )
      setBonds([...bondsRef.current])

      setToastMessage("🔒 DEV VAULT HIDDEN")
      setTimeout(() => {
        setToastMessage(null)
      }, 2500)
    } else {
      // Reveal secret node
      setIsSecretUnlocked(true)

      let body = bodiesRef.current.find((b) => b.id === secretNode.id)
      if (!body) {
        const angle = Math.random() * Math.PI * 2
        const radius = 50
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius
        const vx0 = Math.cos(angle) * 7.5
        const vy0 = Math.sin(angle) * 7.5

        body = {
          id: secretNode.id,
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
          w: secretNode.width || 360,
          h: secretNode.height || 430,
        }
        bodiesRef.current = [...bodiesRef.current, body]

        const nextBonds = latchNodeNeighbors(
          secretNode.id,
          bodiesRef.current,
          bondsRef.current,
          PHYSICS_CONFIG,
        )
        bondsRef.current = nextBonds
        setBonds([...nextBonds])
      }

      physicsActiveRef.current = true
      setIsPaused(false)

      setToastMessage("🔓 DEV VAULT UNLOCKED")
      setTimeout(() => {
        setToastMessage(null)
      }, 3800)

      setTimeout(() => {
        focusNode(secretNode.id)
      }, 120)
    }
  }, [isSecretUnlocked, focusNode])

  const togglePhysics = useCallback(() => {
    setIsHudCollapsed(false)
    const nextState = !physicsActiveRef.current
    physicsActiveRef.current = nextState
    if (!nextState) {
      for (const b of bodiesRef.current) {
        b.vx = 0
        b.vy = 0
      }
    }
    setIsPaused(!nextState)
  }, [])

  // ── Native Non-Passive Wheel & Gesture Listeners ─────────────
  useEffect(() => {
    if (isPrivacy) return

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

    const handleNativeTouchStart = (e: TouchEvent) => {
      autoFocusRef.current = false

      if (e.touches.length === 2) {
        e.preventDefault()
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
      const target = e.target as HTMLElement | null
      const cardEl = target?.closest(".node-card") as HTMLElement | null
      let nodeId: string | null = null

      if (cardEl) {
        nodeEls.current.forEach((el, id) => {
          if (el === cardEl) nodeId = id
        })
      }

      if (nodeId) {
        const body = bodiesRef.current.find((b) => b.id === nodeId)
        if (body) {
          const world = screenToWorld(touch.clientX, touch.clientY)
          body.dragging = true
          dragRef.current = {
            id: nodeId,
            ox: world.x - body.x,
            oy: world.y - body.y,
          }
          touchRef.current = {
            id: touch.identifier,
            ox: touch.clientX,
            oy: touch.clientY,
          }
          const el = nodeEls.current.get(nodeId)
          if (el) {
            el.classList.add("dragging")
            el.style.zIndex = "30"
          }
          nodeEls.current.forEach((item, nid) => {
            if (nid !== nodeId) item.style.zIndex = "10"
          })
          return
        }
      }

      panRef.current = {
        sx: touch.clientX,
        sy: touch.clientY,
        px: vpRef.current.panX,
        py: vpRef.current.panY,
      }
      touchRef.current = {
        id: touch.identifier,
        ox: touch.clientX,
        oy: touch.clientY,
      }
    }

    const handleNativeTouchMove = (e: TouchEvent) => {
      if (pinchRef.current && e.touches.length === 2) {
        e.preventDefault()
        const t0 = e.touches[0]
        const t1 = e.touches[1]
        const dist = Math.hypot(
          t1.clientX - t0.clientX,
          t1.clientY - t0.clientY,
        )
        const scale = dist / pinchRef.current.dist
        pinchRef.current.dist = dist
        zoomToward(
          vpRef.current.zoom * scale,
          pinchRef.current.cx,
          pinchRef.current.cy,
        )
        return
      }

      const touch = e.touches[0]
      if (dragRef.current) {
        e.preventDefault()
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
        e.preventDefault()
        const { sx, sy, px, py } = panRef.current
        vpRef.current.panX = px + (touch.clientX - sx)
        vpRef.current.panY = py + (touch.clientY - sy)
        updateTransform()
      }
    }

    const handleNativeTouchEnd = (e: TouchEvent) => {
      pinchRef.current = null
      if (e.touches.length === 0) {
        if (dragRef.current && touchRef.current) {
          const { id } = dragRef.current
          const body = bodiesRef.current.find((b) => b.id === id)
          if (body) body.dragging = false
          const el = nodeEls.current.get(id)
          if (el) el.classList.remove("dragging")

          // Double tap detection on touch devices
          const touch = e.changedTouches[0]
          if (touch) {
            const movedDist = Math.hypot(
              touch.clientX - touchRef.current.ox,
              touch.clientY - touchRef.current.oy,
            )
            const now = Date.now()
            const lastTap = lastTapRef.current

            if (
              lastTap &&
              lastTap.id === id &&
              now - lastTap.time < 320 &&
              movedDist < 12
            ) {
              lastTapRef.current = null
              focusNode(id)
            } else if (movedDist < 12) {
              lastTapRef.current = {
                id,
                time: now,
                x: touch.clientX,
                y: touch.clientY,
              }
            } else {
              lastTapRef.current = null
            }
          }

          dragRef.current = null
          latchNeighbors(id)
        }
        panRef.current = null
        touchRef.current = null
      }
    }

    container.addEventListener("wheel", handleNativeWheel, { passive: false })
    container.addEventListener("touchstart", handleNativeTouchStart, { passive: false })
    container.addEventListener("touchmove", handleNativeTouchMove, { passive: false })
    container.addEventListener("touchend", handleNativeTouchEnd, { passive: false })
    container.addEventListener("touchcancel", handleNativeTouchEnd, { passive: false })
    window.addEventListener("gesturestart", preventGesture, { passive: false })
    window.addEventListener("gesturechange", preventGesture, { passive: false })
    window.addEventListener("gestureend", preventGesture, { passive: false })

    return () => {
      container.removeEventListener("wheel", handleNativeWheel)
      container.removeEventListener("touchstart", handleNativeTouchStart)
      container.removeEventListener("touchmove", handleNativeTouchMove)
      container.removeEventListener("touchend", handleNativeTouchEnd)
      container.removeEventListener("touchcancel", handleNativeTouchEnd)
      window.removeEventListener("gesturestart", preventGesture)
      window.removeEventListener("gesturechange", preventGesture)
      window.removeEventListener("gestureend", preventGesture)
    }
  }, [zoomToward, updateTransform, screenToWorld, latchNeighbors, focusNode, isPrivacy])

  // ── Keyboard Shortcuts ───────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPrivacy) return

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
      } else if (e.key.toLowerCase() === "t") {
        toggleTheme()
      } else if (e.code === "Space") {
        e.preventDefault()
        const now = Date.now()
        const recent = spacePressTimestampsRef.current.filter((t) => now - t < 650)
        recent.push(now)
        spacePressTimestampsRef.current = recent

        if (recent.length >= 3) {
          spacePressTimestampsRef.current = []
          toggleSecretNode()
        } else {
          togglePhysics()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [zoomIn, zoomOut, fitAll, togglePhysics, toggleTheme, toggleSecretNode, isPrivacy])

  const normalizedPath = pathname.replace(/\/+$/, "") || "/"

  if (normalizedPath === "/privacy-policy") {
    return <PrivacyPolicyDirectory onNavigate={navigate} />
  }

  if (normalizedPath.startsWith("/privacy-policy/")) {
    const slug = normalizedPath.replace(/^\/privacy-policy\//, "")
    return <PrivacyPolicyView slug={slug} onNavigate={navigate} />
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden transition-colors duration-200"
      style={{ background: "var(--bg-canvas)", touchAction: "none" }}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
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
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          background: isDark
            ? "radial-gradient(ellipse 85% 85% at 50% 50%, transparent 35%, rgba(10,10,10,0.7) 100%)"
            : "radial-gradient(ellipse 85% 85% at 50% 50%, transparent 45%, rgba(0,0,0,0.06) 100%)",
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
        {PORTFOLIO_NODES.filter(
          (n) => n.id !== "profile" && (!n.secret || isSecretUnlocked),
        ).map((node) => {
          const body = bodiesRef.current.find((b) => b.id === node.id)
          const initX = body ? body.x - node.width / 2 : 0
          const initY = body ? body.y - node.height / 2 : 0
          const cardBg = isDark
            ? `rgba(${hexToRgb(node.color)}, .12)`
            : `rgba(255, 255, 255, 0.88)`
          const cardBorder = isDark
            ? `rgba(${hexToRgb(node.color)}, .18)`
            : `rgba(${hexToRgb(node.color)}, .35)`

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
                background: cardBg,
                borderColor: cardBorder,
                zIndex: 10,
              }}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              onDoubleClick={(e) => {
                e.stopPropagation()
                focusNode(node.id)
              }}
            >
              <NodeCardContent node={node} />
            </div>
          )
        })}
      </div>

      {/* Secret Node Unlock Toast */}
      {toastMessage && (
        <div
          className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300"
          style={{ touchAction: "none" }}
        >
          <div
            className="mono px-4 py-2 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-2 border"
            style={{
              background: "rgba(236, 72, 153, 0.95)",
              color: "#ffffff",
              borderColor: "rgba(255, 255, 255, 0.4)",
              boxShadow: "0 0 25px rgba(236, 72, 153, 0.6)",
              backdropFilter: "blur(8px)",
            }}
          >
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            {toastMessage}
          </div>
        </div>
      )}

      {/* HUD overlay */}
      <div style={{ zIndex: 50, position: "relative" }}>
        <HUD
          nodes={PORTFOLIO_NODES.filter(
            (n) => n.id !== "profile" && (!n.secret || isSecretUnlocked),
          )}
          profile={PORTFOLIO_NODES.find((n) => n.id === "profile")!}
          bonds={bonds}
          isPaused={isPaused}
          theme={theme}
          isMobile={isMobile}
          isCollapsed={isHudCollapsed}
          onExpand={() => setIsHudCollapsed(false)}
          onToggleTheme={toggleTheme}
          minimapRef={minimapRef}
          onFocusNode={(id) => focusNode(id)}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onFitAll={fitAll}
          onTogglePhysics={togglePhysics}
        />
      </div>
    </div>
  )
}
