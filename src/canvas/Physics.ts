import { Vector2 } from './types';
import { TerminalData } from '../types/content';

export interface Particle {
  id: string;
  position: Vector2;
  previous: Vector2;
  acceleration: Vector2;
  pinned: boolean;
  mass: number;
}

export class PhysicsEngine {
  private particles: Map<string, Particle> = new Map();
  public restLength = 620;
  public springK = 0.006;
  public repulsionK = 300000;
  public centerAttractionK = 0.00004;
  public damping = 0.94;
  public minSeparation = 560;
  public maxNeighborsPerNode = 2; // Each node dynamically connects to its closest 2 neighbors
  public maxConnectionDistance = 900; // Max connection span

  public addParticle(id: string, position: Vector2, mass = 1.0) {
    this.particles.set(id, {
      id,
      position: { ...position },
      previous: { ...position },
      acceleration: { x: 0, y: 0 },
      pinned: false,
      mass,
    });
  }

  public removeParticle(id: string) {
    this.particles.delete(id);
  }

  public syncParticles(terminals: TerminalData[]) {
    const currentIds = new Set(terminals.map((t) => t.id));

    // Remove any particles not present in the current terminal list
    for (const id of Array.from(this.particles.keys())) {
      if (!currentIds.has(id)) {
        this.removeParticle(id);
      }
    }

    // Add or update particles for terminals
    for (const t of terminals) {
      if (!this.particles.has(t.id)) {
        let pos = t.position;
        if (typeof window !== 'undefined') {
          try {
            const saved = localStorage.getItem(`portfolio:pos:${t.id}`);
            if (saved) pos = JSON.parse(saved);
          } catch {
            // fallback to t.position
          }
        }
        this.addParticle(t.id, pos);
      }
    }
  }

  public getParticle(id: string): Particle | undefined {
    return this.particles.get(id);
  }

  public getAllParticles(): Particle[] {
    return Array.from(this.particles.values());
  }

  public pin(id: string) {
    const p = this.particles.get(id);
    if (p) p.pinned = true;
  }

  public unpin(id: string) {
    const p = this.particles.get(id);
    if (p) {
      p.pinned = false;
      p.previous = { ...p.position };
    }
  }

  public setPosition(id: string, pos: Vector2) {
    const p = this.particles.get(id);
    if (p) {
      p.position = { ...pos };
      if (p.pinned) {
        p.previous = { ...pos };
      }
    }
  }

  /**
   * Computes dynamic undirected edges connecting each particle to its closest neighbors.
   * If nodes are added, removed, or moved, the graph dynamically re-links.
   */
  public getDynamicEdges(): [Particle, Particle][] {
    const particleList = this.getAllParticles();
    const edgeSet = new Set<string>();
    const edges: [Particle, Particle][] = [];

    for (let i = 0; i < particleList.length; i++) {
      const p1 = particleList[i];
      const neighbors: { particle: Particle; dist: number }[] = [];

      for (let j = 0; j < particleList.length; j++) {
        if (i === j) continue;
        const p2 = particleList[j];
        const dx = p2.position.x - p1.position.x;
        const dy = p2.position.y - p1.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        neighbors.push({ particle: p2, dist });
      }

      // Sort by proximity
      neighbors.sort((a, b) => a.dist - b.dist);

      // Connect to the top closest neighbors
      const closest = neighbors.slice(0, this.maxNeighborsPerNode);
      for (const item of closest) {
        if (item.dist <= this.maxConnectionDistance) {
          const key = [p1.id, item.particle.id].sort().join(':::');
          if (!edgeSet.has(key)) {
            edgeSet.add(key);
            edges.push([p1, item.particle]);
          }
        }
      }
    }

    return edges;
  }

  public update(dt: number) {
    const particleList = this.getAllParticles();

    // 1. Accumulate center attraction and collision repulsion for all pairs
    for (let i = 0; i < particleList.length; i++) {
      const p1 = particleList[i];

      p1.acceleration.x -= p1.position.x * this.centerAttractionK;
      p1.acceleration.y -= p1.position.y * this.centerAttractionK;

      for (let j = i + 1; j < particleList.length; j++) {
        const p2 = particleList[j];
        const dx = p2.position.x - p1.position.x;
        const dy = p2.position.y - p1.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const dirX = dx / dist;
        const dirY = dy / dist;

        // Anti-overlap strong repulsion when cards are closer than minimum clearance
        if (dist < this.minSeparation) {
          const overlap = (this.minSeparation - dist) / this.minSeparation;
          const pushForce = overlap * overlap * 2000 + this.repulsionK / (dist * dist);
          p1.acceleration.x -= dirX * pushForce;
          p1.acceleration.y -= dirY * pushForce;
          p2.acceleration.x += dirX * pushForce;
          p2.acceleration.y += dirY * pushForce;
        } else {
          const repForce = Math.min(60, this.repulsionK / (dist * dist));
          p1.acceleration.x -= dirX * repForce;
          p1.acceleration.y -= dirY * repForce;
          p2.acceleration.x += dirX * repForce;
          p2.acceleration.y += dirY * repForce;
        }
      }
    }

    // 2. Apply spring forces ONLY along dynamic nearest-neighbor edges
    const dynamicEdges = this.getDynamicEdges();
    for (const [p1, p2] of dynamicEdges) {
      const dx = p2.position.x - p1.position.x;
      const dy = p2.position.y - p1.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const dirX = dx / dist;
      const dirY = dy / dist;

      const springForce = (dist - this.restLength) * this.springK;
      p1.acceleration.x += dirX * springForce;
      p1.acceleration.y += dirY * springForce;
      p2.acceleration.x -= dirX * springForce;
      p2.acceleration.y -= dirY * springForce;
    }

    // 3. Verlet integration
    for (const p of particleList) {
      if (p.pinned) {
        p.acceleration = { x: 0, y: 0 };
        continue;
      }

      const vx = (p.position.x - p.previous.x) * this.damping;
      const vy = (p.position.y - p.previous.y) * this.damping;

      p.previous.x = p.position.x;
      p.previous.y = p.position.y;

      p.position.x += vx + p.acceleration.x * dt * dt * 60;
      p.position.y += vy + p.acceleration.y * dt * dt * 60;

      p.acceleration.x = 0;
      p.acceleration.y = 0;
    }
  }

  /**
   * Renders dynamic proximity lines between closest terminal cards.
   */
  public renderConnections(ctx: CanvasRenderingContext2D, worldToScreen: (v: Vector2) => Vector2) {
    const dynamicEdges = this.getDynamicEdges();
    ctx.lineWidth = 1;

    for (const [p1, p2] of dynamicEdges) {
      const dx = p2.position.x - p1.position.x;
      const dy = p2.position.y - p1.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Organic distance-based opacity fade
      const opacity = Math.max(0.04, Math.min(0.18, 0.2 * (1 - dist / this.maxConnectionDistance)));
      ctx.strokeStyle = `rgba(255, 255, 255, ${opacity.toFixed(3)})`;

      const pt1 = worldToScreen({
        x: p1.position.x + 190,
        y: p1.position.y + 130,
      });
      const pt2 = worldToScreen({
        x: p2.position.x + 190,
        y: p2.position.y + 130,
      });

      ctx.beginPath();
      ctx.moveTo(pt1.x, pt1.y);
      ctx.lineTo(pt2.x, pt2.y);
      ctx.stroke();
    }
  }
}
