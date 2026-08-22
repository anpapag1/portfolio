import { Camera } from './Camera';

export class DotGrid {
  public spacing = 48;
  public dotRadius = 1;

  public render(ctx: CanvasRenderingContext2D, camera: Camera) {
    const bounds = camera.getVisibleWorldBounds(100);
    const startX = Math.floor(bounds.minX / this.spacing) * this.spacing;
    const endX = Math.ceil(bounds.maxX / this.spacing) * this.spacing;
    const startY = Math.floor(bounds.minY / this.spacing) * this.spacing;
    const endY = Math.ceil(bounds.maxY / this.spacing) * this.spacing;

    const opacity = Math.min(0.2, Math.max(0.04, 0.1 * camera.zoom));
    ctx.fillStyle = `rgba(232, 232, 232, ${opacity})`;

    for (let x = startX; x <= endX; x += this.spacing) {
      for (let y = startY; y <= endY; y += this.spacing) {
        const screen = camera.worldToScreen({ x, y });
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, this.dotRadius * Math.min(camera.zoom, 1.5), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
