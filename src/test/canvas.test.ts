import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Camera } from '../canvas/Camera';
import { DotGrid } from '../canvas/DotGrid';
import { CanvasEngine } from '../canvas/CanvasEngine';

describe('Camera & Coordinate Transformations', () => {
  it('converts world coordinates to screen coordinates at 1.0 zoom centered at origin', () => {
    const camera = new Camera({ x: 0, y: 0 }, 1.0, { width: 800, height: 600 });
    const screen = camera.worldToScreen({ x: 100, y: 50 });
    expect(screen.x).toBe(500); // 800/2 + 100
    expect(screen.y).toBe(350); // 600/2 + 50
  });

  it('converts world coordinates with non-zero camera position and scaled zoom', () => {
    const camera = new Camera({ x: 100, y: 100 }, 2.0, { width: 800, height: 600 });
    // Screen: (world - pos) * zoom + viewport/2
    // x: (200 - 100) * 2 + 400 = 600
    // y: (50 - 100) * 2 + 300 = 200
    const screen = camera.worldToScreen({ x: 200, y: 50 });
    expect(screen.x).toBe(600);
    expect(screen.y).toBe(200);
  });

  it('converts screen coordinates back to world coordinates', () => {
    const camera = new Camera({ x: 50, y: -20 }, 1.5, { width: 1000, height: 800 });
    const screenPoint = { x: 600, y: 400 };
    const worldPoint = camera.screenToWorld(screenPoint);
    const convertedBack = camera.worldToScreen(worldPoint);

    expect(Math.round(convertedBack.x)).toBe(screenPoint.x);
    expect(Math.round(convertedBack.y)).toBe(screenPoint.y);
  });

  it('handles round-trip coordinate transformations accurately', () => {
    const camera = new Camera({ x: -123.45, y: 678.9 }, 1.85, { width: 1440, height: 900 });
    const originalWorld = { x: 345.67, y: -89.12 };
    const screen = camera.worldToScreen(originalWorld);
    const worldBack = camera.screenToWorld(screen);

    expect(worldBack.x).toBeCloseTo(originalWorld.x, 5);
    expect(worldBack.y).toBeCloseTo(originalWorld.y, 5);
  });

  it('clamps zoom levels within specified bounds [0.3, 3.0]', () => {
    const camera = new Camera({ x: 0, y: 0 }, 1.0, { width: 800, height: 600 });
    camera.setZoom(0.1);
    expect(camera.zoom).toBe(0.3);
    camera.setZoom(5.0);
    expect(camera.zoom).toBe(3.0);
    camera.setZoom(1.5);
    expect(camera.zoom).toBe(1.5);
  });

  it('clamps initial zoom in constructor', () => {
    const camLow = new Camera({ x: 0, y: 0 }, 0.05);
    expect(camLow.zoom).toBe(0.3);
    const camHigh = new Camera({ x: 0, y: 0 }, 10.0);
    expect(camHigh.zoom).toBe(3.0);
  });

  it('correctly pans camera position relative to zoom', () => {
    const camera = new Camera({ x: 0, y: 0 }, 2.0, { width: 800, height: 600 });
    camera.pan(100, 50);
    // dx = 100, zoom = 2.0 -> camera.position.x decreases by 50
    // dy = 50, zoom = 2.0 -> camera.position.y decreases by 25
    expect(camera.position.x).toBe(-50);
    expect(camera.position.y).toBe(-25);
  });

  it('keeps the world point under the cursor invariant during zoomAt', () => {
    const camera = new Camera({ x: 150, y: -80 }, 1.2, { width: 1200, height: 800 });
    const focalScreenPoint = { x: 750, y: 320 };

    const worldBefore = camera.screenToWorld(focalScreenPoint);
    camera.zoomAt(focalScreenPoint, 0.25); // zoom in by 25%
    const worldAfter = camera.screenToWorld(focalScreenPoint);

    expect(worldAfter.x).toBeCloseTo(worldBefore.x, 4);
    expect(worldAfter.y).toBeCloseTo(worldBefore.y, 4);
  });

  it('respects zoom boundaries when zooming at a focal point', () => {
    const camera = new Camera({ x: 0, y: 0 }, 2.8, { width: 800, height: 600 });
    camera.zoomAt({ x: 400, y: 300 }, 1.0); // Attempt to zoom past 3.0
    expect(camera.zoom).toBe(3.0);

    camera.zoomAt({ x: 400, y: 300 }, -0.99); // Attempt to zoom below 0.3
    expect(camera.zoom).toBe(0.3);
  });

  it('calculates visible world bounds correctly including margin', () => {
    const camera = new Camera({ x: 0, y: 0 }, 1.0, { width: 800, height: 600 });
    const bounds = camera.getVisibleWorldBounds(100);

    // At 1.0 zoom centered at 0,0:
    // Screen (0,0) is world (-400, -300)
    // With margin 100: screen (-100, -100) -> world (-500, -400)
    // screen (900, 700) -> world (500, 400)
    expect(bounds.minX).toBe(-500);
    expect(bounds.minY).toBe(-400);
    expect(bounds.maxX).toBe(500);
    expect(bounds.maxY).toBe(400);
  });

  it('updates viewport size correctly via setViewport', () => {
    const camera = new Camera({ x: 0, y: 0 }, 1.0, { width: 800, height: 600 });
    camera.setViewport(1920, 1080);
    expect(camera.viewport.width).toBe(1920);
    expect(camera.viewport.height).toBe(1080);

    const screen = camera.worldToScreen({ x: 0, y: 0 });
    expect(screen.x).toBe(960);
    expect(screen.y).toBe(540);
  });
});

