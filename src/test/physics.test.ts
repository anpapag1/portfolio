import { describe, it, expect, vi } from 'vitest';
import { PhysicsEngine } from '../canvas/Physics';

describe('Verlet Physics Engine with Dynamic Sticky Latching', () => {
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

  it('automatically latches each node to its closest neighbor', () => {
    const engine = new PhysicsEngine({ desirableDistance: 500, latchSearchRadius: 1000 });
    // p1 at (0, 0), p2 at (400, 0) [closest], p3 at (900, 0)
    engine.addParticle('p1', { x: 0, y: 0 });
    engine.addParticle('p2', { x: 400, y: 0 });
    engine.addParticle('p3', { x: 900, y: 0 });

    const edges = engine.getLatchedEdges();
    expect(edges.length).toBeGreaterThanOrEqual(2);

    const edgePairs = edges.map((e) => [e.nodeAId, e.nodeBId].sort().join('-'));
    // p1 latches to closest p2, and p2 latches to p3
    expect(edgePairs).toContain('p1-p2');
    expect(edgePairs).toContain('p2-p3');
  });

  it('maintains persistent bonds that do not disconnect when unpinned', () => {
    const engine = new PhysicsEngine();
    engine.addParticle('p1', { x: 0, y: 0 });
    engine.addParticle('p2', { x: 600, y: 0 });

    expect(engine.getLatchedEdges()).toHaveLength(1);

    // Run multiple physics simulation frames
    for (let i = 0; i < 30; i++) {
      engine.update(1 / 60);
    }

    // Edge must remain latched without user dragging
    expect(engine.getLatchedEdges()).toHaveLength(1);
    expect(engine.getLatchedEdges()[0].nodeAId).toBe('p1');
    expect(engine.getLatchedEdges()[0].nodeBId).toBe('p2');
  });

  it('applies restorative spring forces pulling connected nodes to desirableDistance', () => {
    const engine = new PhysicsEngine({ desirableDistance: 580 });
    // Place at 800px (> 580px)
    engine.addParticle('p1', { x: 0, y: 0 });
    engine.addParticle('p2', { x: 800, y: 0 });

    engine.update(1 / 60);
    const p1 = engine.getParticle('p1');
    const p2 = engine.getParticle('p2');

    // Both nodes should be pulled towards each other
    expect(p1!.position.x).toBeGreaterThan(0);
    expect(p2!.position.x).toBeLessThan(800);
  });

  it('breaks latched connection when a node is dragged beyond disconnectDragDistance', () => {
    const engine = new PhysicsEngine({ disconnectDragDistance: 1000 });
    engine.addParticle('p1', { x: 0, y: 0 });
    engine.addParticle('p2', { x: 500, y: 0 });

    expect(engine.getLatchedEdges()).toHaveLength(1);

    // User pins and drags p2 far away
    engine.pin('p2');
    engine.setPosition('p2', { x: 1200, y: 0 }); // > 1000px

    engine.update(1 / 60);

    // Latched edge should have been broken by the user drag
    expect(engine.getLatchedEdges()).toHaveLength(0);
  });

  it('removes latched edges when a connected particle is removed', () => {
    const engine = new PhysicsEngine();
    engine.addParticle('p1', { x: 0, y: 0 });
    engine.addParticle('p2', { x: 400, y: 0 });
    expect(engine.getLatchedEdges()).toHaveLength(1);

    engine.removeParticle('p1');
    expect(engine.getParticle('p1')).toBeUndefined();
    expect(engine.getLatchedEdges()).toHaveLength(0);
  });

  it('syncParticles updates terminals dynamically and re-latches new nodes', () => {
    const engine = new PhysicsEngine();
    engine.addParticle('old', { x: 0, y: 0 });

    const newTerminals = [
      { id: 't1', title: 't1', position: { x: 100, y: 100 }, size: { width: 100, height: 100 }, lines: [] },
      { id: 't2', title: 't2', position: { x: 400, y: 100 }, size: { width: 100, height: 100 }, lines: [] },
    ];

    engine.syncParticles(newTerminals);
    expect(engine.getParticle('old')).toBeUndefined();
    expect(engine.getParticle('t1')).toBeDefined();
    expect(engine.getParticle('t2')).toBeDefined();

    const edges = engine.getLatchedEdges();
    expect(edges).toHaveLength(1);
    expect([edges[0].nodeAId, edges[0].nodeBId].sort()).toEqual(['t1', 't2']);
  });

  it('applies collision repulsion force when cards are too close', () => {
    const engine = new PhysicsEngine();
    engine.addParticle('p1', { x: 0, y: 0 });
    engine.addParticle('p2', { x: 100, y: 0 }); // < minSeparation 520

    engine.update(1 / 60);
    const p1 = engine.getParticle('p1');
    const p2 = engine.getParticle('p2');

    expect(p1!.position.x).toBeLessThan(0);
    expect(p2!.position.x).toBeGreaterThan(100);
  });

  it('preserves pinned particle position during physics steps', () => {
    const engine = new PhysicsEngine();
    engine.addParticle('p1', { x: 0, y: 0 });
    engine.addParticle('p2', { x: 10, y: 0 });

    engine.pin('p1');
    expect(engine.getParticle('p1')?.pinned).toBe(true);

    engine.setPosition('p1', { x: -50, y: -50 });
    engine.update(1 / 60);

    const p1 = engine.getParticle('p1');
    expect(p1?.position.x).toBe(-50);
    expect(p1?.position.y).toBe(-50);
    expect(p1?.acceleration).toEqual({ x: 0, y: 0 });
  });

  it('renders persistent connections on canvas', () => {
    const engine = new PhysicsEngine();
    engine.addParticle('p1', { x: 0, y: 0 });
    engine.addParticle('p2', { x: 400, y: 0 });

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
