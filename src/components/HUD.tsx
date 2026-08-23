import React, { useState } from "react"
import {
  Minus,
  Plus,
  Maximize2,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import type { NodeData, Bond } from "../types"

interface HUDProps {
  nodes: NodeData[]
  profile: NodeData
  bonds: Bond[]
  isPaused: boolean
  isMobile?: boolean
  isCollapsed?: boolean
  onExpand?: () => void
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
  isMobile = false,
  isCollapsed = false,
  onExpand,
  minimapRef,
  statsEls,
  onFocusNode,
  onZoomIn,
  onZoomOut,
  onFitAll,
  onTogglePhysics,
}: HUDProps) {
  const p = profile.content || {}
  const [profileExpanded, setProfileExpanded] = useState(false)

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex flex-col justify-between overflow-hidden">
      {/* ========================================================================= */}
      {/* MOBILE LAYOUT (< md)                                                      */}
      {/* ========================================================================= */}
      <div className="md:hidden flex flex-col justify-between h-full p-3 pointer-events-none">
        {/* Top: Full-Width Collapsible Profile Card */}
        <div className="pointer-events-auto max-w-[420px] w-full mx-auto">
          <div
            className="hud-panel p-3.5 flex flex-col transition-all duration-200 ease-out shadow-2xl"
            style={{
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
              borderRadius: 20,
            }}
          >
            {/* Header row: Label & expand button */}
            <div
              className="flex items-center justify-between cursor-pointer select-none"
              onClick={() => setProfileExpanded((e) => !e)}
            >
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="mono text-[8.5px] tracking-[0.16em] text-[#555]">
                    {profile.label || "PROFILE"}
                  </span>
                  <span
                    className="w-1 h-1 rounded-full opacity-70"
                    style={{ background: profile.color || "#4ade80" }}
                  />
                </div>
                <div className="text-[14.5px] font-medium text-[#e5e5e5] leading-tight tracking-[-0.01em] truncate">
                  {p.name}
                </div>
                <div className="mono text-[9.5px] text-[#737373] mt-0.5 truncate">
                  {p.title}
                  {p.location && (
                    <span className="text-[#484848]"> · {p.location}</span>
                  )}
                </div>
              </div>

              {/* Chevron Toggle Button */}
              <button
                type="button"
                className="w-7 h-7 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#888] hover:text-[#eee] transition-colors flex-shrink-0 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  setProfileExpanded((ex) => !ex)
                }}
                aria-label={profileExpanded ? "Collapse Bio" : "Expand Bio"}
              >
                {profileExpanded ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </button>
            </div>

            {/* Expanded Content Dropdown */}
            {profileExpanded && !isCollapsed && (
              <div className="mt-2.5 pt-2.5 border-t border-white/[0.06] animate-in fade-in slide-in-from-top-1 duration-150">
                {p.bio && (
                  <p className="text-[11px] text-[#737373] leading-[1.6] m-0 mb-3">
                    {p.bio}
                  </p>
                )}

                {p.statusText && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#4ade80]/[0.06] border border-[#4ade80]/[0.16]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] shadow-[0_0_6px_#4ade80] flex-shrink-0" />
                    <span className="mono text-[8.5px] text-[#86efac]">
                      {p.statusText}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row: Bottom-Left Sitemap & Bottom-Right Controls / MiniMap */}
        <div className="flex items-end justify-between w-full pointer-events-none gap-2">
          {/* Bottom Left: Sitemap Panel OR Sliver */}
          {isCollapsed ? (
            <div
              className="hud-panel pointer-events-auto px-3 py-1.5 flex items-center gap-1.5 shadow-xl cursor-pointer hover:bg-white/[0.08] active:scale-95 transition-all"
              style={{ borderRadius: 12 }}
              onClick={(e) => {
                e.stopPropagation()
                onExpand?.()
              }}
              title="Expand Sitemap"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] opacity-80" />
              <span className="mono text-[8.5px] tracking-[0.14em] text-[#888] font-medium">
                SITEMAP ▲
              </span>
            </div>
          ) : (
            <div
              className="hud-panel pointer-events-auto p-2 flex flex-col gap-1 w-[130px] sm:w-[142px] shadow-2xl transition-all duration-200"
              style={{ borderRadius: 16, maxHeight: "calc(100vh - 180px)" }}
            >
              <div className="mono text-[8px] tracking-[0.16em] text-[#555] px-1.5 py-0.5 font-medium">
                SITEMAP
              </div>
              <div className="flex flex-col gap-0.5 overflow-y-auto max-h-[230px] pr-0.5">
                {nodes.map((node) => (
                  <div
                    key={node.id}
                    role="button"
                    tabIndex={0}
                    className="nav-item !py-1 !px-2 !text-[10px] sm:!text-[10.5px] !gap-2 rounded-md leading-tight"
                    onClick={(e) => {
                      e.stopPropagation()
                      onFocusNode(node.id)
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0 opacity-80"
                      style={{ background: node.color }}
                    />
                    <span className="truncate">{node.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Right: Floating Controls + (MiniMap when not collapsed) */}
          <div className="flex flex-col gap-1.5 items-end pointer-events-none">
            {/* Minimal Controls Row without background */}
            <div className="pointer-events-auto flex items-center justify-end gap-1.5 px-0.5">
              <button
                type="button"
                className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-[#888] hover:text-[#eee] active:scale-95 transition-all shadow-lg cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  onZoomOut()
                }}
                title="Zoom Out"
                aria-label="Zoom Out"
              >
                <Minus size={12} strokeWidth={2.2} />
              </button>
              <button
                type="button"
                className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-[#888] hover:text-[#eee] active:scale-95 transition-all shadow-lg cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  onZoomIn()
                }}
                title="Zoom In"
                aria-label="Zoom In"
              >
                <Plus size={12} strokeWidth={2.2} />
              </button>
              <button
                type="button"
                className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-[#888] hover:text-[#eee] active:scale-95 transition-all shadow-lg cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  onFitAll()
                }}
                title="Fit All"
                aria-label="Fit All"
              >
                <Maximize2 size={11} strokeWidth={2.2} />
              </button>
              <button
                type="button"
                className={`w-7 h-7 rounded-full ${
                  isPaused
                    ? "bg-[#4ade80]/[0.2] text-[#4ade80] border-[#4ade80]/[0.4]"
                    : "bg-white/[0.06] text-[#888] hover:text-[#eee] border-white/[0.08]"
                } border flex items-center justify-center active:scale-95 transition-all shadow-lg cursor-pointer`}
                onClick={(e) => {
                  e.stopPropagation()
                  onTogglePhysics()
                }}
                title={isPaused ? "Resume Physics" : "Pause Physics"}
                aria-label={isPaused ? "Resume Physics" : "Pause Physics"}
              >
                {isPaused ? (
                  <Play size={10} fill="currentColor" />
                ) : (
                  <Pause size={10} fill="currentColor" />
                )}
              </button>
            </div>

            {/* MiniMap Radar Box (hidden when in focus collapsed mode) */}
            {!isCollapsed && (
              <div
                className="hud-panel pointer-events-auto p-2 flex flex-col items-center justify-center overflow-hidden w-[140px] sm:w-[160px] shadow-xl transition-all duration-200"
                style={{ borderRadius: 16 }}
              >
                <canvas
                  ref={isMobile ? minimapRef : undefined}
                  className="w-full aspect-[16/10] rounded-lg block"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP LAYOUT (>= md)                                                    */}
      {/* ========================================================================= */}
      <div className="hidden md:flex justify-between items-stretch p-4 sm:p-6 w-full h-full pointer-events-none">
        {/* Left Sidebar: Profile (Top) + Spacer + Minimap & Toolbar (Bottom) */}
        <div className="hud-sidebar-left flex flex-col gap-2.5 w-[260px] sm:w-[280px] pointer-events-auto h-full">
          {/* Profile Card */}
          <div className="hud-panel p-4 flex flex-col">
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="mono text-[9px] tracking-[0.16em] text-[#555555]">
                {profile.label || "PROFILE"}
              </span>
              <span
                className="w-1 h-1 rounded-full opacity-70"
                style={{ background: profile.color || "#4ade80" }}
              />
            </div>

            <div className="text-[16px] sm:text-[17px] font-medium text-[#e5e5e5] leading-tight tracking-[-0.02em]">
              {p.name}
            </div>
            <div className="mono text-[10px] text-[#737373] mt-1 font-normal">
              {p.title}
              {p.location && (
                <span className="text-[#484848]"> · {p.location}</span>
              )}
            </div>

            <div className="h-[1px] bg-white/[0.06] my-3" />

            <p className="text-[11px] text-[#666] leading-[1.65] m-0 font-normal">
              {p.bio}
            </p>

            {p.statusText && (
              <div className="flex items-center gap-1.5 mt-3.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] shadow-[0_0_6px_#4ade80] flex-shrink-0" />
                <span className="mono text-[9px] text-[#86efac]">
                  {p.statusText}
                </span>
              </div>
            )}
          </div>

          {/* Flexible Spacer */}
          <div className="flex-1 min-h-[12px]" />

          {/* Minimap */}
          <div className="hud-panel p-2.5 flex flex-col items-center justify-center overflow-hidden">
            <canvas
              ref={!isMobile ? minimapRef : undefined}
              className="w-full aspect-[16/8] rounded-lg block"
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
              title={
                isPaused ? "Resume Physics [SPACE]" : "Pause Physics [SPACE]"
              }
            >
              {isPaused ? (
                <Play size={11} fill="currentColor" />
              ) : (
                <Pause size={11} fill="currentColor" />
              )}
            </button>
          </div>
        </div>

        {/* Right Sidebar: Sitemap (Top) + Spacer + System Stats & Help (Bottom) */}
        <div className="hud-sidebar-right flex flex-col gap-2.5 w-[200px] sm:w-[220px] pointer-events-auto h-full">
          {/* Sitemap / Navigation Section */}
          <div className="hud-panel p-2.5 flex flex-col gap-1">
            <div className="mono text-[9px] tracking-[0.16em] text-[#555] px-2 py-1">
              NAVIGATE
            </div>
            {nodes.map((node) => (
              <div
                key={node.id}
                role="button"
                tabIndex={0}
                className="nav-item"
                onClick={(e) => {
                  e.stopPropagation()
                  onFocusNode(node.id)
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0 opacity-80"
                  style={{ background: node.color }}
                />
                <span className="truncate">{node.label}</span>
              </div>
            ))}
          </div>

          {/* Flexible Spacer */}
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
    </div>
  )
}
