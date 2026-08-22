import { Camera } from './Camera';
import { GRID_CONFIG, GridConfig } from '../config';

export class DotGrid {
  public config: GridConfig;

  constructor(config: Partial<GridConfig> = {}) {
    this.config = { ...GRID_CONFIG, ...config };
  }

  public get spacing(): number {
    return this.config.spacing;
  }

  public get dotRadius(): number {
    return this.config.dotRadius;
  }

  public render(ctx: CanvasRenderingContext2D, camera: Camera) {
    if (this.config.style === 'none') return;

    const bounds = camera.getVisibleWorldBounds(100);
    const spacing = this.config.spacing;
    const startX = Math.floor(bounds.minX / spacing) * spacing;
    const endX = Math.ceil(bounds.maxX / spacing) * spacing;
    const startY = Math.floor(bounds.minY / spacing) * spacing;
    const endY = Math.ceil(bounds.maxY / spacing) * spacing;

    const computedOpacity = Math.min(
      this.config.maxOpacity,
      Math.max(this.config.minOpacity, this.config.opacity * camera.zoom)
    );
    const colorStr = this.config.color.includes('(')
      ? this.config.color
      : `rgba(${this.config.color}, ${computedOpacity})`;

    // 1. Grid Style: 'lines'
    if (this.config.style === 'lines') {
      ctx.strokeStyle = colorStr;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = startX; x <= endX; x += spacing) {
        const top = camera.worldToScreen({ x, y: bounds.minY });
        const bottom = camera.worldToScreen({ x, y: bounds.maxY });
        ctx.moveTo(top.x, top.y);
        ctx.lineTo(bottom.x, bottom.y);
      }
      for (let y = startY; y <= endY; y += spacing) {
        const left = camera.worldToScreen({ x: bounds.minX, y });
        const right = camera.worldToScreen({ x: bounds.maxX, y });
        ctx.moveTo(left.x, left.y);
        ctx.lineTo(right.x, right.y);
      }
      ctx.stroke();
      return;
    }

    // 2. Grid Style: 'crosses'
    if (this.config.style === 'crosses') {
      ctx.strokeStyle = colorStr;
      ctx.lineWidth = 1;
      const crossSize =
        this.config.dotRadius * 3 * (this.config.scaleWithZoom ? Math.min(camera.zoom, 1.5) : 1);
      ctx.beginPath();
      for (let x = startX; x <= endX; x += spacing) {
        for (let y = startY; y <= endY; y += spacing) {
          const screen = camera.worldToScreen({ x, y });
          ctx.moveTo(screen.x - crossSize, screen.y);
          ctx.lineTo(screen.x + crossSize, screen.y);
          ctx.moveTo(screen.x, screen.y - crossSize);
          ctx.lineTo(screen.x, screen.y + crossSize);
        }
      }
      ctx.stroke();
      return;
    }

    // 3. Grid Style: 'dots' (Default)
    ctx.fillStyle = colorStr;
    const dotScale = this.config.scaleWithZoom ? Math.min(camera.zoom, 1.5) : 1;
    const radius = this.config.dotRadius * dotScale;

    for (let x = startX; x <= endX; x += spacing) {
      for (let y = startY; y <= endY; y += spacing) {
        const screen = camera.worldToScreen({ x, y });
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
