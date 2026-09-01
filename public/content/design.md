# Portfolio Architecture & Design Blueprint

**Author**: Antonis Papageorgiou  
**Repository**: https://github.com/anpapag1/portfolio  
**Stack**: React 18, TypeScript, Tailwind CSS, Vite, Lucide Icons, Vitest  

---

## 1. Design Philosophy

This portfolio is built as an **interactive, graph-based 2D physics universe**. Instead of standard vertical scroll pages, every piece of information (Projects, Skills, Websites, Work Experience, Education, Awards, Contact) exists as an autonomous physics node card floating on a custom coordinate canvas.

```
       [ PROFILE ] (Anchor / Pinned HUD)
            │
      ┌─────┴─────┬───────────┐
      │           │           │
  [ SKILLS ] [ PROJECTS ] [ WEBSITES ]
      │           │           │
   [ WORK ]  [ EDUCATION ] [ AWARDS ]
```

---

## 2. Core Subsystems

### 2.1 Physics Engine (`src/physics/engine.ts`)
- **Integration Scheme**: Position-Verlet integration running on 60 FPS requestAnimationFrame.
- **Formulas**:
  - Velocity damping: $v_{t} = (p_{t} - p_{t-1}) \times \mu$ ($\mu = 0.88$).
  - Repulsion: Soft-body Coulomb repulsion $F_{rep} = \frac{k_{rep}}{d^2 + \epsilon}$ between bounding box centers to prevent overlaps.
  - Box Collision Resolution: Custom AABB overlap separation with corner padding buffers.

### 2.2 Dynamic Bond Graph (`src/physics/graph.ts`)
- **Spring Latching**: Delaunay-like nearest neighbor topology linking cards with spring rest lengths ($L_0 \approx 140-280\text{px}$).
- **Hooke's Law**: $F_{spring} = -k_s (d - L_0)$.
- **Obstruction Pruning**: Line-segment intersection test with node bounding boxes to prune obstructed bonds through card bodies.
- **Dual-Pass Glow Canvas**:
  - Pass 1: Blurred radial micro-glow with linear color gradient between node accent colors.
  - Pass 2: Sharp core bezier spline with opacity falloff based on break distance.

### 2.3 Heads-Up Display (HUD) & Gestures
- **Spatial Transform Matrix**: Continuous pan $(X, Y)$ and pinch-zoom $(S)$ on zero-stretch canvas coordinate space.
- **Overview Mode Threshold**: At zoom $< 0.55\times$, card inner interactive links disable to turn entire card surface into drag handles.
- **Radar Minimap**: Synchronous dynamic bounding box cluster centroid mapping with viewport camera frustum.

### 2.4 Semantic 3-Way Theme Engine
- **Modes**: `Device (System Auto)`, `Light Mode`, `Dark Mode`.
- **CSS Custom Properties**:
  - `:root` (Light): Clean frosted glass (`rgba(255,255,255,0.88)`), subtle dark border tint, and light drop shadows.
  - `.dark` (Dark): Translucent dark surface (`rgba(20,20,20,0.70)`), node color alpha glow, and deep ambient shadows.
- **Real-Time Sync**: Synchronizes with OS `prefers-color-scheme` in device mode.

---

## 3. Secret Vault Easter Egg
- **Activation**: Triple-tap `Space` bar within 650 milliseconds.
- **Result**: Spawns the `DEV VAULT` node directly at the canvas center with randomized radial launch velocity and latches into neighbor springs!
