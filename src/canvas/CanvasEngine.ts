import { Camera } from './Camera';
import { DotGrid } from './DotGrid';

export interface CanvasEngineOptions {
  camera?: Camera;
  dotGrid?: DotGrid;
  onRender?: (ctx: CanvasRenderingContext2D, camera: Camera) => void;
  autoResize?: boolean;
}

export class CanvasEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public camera: Camera;
  public dotGrid: DotGrid;
  public isRunning = false;

  private animId: number | null = null;
  private onRender?: (ctx: CanvasRenderingContext2D, camera: Camera) => void;
  private resizeHandler: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement, options: CanvasEngineOptions = {}) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D rendering context from canvas.');
    }
    this.ctx = context;

    this.camera =
      options.camera ??
      new Camera({ x: 0, y: 0 }, 1.0, {
        width: canvas.width || 800,
        height: canvas.height || 600,
      });

    this.dotGrid = options.dotGrid ?? new DotGrid();
    this.onRender = options.onRender;

    if (options.autoResize !== false && typeof window !== 'undefined') {
      this.resizeHandler = () => {
        this.handleResize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', this.resizeHandler);
    }
  }

  public handleResize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.camera.setViewport(width, height);
  }

  public render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.dotGrid.render(this.ctx, this.camera);
    if (this.onRender) {
      this.onRender(this.ctx, this.camera);
    }
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;

    const loop = () => {
      if (!this.isRunning) return;
      this.render();
      this.animId = requestAnimationFrame(loop);
    };

    this.animId = requestAnimationFrame(loop);
  }

  public stop() {
    this.isRunning = false;
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  public destroy() {
    this.stop();
    if (this.resizeHandler && typeof window !== 'undefined') {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
  }
}
