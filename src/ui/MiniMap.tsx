import React from 'react';
import { TerminalData } from '../types/content';
import { Camera } from '../canvas/Camera';
import { PhysicsEngine } from '../canvas/Physics';
import { cn } from '../utils/cn';

export interface MiniMapBounds {
  centerX: number;
  centerY: number;
  spanX: number;
  spanY: number;
}

export interface MiniMapProps {
  terminals: TerminalData[];
  camera: Camera;
  physics?: PhysicsEngine;
  onJumpTo: (x: number, y: number) => void;
  className?: string;
  width?: number;
  height?: number;
}

/**
 * Dynamically computes bounding area for the minimap so that all terminal nodes
 * AND the camera viewport remain comfortably visible and centered.
 */
export function calculateMiniMapBounds(
  terminals: TerminalData[],
  camera?: Camera,
  physics?: PhysicsEngine,
  mapSize = { width: 180, height: 130 }
): MiniMapBounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  // 1. Include all terminal node cards (at live positions)
  if (terminals.length > 0) {
    for (const t of terminals) {
      const p = physics?.getParticle(t.id);
      const pos = p ? p.position : t.position;
      const w = t.size.width || 400;
      const h = t.size.height || 260;

      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + w);
      maxY = Math.max(maxY, pos.y + h);
    }
  } else {
    minX = -1000;
    maxX = 1000;
    minY = -750;
    maxY = 750;
  }

  // 2. Include visible camera viewport bounds
  if (camera) {
    const camTL = camera.screenToWorld({ x: 0, y: 0 });
    const camBR = camera.screenToWorld({ x: camera.viewport.width, y: camera.viewport.height });
    minX = Math.min(minX, camTL.x, camBR.x);
    maxX = Math.max(maxX, camTL.x, camBR.x);
    minY = Math.min(minY, camTL.y, camBR.y);
    maxY = Math.max(maxY, camTL.y, camBR.y);
  }

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  // Add generous safety padding so cards never touch the minimap border
  const contentWidth = Math.max(1600, maxX - minX + 500);
  const contentHeight = Math.max(1200, maxY - minY + 400);

  const aspect = mapSize.width / mapSize.height;
  let spanX = contentWidth;
  let spanY = contentHeight;

  if (spanX / spanY > aspect) {
    spanY = spanX / aspect;
  } else {
    spanX = spanY * aspect;
  }

  return { centerX, centerY, spanX, spanY };
}

export function worldToMiniMap(
  world: { x: number; y: number },
  mapSize = { width: 180, height: 130 },
  bounds: MiniMapBounds = { centerX: 0, centerY: 0, spanX: 3400, spanY: 2455.5 }
) {
  return {
    x: ((world.x - bounds.centerX) / bounds.spanX + 0.5) * mapSize.width,
    y: ((world.y - bounds.centerY) / bounds.spanY + 0.5) * mapSize.height,
  };
}

export function miniMapToWorld(
  mapPos: { x: number; y: number },
  mapSize = { width: 180, height: 130 },
  bounds: MiniMapBounds = { centerX: 0, centerY: 0, spanX: 3400, spanY: 2455.5 }
) {
  return {
    x: (mapPos.x / mapSize.width - 0.5) * bounds.spanX + bounds.centerX,
    y: (mapPos.y / mapSize.height - 0.5) * bounds.spanY + bounds.centerY,
  };
}

