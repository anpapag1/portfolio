import React from 'react';
import { TerminalData } from '../types/content';
import { Camera } from '../canvas/Camera';
import { PhysicsEngine } from '../canvas/Physics';
import { cn } from '../utils/cn';

export interface MiniMapProps {
  terminals: TerminalData[];
  camera: Camera;
  physics?: PhysicsEngine;
  onJumpTo: (x: number, y: number) => void;
  className?: string;
  width?: number;
  height?: number;
  worldSpan?: number;
}

export function worldToMiniMap(
  world: { x: number; y: number },
  mapSize = { width: 180, height: 130 },
  worldSpan = 4800
) {
  const worldSpanY = worldSpan * (mapSize.height / mapSize.width);
  return {
    x: ((world.x + worldSpan / 2) / worldSpan) * mapSize.width,
    y: ((world.y + worldSpanY / 2) / worldSpanY) * mapSize.height,
  };
}

export function miniMapToWorld(
  mapPos: { x: number; y: number },
  mapSize = { width: 180, height: 130 },
  worldSpan = 4800
) {
  const worldSpanY = worldSpan * (mapSize.height / mapSize.width);
  return {
    x: (mapPos.x / mapSize.width) * worldSpan - worldSpan / 2,
    y: (mapPos.y / mapSize.height) * worldSpanY - worldSpanY / 2,
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
  worldSpan = 4800,
}) => {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const target = miniMapToWorld({ x: clickX, y: clickY }, { width, height }, worldSpan);
    onJumpTo(target.x, target.y);
  };

  // 1. Calculate true visible world bounds under current camera transform
  const worldTopLeft = camera.screenToWorld({ x: 0, y: 0 });
  const worldBottomRight = camera.screenToWorld({
    x: camera.viewport.width,
    y: camera.viewport.height,
  });

  const mapTopLeft = worldToMiniMap(worldTopLeft, { width, height }, worldSpan);
  const mapBottomRight = worldToMiniMap(worldBottomRight, { width, height }, worldSpan);

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
      {/* Grid crosshair center lines */}
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
            worldSpan
          );
          const pt2 = worldToMiniMap(
            { x: p2.x + 190, y: p2.y + 130 },
            { width, height },
            worldSpan
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
        const tl = worldToMiniMap(pos, { width, height }, worldSpan);
        const br = worldToMiniMap(
          { x: pos.x + t.size.width, y: pos.y + t.size.height },
          { width, height },
          worldSpan
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
