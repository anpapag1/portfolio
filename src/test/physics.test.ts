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

  it('removes particles properly', () => {
    const engine = new PhysicsEngine();
    engine.addParticle('p1', { x: 0, y: 0 });
    engine.addParticle('p2', { x: 10, y: 10 });
    engine.removeParticle('p1');
    expect(engine.getParticle('p1')).toBeUndefined();
    expect(engine.getAllParticles()).toHaveLength(1);
  });

  it('syncParticles adds new terminals and removes stale ones dynamically', () => {
    const engine = new PhysicsEngine();
    engine.addParticle('old', { x: 0, y: 0 });

    const newTerminals = [
      { id: 't1', title: 't1', position: { x: 100, y: 100 }, size: { width: 100, height: 100 }, lines: [] },
      { id: 't2', title: 't2', position: { x: 200, y: 200 }, size: { width: 100, height: 100 }, lines: [] },
    ];

    engine.syncParticles(newTerminals);
    expect(engine.getParticle('old')).toBeUndefined();
    expect(engine.getParticle('t1')).toBeDefined();
    expect(engine.getParticle('t2')).toBeDefined();
    expect(engine.getAllParticles()).toHaveLength(2);
  });

  it('computes dynamic closest neighbor connections', () => {
    const engine = new PhysicsEngine();
    // 3 particles in a line: p1 at 0, p2 at 300, p3 at 600
    engine.addParticle('p1', { x: 0, y: 0 });
    engine.addParticle('p2', { x: 300, y: 0 });
    engine.addParticle('p3', { x: 600, y: 0 });

    const edges = engine.getDynamicEdges();
    expect(edges.length).toBeGreaterThanOrEqual(2);
    // p1 connects to p2, p2 connects to p3
    const edgePairs = edges.map(([a, b]) => [a.id, b.id].sort().join('-'));
    expect(edgePairs).toContain('p1-p2');
    expect(edgePairs).toContain('p2-p3');
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
    expect(p1?.position).toEqual({ x: 400, y: 500 });
  });

  it('applies spring attraction when connected particles are beyond restLength', () => {
    const engine = new PhysicsEngine();
    // restLength is 620; placing at 800 (within maxConnectionDistance 900) will cause spring to attract
    engine.addParticle('p1', { x: 0, y: 0 });
    engine.addParticle('p2', { x: 800, y: 0 });

    engine.update(1 / 60);
    const p1 = engine.getParticle('p1');
    const p2 = engine.getParticle('p2');

    expect(p1!.position.x).toBeGreaterThan(0);
    expect(p2!.position.x).toBeLessThan(800);
  });

  it('applies repulsion force when particles are close', () => {
    const engine = new PhysicsEngine();
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
    engine.addParticle('p1', { x: 1000, y: 1000 });

    engine.update(1 / 60);
    const p1 = engine.getParticle('p1');

    expect(p1!.position.x).toBeLessThan(1000);
    expect(p1!.position.y).toBeLessThan(1000);
  });

  it('applies damping to particle velocity across multiple steps', () => {
    const engine = new PhysicsEngine();
    engine.addParticle('p1', { x: 0, y: 0 });
    const p1 = engine.getParticle('p1')!;
    p1.previous = { x: -10, y: 0 };

    engine.update(1 / 60);
    const step1Velocity = p1.position.x - p1.previous.x;

    engine.update(1 / 60);
    const step2Velocity = p1.position.x - p1.previous.x;

    expect(step2Velocity).toBeLessThan(step1Velocity);
  });

  it('renders dynamic connections between closest particle pairs on canvas', () => {
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

    expect(ctx.lineWidth).toBe(1);
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });
});