export const MiniMap: React.FC<MiniMapProps> = ({
  terminals,
  camera,
  physics,
  onJumpTo,
  className,
  width = 180,
  height = 130,
}) => {
  // Compute dynamic responsive bounds centered on active nodes and viewport
  const bounds = calculateMiniMapBounds(terminals, camera, physics, { width, height });

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const target = miniMapToWorld({ x: clickX, y: clickY }, { width, height }, bounds);
    onJumpTo(target.x, target.y);
  };

  // 1. Calculate true visible world bounds under current camera transform
  const worldTopLeft = camera.screenToWorld({ x: 0, y: 0 });
  const worldBottomRight = camera.screenToWorld({
    x: camera.viewport.width,
    y: camera.viewport.height,
  });

  const mapTopLeft = worldToMiniMap(worldTopLeft, { width, height }, bounds);
  const mapBottomRight = worldToMiniMap(worldBottomRight, { width, height }, bounds);

  const viewLeft = Math.min(mapTopLeft.x, mapBottomRight.x);
  const viewTop = Math.min(mapTopLeft.y, mapBottomRight.y);
  const viewWidth = Math.max(8, Math.abs(mapBottomRight.x - mapTopLeft.x));
  const viewHeight = Math.max(6, Math.abs(mapBottomRight.y - mapTopLeft.y));

  const latchedEdges = physics ? physics.getLatchedEdges() : [];

  return (
    <div
      data-testid="minimap"
      role="region"
      aria-label="Canvas MiniMap Overview"
      onClick={handleClick}
      style={{ width: `${width}px`, height: `${height}px` }}
      className={cn(
        'hidden sm:block absolute top-4 right-4 bg-[#0a0a0a]/90 border border-white/15 rounded-lg overflow-hidden cursor-crosshair shadow-2xl backdrop-blur-md z-30 select-none',
        className
      )}
    >
      {/* Dynamic grid crosshair center lines */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
        <div className="w-full h-px bg-white" />
        <div className="h-full w-px bg-white absolute" />
      </div>

      {/* Latched Edge Connection Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
        {latchedEdges.map((edge) => {
          const p1 = physics?.getParticle(edge.nodeAId)?.position;
          const p2 = physics?.getParticle(edge.nodeBId)?.position;
          if (!p1 || !p2 || !isFinite(p1.x) || !isFinite(p2.x)) return null;

          const pt1 = worldToMiniMap(
            { x: p1.x + 190, y: p1.y + 130 },
            { width, height },
            bounds
          );
          const pt2 = worldToMiniMap(
            { x: p2.x + 190, y: p2.y + 130 },
            { width, height },
            bounds
          );

          if (!isFinite(pt1.x) || !isFinite(pt2.x)) return null;

          return (
            <line
              key={edge.id}
              x1={pt1.x}
              y1={pt1.y}
              x2={pt2.x}
              y2={pt2.y}
              stroke="#00d4aa"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          );
        })}
      </svg>

      {/* Real-time Terminal Node Markers */}
      {terminals.map((t) => {
        const particle = physics?.getParticle(t.id);
        const pos = particle ? particle.position : t.position;
        const tl = worldToMiniMap(pos, { width, height }, bounds);
        const br = worldToMiniMap(
          { x: pos.x + t.size.width, y: pos.y + t.size.height },
          { width, height },
          bounds
        );

        const nodeW = Math.max(6, br.x - tl.x);
        const nodeH = Math.max(4, br.y - tl.y);

        return (
          <div
            key={t.id}
            data-testid={`minimap-marker-${t.id}`}
            title={t.title}
            className="absolute bg-white/20 border border-accent/60 rounded-[2px] pointer-events-none transition-transform"
            style={{
              position: 'absolute',
              left: `${tl.x}px`,
              top: `${tl.y}px`,
              width: `${nodeW}px`,
              height: `${nodeH}px`,
            }}
          >
            <div className="w-1 h-1 rounded-full bg-accent absolute top-0.5 left-0.5 opacity-90" />
          </div>
        );
      })}

      {/* Viewport boundary indicator */}
      <div
        data-testid="minimap-viewport"
        className="absolute border border-accent bg-accent/15 pointer-events-none rounded-[1px] shadow-[0_0_8px_rgba(0,212,170,0.25)]"
        style={{
          position: 'absolute',
          left: `${viewLeft}px`,
          top: `${viewTop}px`,
          width: `${viewWidth}px`,
          height: `${viewHeight}px`,
        }}
      />
    </div>
  );
};
