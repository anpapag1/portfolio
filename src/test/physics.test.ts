import { describe, it, expect, vi } from 'vitest';
import { PhysicsEngine } from '../canvas/Physics';

describe('Verlet Physics Engine', () => {
  it('initializes particles with given positions and defaults', () => {
    const engine = new PhysicsEngine();
    engine.addParticle('p1', { x: 10, y: 20 });
    engine.addParticle('p2', { x: 100, y: 200 }, 2.0);

    const p1 = engine.getParticle('p1');
    expect(p1).toBeDefined();
    expect(p1?.id).toBe('p1');
    expect(p1?.position).toEqual({ x: 10, y: 20 });
    expect(p1?.previous).toEqual({ x: 10, y: 20 });
    expect(p1?.acceleration).toEqual({ x: 0, y: 0 });
    expect(p1?.pinned).toBe(false);
    expect(p1?.mass).toBe(1.0);

    const p2 = engine.getParticle('p2');
    expect(p2?.mass).toBe(2.0);

    const all = engine.getAllParticles();
    expect(all).toHaveLength(2);
    expect(all.map((p) => p.id)).toEqual(['p1', 'p2']);
  });

  it('returns undefined for non-existent particles', () => {
    const engine = new PhysicsEngine();
    expect(engine.getParticle('non-existent')).toBeUndefined();
  });

  it('preserves pinned particle position during physics steps', () => {
    const engine = new PhysicsEngine();
    engine.addParticle('p1', { x: 0, y: 0 });
    engine.addParticle('p2', { x: 10, y: 0 }); // would repel

    engine.pin('p1');
    expect(engine.getParticle('p1')?.pinned).toBe(true);

    engine.setPosition('p1', { x: -50, y: -50 });
    engine.update(1 / 60);

    const p1 = engine.getParticle('p1');
    expect(p1?.position.x).toBe(-50);
    expect(p1?.position.y).toBe(-50);
    expect(p1?.acceleration).toEqual({ x: 0, y: 0 });
  });

  it('unpins particle and syncs previous position', () => {
    const engine = new PhysicsEngine();
    engine.addParticle('p1', { x: 0, y: 0 });
    engine.pin('p1');
    engine.setPosition('p1', { x: 100, y: 100 });
    engine.unpin('p1');

    const p1 = engine.getParticle('p1');
    expect(p1?.pinned).toBe(false);
    expect(p1?.previous).toEqual({ x: 100, y: 100 });
  });

  it('setPosition updates position and previous if pinned', () => {
    const engine = new PhysicsEngine();
    engine.addParticle('p1', { x: 0, y: 0 });
    engine.pin('p1');
    engine.setPosition('p1', { x: 200, y: 300 });

    const p1 = engine.getParticle('p1');
    expect(p1?.position).toEqual({ x: 200, y: 300 });
    expect(p1?.previous).toEqual({ x: 200, y: 300 });

    engine.unpin('p1');
    engine.setPosition('p1', { x: 400, y: 500 });
    // position changed, but previous remains as is
    expect(p1?.position).toEqual({ x: 400, y: 500 });
  });

  it('applies spring attraction when particles are beyond restLength', () => {
    const engine = new PhysicsEngine();
    // restLength is 650; placing at 900 will cause spring to attract
    engine.addParticle('p1', { x: 0, y: 0 });
    engine.addParticle('p2', { x: 900, y: 0 });

    engine.update(1 / 60);
    const p1 = engine.getParticle('p1');
    const p2 = engine.getParticle('p2');

    expect(p1!.position.x).toBeGreaterThan(0);
    expect(p2!.position.x).toBeLessThan(900);
  });

  it('applies repulsion force when particles are close', () => {
    const engine = new PhysicsEngine();
    // close distance: 50 px apart (< restLength 280)
    engine.addParticle('p1', { x: 0, y: 0 });
    engine.addParticle('p2', { x: 50, y: 0 });

    engine.update(1 / 60);
    const p1 = engine.getParticle('p1');
    const p2 = engine.getParticle('p2');

    expect(p1!.position.x).toBeLessThan(0);
    expect(p2!.position.x).toBeGreaterThan(50);
  });

  it('applies center attraction force towards origin', () => {
    const engine = new PhysicsEngine();
    // Single particle away from origin should be pulled toward origin
    engine.addParticle('p1', { x: 1000, y: 1000 });

    engine.update(1 / 60);
    const p1 = engine.getParticle('p1');

    expect(p1!.position.x).toBeLessThan(1000);
    expect(p1!.position.y).toBeLessThan(1000);
  });

  it('applies damping to particle velocity across multiple steps', () => {
    const engine = new PhysicsEngine();
    engine.addParticle('p1', { x: 0, y: 0 });
    // Manually give velocity by setting previous position
    const p1 = engine.getParticle('p1')!;
    p1.previous = { x: -10, y: 0 }; // velocity would be +10

    engine.update(1 / 60);
    const step1Velocity = p1.position.x - p1.previous.x;

    engine.update(1 / 60);
    const step2Velocity = p1.position.x - p1.previous.x;

    // Due to damping, velocity decay should occur
    expect(step2Velocity).toBeLessThan(step1Velocity);
  });

  it('renders connections between particle pairs on canvas', () => {
    const engine = new PhysicsEngine();
    engine.addParticle('p1', { x: 0, y: 0 });
    engine.addParticle('p2', { x: 100, y: 100 });
    engine.addParticle('p3', { x: 200, y: 200 });

    const ctx = {
      strokeStyle: '',
      lineWidth: 0,
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    const worldToScreen = vi.fn((v) => ({ x: v.x + 500, y: v.y + 300 }));

    engine.renderConnections(ctx, worldToScreen);

    expect(ctx.strokeStyle).toBe('rgba(255, 255, 255, 0.06)');
    expect(ctx.lineWidth).toBe(1);

    // 3 particles = 3 pairs (p1-p2, p1-p3, p2-p3)
    expect(ctx.beginPath).toHaveBeenCalledTimes(3);
    expect(ctx.moveTo).toHaveBeenCalledTimes(3);
    expect(ctx.lineTo).toHaveBeenCalledTimes(3);
    expect(ctx.stroke).toHaveBeenCalledTimes(3);
    expect(worldToScreen).toHaveBeenCalledTimes(6);
  });
});
