import { Vector2 } from './types';
import { TerminalData } from '../types/content';
import { PHYSICS_CONFIG, PhysicsConfig } from '../config';

export interface Particle {
  id: string;
  position: Vector2;
  previous: Vector2;
  acceleration: Vector2;
  pinned: boolean;
  mass: number;
}

export interface LatchedEdge {
  id: string;
  nodeAId: string;
  nodeBId: string;
}

export class PhysicsEngine {
  private particles: Map<string, Particle> = new Map();
  private latchedEdges: Map<string, LatchedEdge> = new Map();
  public config: PhysicsConfig;

  constructor(customConfig?: Partial<PhysicsConfig>) {
    this.config = { ...PHYSICS_CONFIG, ...customConfig };
  }

  public addParticle(id: string, position: Vector2, mass = 1.0) {
    this.particles.set(id, {
      id,
      position: { ...position },
      previous: { ...position },
      acceleration: { x: 0, y: 0 },
      pinned: false,
      mass,
    });
    this.latchClosestNeighbors();
  }

  public removeParticle(id: string) {
    this.particles.delete(id);
    // Remove any latched edges connected to this particle
    for (const [edgeId, edge] of Array.from(this.latchedEdges.entries())) {
      if (edge.nodeAId === id || edge.nodeBId === id) {
        this.latchedEdges.delete(edgeId);
      }
    }
  }