describe('DotGrid Rendering & Culling', () => {
  it('renders dot grid using canvas context within visible bounds', () => {
    const grid = new DotGrid();
    expect(grid.spacing).toBe(48);
    expect(grid.dotRadius).toBe(1);

    const camera = new Camera({ x: 0, y: 0 }, 1.0, { width: 400, height: 300 });

    const arcCalls: Array<{ x: number; y: number; r: number }> = [];
    const mockCtx = {
      fillStyle: '',
      beginPath: vi.fn(),
      arc: vi.fn((x: number, y: number, r: number) => {
        arcCalls.push({ x, y, r });
      }),
      fill: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    grid.render(mockCtx, camera);

    expect(mockCtx.beginPath).toHaveBeenCalled();
    expect(mockCtx.arc).toHaveBeenCalled();
    expect(mockCtx.fill).toHaveBeenCalled();
    expect(arcCalls.length).toBeGreaterThan(0);
    expect(mockCtx.fillStyle).toContain('rgba(232, 232, 232,');
  });

  it('adjusts dot opacity and scale based on camera zoom', () => {
    const grid = new DotGrid();
    const mockCtx = {
      fillStyle: '',
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    const cameraHighZoom = new Camera({ x: 0, y: 0 }, 2.5, { width: 400, height: 300 });
    grid.render(mockCtx, cameraHighZoom);
    expect(mockCtx.fillStyle).toBe('rgba(232, 232, 232, 0.2)'); // clamped max 0.2

    const cameraLowZoom = new Camera({ x: 0, y: 0 }, 0.3, { width: 400, height: 300 });
    grid.render(mockCtx, cameraLowZoom);
    expect(mockCtx.fillStyle).toBe('rgba(232, 232, 232, 0.04)'); // clamped min 0.04
  });
});

describe('CanvasEngine', () => {
  let mockCanvas: HTMLCanvasElement;
  let mockCtx: CanvasRenderingContext2D;

  beforeEach(() => {
    mockCtx = {
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    mockCanvas = {
      width: 800,
      height: 600,
      getContext: vi.fn(() => mockCtx),
      getBoundingClientRect: vi.fn(() => ({
        left: 0,
        top: 0,
        width: 800,
        height: 600,
        right: 800,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: () => {},
      })),
    } as unknown as HTMLCanvasElement;

    vi.stubGlobal('requestAnimationFrame', vi.fn((_cb) => 101));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.stubGlobal('innerWidth', 1024);
    vi.stubGlobal('innerHeight', 768);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with default camera and custom dimensions', () => {
    const engine = new CanvasEngine(mockCanvas);
    expect(engine.camera).toBeDefined();
    expect(engine.canvas).toBe(mockCanvas);
    expect(engine.camera.viewport.width).toBe(800);
    expect(engine.camera.viewport.height).toBe(600);
  });

  it('allows providing custom camera and onRender callback', () => {
    const customCamera = new Camera({ x: 50, y: 50 }, 1.5, { width: 500, height: 400 });
    const onRender = vi.fn();
    const engine = new CanvasEngine(mockCanvas, { camera: customCamera, onRender });

    expect(engine.camera).toBe(customCamera);
    engine.render();
    expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
    expect(onRender).toHaveBeenCalledWith(mockCtx, customCamera);
  });

  it('manages start and stop animation loop lifecycle', () => {
    const engine = new CanvasEngine(mockCanvas);
    engine.start();
    expect(engine.isRunning).toBe(true);
    expect(requestAnimationFrame).toHaveBeenCalled();

    engine.stop();
    expect(engine.isRunning).toBe(false);
    expect(cancelAnimationFrame).toHaveBeenCalledWith(101);
  });

  it('handles window resize and updates camera viewport', () => {
    const engine = new CanvasEngine(mockCanvas);
    engine.handleResize(1280, 720);

    expect(mockCanvas.width).toBe(1280);
    expect(mockCanvas.height).toBe(720);
    expect(engine.camera.viewport.width).toBe(1280);
    expect(engine.camera.viewport.height).toBe(720);
  });

  it('cleans up event listeners and stops animation on destroy', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const engine = new CanvasEngine(mockCanvas);
    engine.start();
    engine.destroy();

    expect(engine.isRunning).toBe(false);
    expect(cancelAnimationFrame).toHaveBeenCalled();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});
