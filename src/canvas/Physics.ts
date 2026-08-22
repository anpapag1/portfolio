import { Vector2 } from './types';

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
  public restLength = 650;
  public springK = 0.003;
  public repulsionK = 250000;
  public centerAttractionK = 0.00005;
  public damping = 0.94;
  public minSeparation = 560;

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

  public update(dt: number) {
    const particleList = this.getAllParticles();

    // 1. Accumulate forces
    for (let i = 0; i < particleList.length; i++) {
      const p1 = particleList[i];

      // Very gentle center attraction to keep constellation roughly centered
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
          const pushForce = overlap * overlap * 1800 + (this.repulsionK / (dist * dist));
          p1.acceleration.x -= dirX * pushForce;
          p1.acceleration.y -= dirY * pushForce;
          p2.acceleration.x += dirX * pushForce;
          p2.acceleration.y += dirY * pushForce;
        } else {
          // Normal inverse square repulsion
          const repForce = Math.min(50, this.repulsionK / (dist * dist));
          p1.acceleration.x -= dirX * repForce;
          p1.acceleration.y -= dirY * repForce;
          p2.acceleration.x += dirX * repForce;
          p2.acceleration.y += dirY * repForce;
        }

        // Gentle spring connection
        const springForce = (dist - this.restLength) * this.springK;
        p1.acceleration.x += dirX * springForce;
        p1.acceleration.y += dirY * springForce;
        p2.acceleration.x -= dirX * springForce;
        p2.acceleration.y -= dirY * springForce;
      }
    }

    // 2. Verlet integration
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

  public renderConnections(ctx: CanvasRenderingContext2D, worldToScreen: (v: Vector2) => Vector2) {
    const particleList = this.getAllParticles();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;

    for (let i = 0; i < particleList.length; i++) {
      const p1 = worldToScreen({
        x: particleList[i].position.x + 190,
        y: particleList[i].position.y + 130,
      });
      for (let j = i + 1; j < particleList.length; j++) {
        const p2 = worldToScreen({
          x: particleList[j].position.x + 190,
          y: particleList[j].position.y + 130,
        });
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }
  }
}
