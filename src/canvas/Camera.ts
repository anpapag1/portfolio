import { Vector2, ViewportSize, Bounds } from './types';

export class Camera {
  public position: Vector2;
  public zoom: number;
  public viewport: ViewportSize;
  public readonly minZoom = 0.3;
  public readonly maxZoom = 3.0;

  constructor(
    position: Vector2 = { x: 0, y: 0 },
    zoom = 1.0,
    viewport: ViewportSize = { width: 800, height: 600 }
  ) {
    this.position = { ...position };
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    this.viewport = { ...viewport };
  }

  public setZoom(newZoom: number) {
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));
  }

  public setViewport(width: number, height: number) {
    this.viewport = { width, height };
  }

  public worldToScreen(world: Vector2): Vector2 {
    return {
      x: (world.x - this.position.x) * this.zoom + this.viewport.width / 2,
      y: (world.y - this.position.y) * this.zoom + this.viewport.height / 2,
    };
  }

  public screenToWorld(screen: Vector2): Vector2 {
    return {
      x: (screen.x - this.viewport.width / 2) / this.zoom + this.position.x,
      y: (screen.y - this.viewport.height / 2) / this.zoom + this.position.y,
    };
  }

  public pan(dx: number, dy: number) {
    this.position.x -= dx / this.zoom;
    this.position.y -= dy / this.zoom;
  }

  public zoomAt(screenPoint: Vector2, zoomDelta: number) {
    const worldBefore = this.screenToWorld(screenPoint);
    const targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * (1 + zoomDelta)));
    this.zoom = targetZoom;
    const worldAfter = this.screenToWorld(screenPoint);
    this.position.x += worldBefore.x - worldAfter.x;
    this.position.y += worldBefore.y - worldAfter.y;
  }

  public getVisibleWorldBounds(margin = 100): Bounds {
    const topLeft = this.screenToWorld({ x: -margin, y: -margin });
    const bottomRight = this.screenToWorld({
      x: this.viewport.width + margin,
      y: this.viewport.height + margin,
    });
    return {
      minX: Math.min(topLeft.x, bottomRight.x),
      minY: Math.min(topLeft.y, bottomRight.y),
      maxX: Math.max(topLeft.x, bottomRight.x),
      maxY: Math.max(topLeft.y, bottomRight.y),
    };
  }
}
