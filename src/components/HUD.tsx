import React from "react"
import { Minus, Plus, Maximize2, Play, Pause } from "lucide-react"
import type { NodeData, Bond } from "../types"

interface HUDProps {
  nodes: NodeData[]
  profile: NodeData
  bonds: Bond[]
  isPaused: boolean
  minimapRef: React.RefObject<HTMLCanvasElement>
  statsEls: React.MutableRefObject<{
    coords: HTMLSpanElement | null
    physics: HTMLSpanElement | null
    bondCount: HTMLSpanElement | null
  }>
  onFocusNode: (id: string) => void
  onZoomIn: () => void
  onZoomOut: () => void
  onFitAll: () => void
  onTogglePhysics: () => void
}

export function HUD({
  nodes,
  profile,
  isPaused,
  minimapRef,
  statsEls,
  onFocusNode,
  onZoomIn,
  onZoomOut,
  onFitAll,
  onTogglePhysics,
}: HUDProps) {
  const p = profile.content

  return (
    <div className="fixed inset-0 pointer-events-none p-4 sm:p-6 flex justify-between items-stretch z-50 h-full">
      {/* Left HUD Panel: Profile (Top) + Flex Spacer + Minimap & Controls (Bottom) */}
      <div className="hud-sidebar-left flex flex-col gap-2.5 w-[260px] sm:w-[280px] pointer-events-auto h-full">
        {/* Profile Card */}
        <div className="hud-panel p-4 flex flex-col">
          <div className="flex items-center gap-1.5 mb-2.5">
            <span className="mono text-[9px] tracking-[0.16em] text-[#555555]">
              {profile.label}
            </span>
            <span
              className="w-1 h-1 rounded-full opacity-70"
              style={{ background: profile.color }}
            />
          </div>

          <div className="text-[16px] sm:text-[17px] font-medium text-[#e5e5e5] leading-tight tracking-[-0.02em]">
            {p.name}
          </div>
          <div className="text-[11px] text-[#636363] mt-1 font-normal">
            {p.title} · {p.subtitle}
          </div>

          <div className="h-[1px] bg-white/[0.06] my-3" />

          <div className="mono text-[9.5px] text-[#555] tracking-[0.06em] mb-2">
            {p.location}
          </div>

          <p className="text-[11px] text-[#5a5a5a] leading-[1.65] m-0 font-normal">
            {p.bio}
          </p>

          <div className="flex items-center gap-1.5 mt-3.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] opacity-80" />
            <span className="mono text-[9px] text-[#525252] tracking-[0.08em]">
              {p.statusText}
            </span>
          </div>
        </div>

        {/* Flexible Spacer taking all available vertical space */}
        <div className="flex-1 min-h-[12px]" />

        {/* Minimap */}
        <div className="hud-panel p-2.5 flex flex-col items-center justify-center overflow-hidden">
          <canvas
            ref={minimapRef}
            width={240}
            height={110}
            className="w-full h-[110px] rounded-lg block"
          />
        </div>

        {/* Canvas Controls Toolbar */}
        <div className="hud-panel px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="icon-btn"
              onClick={onZoomOut}
              title="Zoom Out"
            >
              <Minus size={13} strokeWidth={2.2} />
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={onZoomIn}
              title="Zoom In"
            >
              <Plus size={13} strokeWidth={2.2} />
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={onFitAll}
              title="Fit All Nodes [F]"
            >
              <Maximize2 size={12} strokeWidth={2.2} />
            </button>
          </div>
          <button
            type="button"
            className={`icon-btn ${isPaused ? "active" : ""}`}
            onClick={onTogglePhysics}
            title={isPaused ? "Resume Physics [SPACE]" : "Pause Physics [SPACE]"}
          >
            {isPaused ? (
              <Play size={11} fill="currentColor" />
            ) : (
              <Pause size={11} fill="currentColor" />
            )}
          </button>
        </div>
      </div>

      {/* Right HUD Panel: Node Nav (Top) + Flex Spacer + System Stats (Bottom) */}
      <div className="hud-sidebar-right flex flex-col gap-2.5 w-[200px] sm:w-[220px] pointer-events-auto h-full">
        {/* Sitemap / Navigation Section */}
        <div className="hud-panel p-2.5 flex flex-col gap-1">
          <div className="mono text-[9px] tracking-[0.16em] text-[#555] px-2 py-1">
            NAVIGATE
          </div>
          {nodes.map((node) => (
            <div
              key={node.id}
              className="nav-item"
              onClick={() => onFocusNode(node.id)}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0 opacity-80"
                style={{ background: node.color }}
              />
              <span className="truncate">{node.label}</span>
            </div>
          ))}
        </div>

        {/* Flexible Spacer taking all available vertical space */}
        <div className="flex-1 min-h-[12px]" />

        {/* World Coordinates & Controls Help */}
        <div className="hud-panel p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[10px] mono">
            <span className="text-[#555]">WORLD</span>
            <span
              ref={(el) => {
                statsEls.current.coords = el
              }}
              className="text-[#888]"
            >
              0, 0
            </span>
          </div>

          <div className="h-[1px] bg-white/[0.05]" />

          <div className="space-y-1.5 text-[9.5px] mono">
            <div className="flex justify-between text-[#444]">
              <span>PINCH</span>
              <span className="text-[#333]">zoom</span>
            </div>
            <div className="flex justify-between text-[#444]">
              <span>TWO-FINGER</span>
              <span className="text-[#333]">pan</span>
            </div>
            <div className="flex justify-between text-[#444]">
              <span>DRAG</span>
              <span className="text-[#333]">move node</span>
            </div>
            <div className="flex justify-between text-[#444]">
              <span>DBL-CLICK</span>
              <span className="text-[#333]">focus node</span>
            </div>
            <div className="flex justify-between text-[#444]">
              <span>[ + ] / [ − ]</span>
              <span className="text-[#333]">zoom step</span>
            </div>
            <div className="flex justify-between text-[#444]">
              <span>[ F ]</span>
              <span className="text-[#333]">fit all</span>
            </div>
            <div className="flex justify-between text-[#444]">
              <span>[ SPACE ]</span>
              <span className="text-[#333]">pause</span>
            </div>
          </div>

          <div className="h-[1px] bg-white/[0.05]" />

          <div className="flex items-center justify-between text-[9.5px] mono pt-0.5">
            <div className="flex items-center gap-1.5">
              <span className="physics-dot bg-[#22c55e]" />
              <span
                ref={(el) => {
                  statsEls.current.physics = el
                }}
                className="text-[#22c55e]"
              >
                STABLE
              </span>
            </div>
            <div className="text-[#444]">
              BONDS:{" "}
              <span
                ref={(el) => {
                  statsEls.current.bondCount = el
                }}
                className="text-[#777]"
              >
                0
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
