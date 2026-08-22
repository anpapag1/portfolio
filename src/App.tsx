import { useState, useEffect, useRef, useCallback, type PointerEvent } from 'react';
import { Camera } from './canvas/Camera';
import { DotGrid } from './canvas/DotGrid';
import { PhysicsEngine } from './canvas/Physics';
import { Terminal } from './terminals/Terminal';
import { MiniMap } from './ui/MiniMap';
import { HelpOverlay } from './ui/HelpOverlay';
import { loadContent } from './utils/content';
import { PortfolioContent } from './types/content';
import { Map as MapIcon, HelpCircle, RotateCcw, Maximize2, X } from 'lucide-react';

export default function App() {
  const [content, setContent] = useState<PortfolioContent | null>(null);
  const [camera] = useState(() => new Camera({ x: 0, y: 0 }, 1.0, {
    width: typeof window !== 'undefined' ? window.innerWidth : 800,
    height: typeof window !== 'undefined' ? window.innerHeight : 600,
  }));
  const [dotGrid] = useState(() => new DotGrid());
  const [physics] = useState(() => new PhysicsEngine());
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isMobileMapOpen, setIsMobileMapOpen] = useState(false);
  const [focusedTerminalId, setFocusedTerminalId] = useState<string | null>(null);
  const [, setRenderTick] = useState(0);

  const [isSpaceActive, setIsSpaceActive] = useState(false);

  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingCanvas = useRef(false);
  const isSpacePressed = useRef(false);
  const dragStartPoint = useRef({ x: 0, y: 0 });
  const draggedParticleId = useRef<string | null>(null);
  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const initialPinchDistance = useRef<number | null>(null);
  const initialPinchZoom = useRef<number>(1.0);
  const hasUserNavigated = useRef(false);

  // Helper to compute bounding box of all terminals and fit camera to view
  const fitAllTerminals = useCallback((padding = 130) => {
    if (!content || content.terminals.length === 0) return;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const t of content.terminals) {
      const p = physics.getParticle(t.id);
      const pos = p ? p.position : t.position;
      const w = t.size.width || 400;
      const h = t.size.height || 260;

      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + w);
      maxY = Math.max(maxY, pos.y + h);
    }

    if (isFinite(minX) && isFinite(maxX)) {
      camera.fitToBounds({ minX, minY, maxX, maxY }, padding);
    }
  }, [camera, content, physics]);

  // Load content, dynamically synchronize physics particles, and auto-fit viewport
  useEffect(() => {
    let isMounted = true;
    loadContent().then((data) => {
      if (!isMounted) return;
      setContent(data);
      physics.syncParticles(data.terminals);

      if (!hasUserNavigated.current) {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        data.terminals.forEach((t) => {
          const p = physics.getParticle(t.id);
          const pos = p ? p.position : t.position;
          const w = t.size.width || 400;
          const h = t.size.height || 260;

          minX = Math.min(minX, pos.x);
          minY = Math.min(minY, pos.y);
          maxX = Math.max(maxX, pos.x + w);
          maxY = Math.max(maxY, pos.y + h);
        });

        if (isFinite(minX) && isFinite(maxX)) {
          camera.fitToBounds({ minX, minY, maxX, maxY }, 100);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [camera, physics]);

  // Reset camera, positions & fit to view
  const handleResetLayout = useCallback(() => {
    hasUserNavigated.current = false;
    if (content) {
      content.terminals.forEach((t) => {
        try {
          localStorage.removeItem(`portfolio:pos:${t.id}`);
        } catch {
          // ignore
        }
        physics.setPosition(t.id, t.position);
        physics.unpin(t.id);
      });
      physics.resetBonds();
    }
    fitAllTerminals();
  }, [content, fitAllTerminals, physics]);

  // Global keyboard shortcuts (including Spacebar Hand Tool)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName)) return;

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        isSpacePressed.current = true;
        setIsSpaceActive(true);
      } else if (e.key === '?') {
        e.preventDefault();
        setIsHelpOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsHelpOpen(false);
        setIsMobileMapOpen(false);
      } else if (e.key === '0') {
        handleResetLayout();
      } else if (e.key.toLowerCase() === 'f') {
        hasUserNavigated.current = false;
        fitAllTerminals(130);
      } else if (e.key === '+' || e.key === '=') {
        hasUserNavigated.current = true;
        camera.setZoom(camera.zoom * 1.15);
      } else if (e.key === '-' || e.key === '_') {
        hasUserNavigated.current = true;
        camera.setZoom(camera.zoom * 0.85);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressed.current = false;
        setIsSpaceActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [camera, fitAllTerminals, handleResetLayout]);

  // Non-passive wheel event listener for ultra-smooth Trackpad 2-finger pan & pinch zoom
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const onWheelNative = (e: globalThis.WheelEvent) => {
      e.preventDefault();
      hasUserNavigated.current = true;

      const cursor = { x: e.clientX, y: e.clientY };

      // 1. Trackpad Pinch-to-Zoom OR Ctrl/Cmd + Mouse Wheel
      if (e.ctrlKey || e.metaKey) {
        const zoomDelta = -e.deltaY * 0.01;
        camera.zoomAt(cursor, zoomDelta);
      }
      // 2. Discrete physical mouse wheel scroll
      else if (e.deltaMode !== 0 || (Math.abs(e.deltaX) === 0 && Math.abs(e.deltaY) >= 40)) {
        const zoomDelta = -Math.sign(e.deltaY) * 0.12;
        camera.zoomAt(cursor, zoomDelta);
      }
      // 3. Trackpad 2-Finger Smooth Panning (continuous pixel deltas)
      else {
        camera.pan(e.deltaX, e.deltaY);
      }
    };

    root.addEventListener('wheel', onWheelNative, { passive: false });
    return () => root.removeEventListener('wheel', onWheelNative);
  }, [camera]);

  // Main Canvas & Physics animation loop synced with rAF
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let frameCount = 0;

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      physics.update(dt || 1 / 60);

      // Continuously auto-frame settling nodes during initial load if user hasn't navigated
      if (!hasUserNavigated.current && frameCount < 240 && frameCount % 2 === 0) {
        fitAllTerminals(130);
      }
      frameCount++;

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          dotGrid.render(ctx, camera);
          physics.renderConnections(ctx, (v) => camera.worldToScreen(v));
        }
      }

      setRenderTick((t) => (t + 1) % 1000000);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [camera, dotGrid, fitAllTerminals, physics]);

  // Resize canvas and camera viewport on window resize
  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      if (canvasRef.current) {
        canvasRef.current.width = width;
        canvasRef.current.height = height;
      }
      camera.setViewport(width, height);
      if (!hasUserNavigated.current) {
        fitAllTerminals();
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [camera, fitAllTerminals]);

  // Pointer interactions for Canvas pan, pinch zoom & middle-click
  const handlePointerDown = (e: PointerEvent) => {
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const target = e.target as HTMLElement;
    const isMiddleClick = e.button === 1;
    const isCanvasBg = target.tagName === 'CANVAS' || target.dataset.canvasBackground === 'true';

    if (isMiddleClick || isSpacePressed.current || isCanvasBg) {
      if (activePointers.current.size === 1 || isMiddleClick || isSpacePressed.current) {
        isDraggingCanvas.current = true;
        dragStartPoint.current = { x: e.clientX, y: e.clientY };
      } else if (activePointers.current.size === 2) {
        hasUserNavigated.current = true;
        const points = Array.from(activePointers.current.values());
        const dx = points[0].x - points[1].x;
        const dy = points[0].y - points[1].y;
        initialPinchDistance.current = Math.sqrt(dx * dx + dy * dy);
        initialPinchZoom.current = camera.zoom;
      }
    }
  };

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (activePointers.current.has(e.pointerId)) {
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (draggedParticleId.current) {
      hasUserNavigated.current = true;
      const worldPos = camera.screenToWorld({ x: e.clientX, y: e.clientY });
      physics.setPosition(draggedParticleId.current, worldPos);
      try {
        localStorage.setItem(
          `portfolio:pos:${draggedParticleId.current}`,
          JSON.stringify(worldPos)
        );
      } catch {
        // ignore write error
      }
    } else if (activePointers.current.size === 2 && initialPinchDistance.current !== null) {
      hasUserNavigated.current = true;
      const points = Array.from(activePointers.current.values());
      const dx = points[0].x - points[1].x;
      const dy = points[0].y - points[1].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (initialPinchDistance.current > 0) {
        const scale = dist / initialPinchDistance.current;
        const center = {
          x: (points[0].x + points[1].x) / 2,
          y: (points[0].y + points[1].y) / 2,
        };
        const targetZoom = initialPinchZoom.current * scale;
        camera.zoomAt(center, (targetZoom - camera.zoom) / camera.zoom);
      }
    } else if (isDraggingCanvas.current) {
      hasUserNavigated.current = true;
      const dx = e.clientX - dragStartPoint.current.x;
      const dy = e.clientY - dragStartPoint.current.y;
      camera.pan(dx, dy);
      dragStartPoint.current = { x: e.clientX, y: e.clientY };
    }
  }, [camera, physics]);

  const handlePointerUp = (e: PointerEvent) => {
    activePointers.current.delete(e.pointerId);

    if (activePointers.current.size < 2) {
      initialPinchDistance.current = null;
    }

    if (draggedParticleId.current) {
      physics.unpin(draggedParticleId.current);
      draggedParticleId.current = null;
    }

    if (activePointers.current.size === 0) {
      isDraggingCanvas.current = false;
    }
  };

  const handleTerminalDragStart = (id: string, e: PointerEvent) => {
    if (isSpacePressed.current || e.button === 1) {
      return; // allow spacebar/middle-click pan over terminals
    }
    e.stopPropagation();
    hasUserNavigated.current = true;
    draggedParticleId.current = id;
    physics.pin(id);
    setFocusedTerminalId(id);
  };

  const terminalsToRender = content?.terminals || [];

  const handleJumpTo = (x: number, y: number) => {
    hasUserNavigated.current = true;
    camera.position = { x, y };
  };

  const scrollToMobileTerminal = (id: string) => {
    const elem = document.getElementById(`mobile-terminal-${id}`);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setIsMobileMapOpen(false);
  };

  return (
    <main
      ref={rootRef}
      data-testid="app-root"
      data-canvas-background="true"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`relative w-screen h-screen overflow-hidden bg-bg select-none touch-none ${
        isSpaceActive ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
    >
      {/* HTML5 Canvas Grid & Spring Mesh Layer */}
      <canvas
        ref={canvasRef}
        data-testid="canvas-element"
        className={`absolute inset-0 block w-full h-full ${
          isSpaceActive ? 'cursor-grab active:cursor-grabbing' : 'cursor-grab active:cursor-grabbing'
        }`}
      />

      {/* Floating Terminals Layer (Desktop Canvas Mode - sm and up) */}
      <div
        data-testid="desktop-terminals-layer"
        className="hidden sm:block absolute inset-0 pointer-events-none"
      >
        {terminalsToRender.map((t) => {
          const particle = physics.getParticle(t.id);
          const pos = particle ? particle.position : t.position;
          const screenPos = camera.worldToScreen(pos);

          return (
            <div
              key={t.id}
              id={`terminal-${t.id}`}
              className="pointer-events-auto"
            >
              <Terminal
                data={t}
                screenPos={screenPos}
                zoom={camera.zoom}
                onDragStart={handleTerminalDragStart}
                isFocused={focusedTerminalId === t.id}
                onFocus={() => setFocusedTerminalId(t.id)}
              />
            </div>
          );
        })}
      </div>

      {/* Mobile Stack Fallback Mode (< 640px viewport) */}
      <div
        data-testid="mobile-terminals-layer"
        className="sm:hidden absolute inset-0 overflow-y-auto p-4 space-y-4 pb-24 select-text"
      >
        <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs text-muted">
          <span className="font-semibold text-accent uppercase tracking-wider">
            Terminal Portfolio
          </span>
          <span>{terminalsToRender.length} modules</span>
        </div>

        {terminalsToRender.map((t) => (
          <div key={t.id} id={`mobile-terminal-${t.id}`} className="relative">
            <Terminal
              data={t}
              screenPos={{ x: 0, y: 0 }}
              zoom={1.0}
              isFocused={focusedTerminalId === t.id}
              onFocus={() => setFocusedTerminalId(t.id)}
            />
          </div>
        ))}
      </div>

      {/* Desktop MiniMap Overlay */}
      <MiniMap
        terminals={terminalsToRender}
        camera={camera}
        physics={physics}
        onJumpTo={handleJumpTo}
      />

      {/* Bottom Floating Control Toolbar */}
      <nav
        aria-label="Floating Controls"
        className="absolute bottom-4 right-4 flex items-center space-x-2 z-40"
      >
        <button
          type="button"
          data-testid="fit-view-btn"
          onClick={() => {
            hasUserNavigated.current = false;
            fitAllTerminals(130);
          }}
          className="hidden sm:flex items-center justify-center w-9 h-9 bg-[#0f0f0f]/90 border border-white/15 rounded-full text-muted hover:text-accent shadow-lg backdrop-blur-md transition-colors"
          title="Fit All Terminals to View (F)"
          aria-label="Fit All Terminals to View"
        >
          <Maximize2 size={15} />
        </button>

        <button
          type="button"
          data-testid="reset-cam-btn"
          onClick={handleResetLayout}
          className="hidden sm:flex items-center justify-center w-9 h-9 bg-[#0f0f0f]/90 border border-white/15 rounded-full text-muted hover:text-accent shadow-lg backdrop-blur-md transition-colors"
          title="Reset Layout & Camera (0)"
          aria-label="Reset Layout & Camera"
        >
          <RotateCcw size={16} />
        </button>

        <button
          type="button"
          data-testid="help-toggle-btn"
          onClick={() => setIsHelpOpen((prev) => !prev)}
          className="flex items-center justify-center w-9 h-9 bg-[#0f0f0f]/90 border border-white/15 rounded-full text-muted hover:text-accent shadow-lg backdrop-blur-md transition-colors"
          title="Keyboard Shortcuts (?)"
          aria-label="Keyboard Shortcuts"
        >
          <HelpCircle size={18} />
        </button>

        <button
          type="button"
          data-testid="mobile-map-toggle-btn"
          onClick={() => setIsMobileMapOpen(true)}
          className="sm:hidden flex items-center space-x-1.5 px-3 py-2 bg-accent text-bg font-bold rounded-full text-xs shadow-lg hover:bg-accent/90 transition-colors"
          aria-label="Open Map Overview"
        >
          <MapIcon size={14} />
          <span>Map</span>
        </button>
      </nav>

      {/* Mobile Map Modal Dialog */}
      {isMobileMapOpen && (
        <div
          data-testid="mobile-map-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Map"
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col p-4 sm:hidden"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/15 text-xs">
            <div className="flex items-center space-x-2 text-accent font-bold">
              <MapIcon size={16} />
              <span className="uppercase tracking-wider">Terminal Map</span>
            </div>
            <button
              type="button"
              data-testid="mobile-map-close-btn"
              onClick={() => setIsMobileMapOpen(false)}
              className="text-muted hover:text-white p-1 rounded"
              aria-label="Close Map"
            >
              <X size={18} />
            </button>
          </div>

          <div className="py-3 flex justify-center">
            <MiniMap
              terminals={terminalsToRender}
              camera={camera}
              onJumpTo={handleJumpTo}
              className="!static !block"
              width={260}
              height={180}
            />
          </div>

          <div className="text-[11px] text-muted mb-2 font-mono">
            Jump to section:
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-xs pr-1">
            {terminalsToRender.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => scrollToMobileTerminal(t.id)}
                className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-accent/15 border border-white/10 text-fg hover:text-accent transition-colors flex items-center justify-between"
              >
                <span>{t.title}</span>
                <span className="text-[10px] text-muted">View ›</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Global Keyboard Shortcut Help Modal */}
      <HelpOverlay isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </main>
  );
}
