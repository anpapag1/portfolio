import React from 'react';
import { TerminalData } from '../types/content';
import { Camera } from '../canvas/Camera';
import { cn } from '../utils/cn';

export interface MiniMapProps {
  terminals: TerminalData[];
  camera: Camera;
  onJumpTo: (x: number, y: number) => void;
  className?: string;
  width?: number;
  height?: number;
  worldSpan?: number;
}

export function worldToMiniMap(
  world: { x: number; y: number },
  mapSize = { width: 180, height: 130 },
  worldSpan = 3000
) {
  return {
    x: ((world.x + worldSpan / 2) / worldSpan) * mapSize.width,
    y: ((world.y + worldSpan / 2) / worldSpan) * mapSize.height,
  };
}

export function miniMapToWorld(
  mapPos: { x: number; y: number },
  mapSize = { width: 180, height: 130 },
  worldSpan = 3000
) {
  return {
    x: (mapPos.x / mapSize.width) * worldSpan - worldSpan / 2,
    y: (mapPos.y / mapSize.height) * worldSpan - worldSpan / 2,
  };
}

export const MiniMap: React.FC<MiniMapProps> = ({
  terminals,
  camera,
  onJumpTo,
  className,
  width = 180,
  height = 130,
  worldSpan = 3000,
}) => {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const target = miniMapToWorld({ x: clickX, y: clickY }, { width, height }, worldSpan);
    onJumpTo(target.x, target.y);
  };

  const camCenter = worldToMiniMap(camera.position, { width, height }, worldSpan);
  const viewWidth = Math.max(16, (camera.viewport.width / (camera.zoom * worldSpan)) * width);
  const viewHeight = Math.max(12, (camera.viewport.height / (camera.zoom * worldSpan)) * height);

  return (
    <div
      data-testid="minimap"
      role="region"
      aria-label="Canvas MiniMap Overview"
      onClick={handleClick}
      style={{ width: `${width}px`, height: `${height}px` }}
      className={cn(
        'hidden sm:block absolute top-4 right-4 bg-[#0a0a0a]/90 border border-white/15 rounded-lg overflow-hidden cursor-crosshair shadow-xl backdrop-blur-md z-30 select-none',
        className
      )}
    >
      {/* Grid crosshair center */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
        <div className="w-full h-px bg-white" />
        <div className="h-full w-px bg-white absolute" />
      </div>

      {/* Terminal markers */}
      {terminals.map((t) => {
        const pt = worldToMiniMap(t.position, { width, height }, worldSpan);
        return (
          <div
            key={t.id}
            data-testid={`minimap-marker-${t.id}`}
            title={t.title}
            className="absolute w-2 h-2 -translate-x-1 -translate-y-1 bg-accent/80 hover:bg-accent rounded-sm pointer-events-none transition-colors"
            style={{ left: `${pt.x}px`, top: `${pt.y}px` }}
          />
        );
      })}

      {/* Viewport boundary indicator */}
      <div
        data-testid="minimap-viewport"
        className="absolute border border-accent bg-accent/10 pointer-events-none transition-all"
        style={{
          position: 'absolute',
          left: `${camCenter.x - viewWidth / 2}px`,
          top: `${camCenter.y - viewHeight / 2}px`,
          width: `${viewWidth}px`,
          height: `${viewHeight}px`,
        }}
      />
    </div>
  );
};