  public syncParticles(terminals: TerminalData[]) {
    const currentIds = new Set(terminals.map((t) => t.id));

    // Remove particles no longer present
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
            // fallback
          }
        }
        this.addParticle(t.id, pos);
      }
    }

    this.latchClosestNeighbors();
  }

  public getParticle(id: string): Particle | undefined {
    return this.particles.get(id);
  }

  public getAllParticles(): Particle[] {
    return Array.from(this.particles.values());
  }

  public getLatchedEdges(): LatchedEdge[] {
    return Array.from(this.latchedEdges.values());
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
    // Check if unpinned particle can latch to a neighbor if disconnected
    this.latchClosestNeighbors();
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

  public resetBonds() {
    this.latchedEdges.clear();
    this.latchClosestNeighbors();
  }

  /**
   * Helper to generate a canonical edge ID for two nodes.
   */
  private makeEdgeId(nodeAId: string, nodeBId: string): string {
    return [nodeAId, nodeBId].sort().join(':::');
  }

  /**
   * Scans all nodes and latches each node to its closest neighbor(s)
   * up to maxConnectionsPerNode. Once established, bonds are persistent.
   */
  public latchClosestNeighbors() {
    const particleList = this.getAllParticles();
    if (particleList.length < 2) return;

    for (let i = 0; i < particleList.length; i++) {
      const p1 = particleList[i];

      // Count current connections for p1
      let connectionCount = 0;
      for (const edge of this.latchedEdges.values()) {
        if (edge.nodeAId === p1.id || edge.nodeBId === p1.id) {
          connectionCount++;
        }
      }

      if (connectionCount >= this.config.maxConnectionsPerNode) {
        continue;
      }

      // Calculate distances to other particles
      const candidates: { particle: Particle; dist: number }[] = [];
      for (let j = 0; j < particleList.length; j++) {
        if (i === j) continue;
        const p2 = particleList[j];
        const edgeId = this.makeEdgeId(p1.id, p2.id);
        if (this.latchedEdges.has(edgeId)) continue; // already connected

        const dx = p2.position.x - p1.position.x;
        const dy = p2.position.y - p1.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= this.config.latchSearchRadius) {
          candidates.push({ particle: p2, dist });
        }
      }

      // Sort by proximity to pick closest available
      candidates.sort((a, b) => a.dist - b.dist);

      const needed = this.config.maxConnectionsPerNode - connectionCount;
      for (let k = 0; k < Math.min(needed, candidates.length); k++) {
        const target = candidates[k];
        const edgeId = this.makeEdgeId(p1.id, target.particle.id);
        if (!this.latchedEdges.has(edgeId)) {
          this.latchedEdges.set(edgeId, {
            id: edgeId,
            nodeAId: p1.id,
            nodeBId: target.particle.id,
          });
        }
      }
    }
  }

  public update(dt: number) {
    const particleList = this.getAllParticles();

    // 1. Accumulate center attraction and collision repulsion for all pairs
    for (let i = 0; i < particleList.length; i++) {
      const p1 = particleList[i];

      p1.acceleration.x -= p1.position.x * this.config.centerAttraction;
      p1.acceleration.y -= p1.position.y * this.config.centerAttraction;

      for (let j = i + 1; j < particleList.length; j++) {
        const p2 = particleList[j];
        const dx = p2.position.x - p1.position.x;
        const dy = p2.position.y - p1.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const dirX = dx / dist;
        const dirY = dy / dist;

        // Anti-overlap strong repulsion when cards are closer than minimum clearance
        if (dist < this.config.minSeparation) {
          const overlap = (this.config.minSeparation - dist) / this.config.minSeparation;
          const pushForce = overlap * overlap * 2200 + this.config.repulsionStrength / (dist * dist);
          p1.acceleration.x -= dirX * pushForce;
          p1.acceleration.y -= dirY * pushForce;
          p2.acceleration.x += dirX * pushForce;
          p2.acceleration.y += dirY * pushForce;
        } else {
          const repForce = Math.min(60, this.config.repulsionStrength / (dist * dist));
          p1.acceleration.x -= dirX * repForce;
          p1.acceleration.y -= dirY * repForce;
          p2.acceleration.x += dirX * repForce;
          p2.acceleration.y += dirY * repForce;
        }
      }
    }

    // 2. Apply restorative spring forces ONLY along active latched edges
    for (const [edgeId, edge] of Array.from(this.latchedEdges.entries())) {
      const p1 = this.particles.get(edge.nodeAId);
      const p2 = this.particles.get(edge.nodeBId);

      if (!p1 || !p2) {
        this.latchedEdges.delete(edgeId);
        continue;
      }

      const dx = p2.position.x - p1.position.x;
      const dy = p2.position.y - p1.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const dirX = dx / dist;
      const dirY = dy / dist;

      // Disconnect rule: only if user is actively dragging one of the nodes and exceeds disconnectDragDistance
      if ((p1.pinned || p2.pinned) && dist > this.config.disconnectDragDistance) {
        this.latchedEdges.delete(edgeId);
        continue;
      }

      // Restorative spring force pulling/pushing toward desirableDistance
      const springForce = (dist - this.config.desirableDistance) * this.config.springStrength;
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

      const vx = (p.position.x - p.previous.x) * this.config.damping;
      const vy = (p.position.y - p.previous.y) * this.config.damping;

      p.previous.x = p.position.x;
      p.previous.y = p.position.y;

      p.position.x += vx + p.acceleration.x * dt * dt * 60;
      p.position.y += vy + p.acceleration.y * dt * dt * 60;

      p.acceleration.x = 0;
      p.acceleration.y = 0;
    }
  }

  /**
   * Renders persistent connection lines between latched terminal cards.
   */
  public renderConnections(ctx: CanvasRenderingContext2D, worldToScreen: (v: Vector2) => Vector2) {
    ctx.lineWidth = 1;

    for (const edge of this.latchedEdges.values()) {
      const p1 = this.particles.get(edge.nodeAId);
      const p2 = this.particles.get(edge.nodeBId);
      if (!p1 || !p2) continue;

      const dx = p2.position.x - p1.position.x;
      const dy = p2.position.y - p1.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Distance-based opacity
      const opacity = Math.max(
        0.05,
        Math.min(0.2, 0.22 * (1 - dist / (this.config.disconnectDragDistance * 1.2)))
      );
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
