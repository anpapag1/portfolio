# Interactive Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive personal portfolio featuring an infinite 2D canvas with glassmorphism terminals, custom Verlet physics connections, typewriter animations, local position persistence, responsive mobile stacking, and a Konami easter egg.

**Architecture:** A Vite + React 18 + TypeScript SPA backed by a vanilla HTML5 `<canvas>` rendering engine for the dotted grid, camera pan/zoom transformations, mini-map, and Verlet physics graph. Floating terminals are rendered in an overlay layer with CSS glassmorphism, dragging handles, and typewriter text animation. Data is driven by a validated static `content.json` file.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Zod, Vitest, React Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-21-portfolio-design.md`

## Global Constraints
- Target load time < 2s on 3G; initial JS bundle < 80KB gzipped.
- Physics and canvas loop targeting 60fps on modern and legacy browsers.
- Monospace typography using `JetBrains Mono` font.
- Color tokens: Background `#0a0a0a`, Foreground `#e8e8e8`, Muted `#6a6a6a`, Accent `#00d4aa`.
- Full keyboard navigation (`Tab`, `Shift+Tab`, `+/-`, `0`, `?`) and `prefers-reduced-motion` compliance.
- No heavy physics/3D libraries — Verlet integration and canvas math must be bespoke and dependency-free.

---

### Task 1: Project Scaffolding & Test Environment Setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `index.html`
- Create: `src/vite-env.d.ts`
- Create: `src/test/setup.ts`
- Test: `src/test/sanity.test.ts`

**Interfaces:**
- Consumes: None
- Produces: Working Vite development environment with Vitest + React Testing Library configured.

- [x] **Step 1: Write the failing sanity test**

```typescript
// src/test/sanity.test.ts
import { describe, it, expect } from 'vitest';

describe('Sanity test', () => {
  it('verifies testing environment is operational', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [x] **Step 2: Create package.json and project configuration files**

```json
// package.json
{
  "name": "portfolio",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "lucide-react": "^1.16.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tailwind-merge": "^3.5.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.2.0",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "jsdom": "^26.0.0",
    "postcss": "^8.5.3",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.3",
    "vite": "^6.1.1",
    "vitest": "^3.0.7"
  }
}
```

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0a',
        fg: '#e8e8e8',
        muted: '#6a6a6a',
        accent: '#00d4aa',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
```

```javascript
// postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

```html
<!-- index.html -->
<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
    <title>Personal Portfolio — Terminal Canvas</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,300;0,400;0,500;0,700;1,400&display=swap" rel="stylesheet">
  </head>
  <body class="bg-bg text-fg font-mono overflow-hidden select-none">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
```

- [x] **Step 3: Run test suite to verify testing environment**

Run: `npm test`
Expected: PASS with 1 passing test.

- [x] **Step 4: Commit**

```bash
git add package.json tsconfig.json vite.config.ts tailwind.config.js postcss.config.js index.html src/test/
git commit -m "chore: scaffold project structure with vite, tailwind, and vitest"
```

---

### Task 2: Data Models, Content Schema & Loader

**Files:**
- Create: `public/content/content.json`
- Create: `src/types/content.ts`
- Create: `src/utils/contentSchema.ts`
- Create: `src/utils/content.ts`
- Create: `src/utils/cn.ts`
- Test: `src/test/content.test.ts`

**Interfaces:**
- Consumes: `content.json`
- Produces:
  - `TerminalData`, `ContentSchema` types
  - `loadContent(): Promise<PortfolioContent>`
  - `defaultContent: PortfolioContent`
  - `cn(...inputs: ClassValue[]): string`

- [x] **Step 1: Write failing tests for content schema and loader**

```typescript
// src/test/content.test.ts
import { describe, it, expect } from 'vitest';
import { portfolioSchema, getDefaultContent, parseContent } from '../utils/contentSchema';

describe('Content Schema & Parser', () => {
  it('validates a correct portfolio structure', () => {
    const raw = {
      terminals: [
        {
          id: 'profile',
          title: '~/profile',
          position: { x: 0, y: 0 },
          size: { width: 380, height: 280 },
          lines: ['Hello world $ cat info.txt', 'Developer & Engineer'],
          links: [{ label: 'GitHub', url: 'https://github.com' }]
        }
      ]
    };
    const parsed = parseContent(raw);
    expect(parsed.terminals.length).toBe(1);
    expect(parsed.terminals[0].id).toBe('profile');
  });

  it('provides complete default content with all 8 terminals', () => {
    const def = getDefaultContent();
    expect(def.terminals.length).toBeGreaterThanOrEqual(8);
    const ids = def.terminals.map(t => t.id);
    expect(ids).toContain('profile');
    expect(ids).toContain('skills');
    expect(ids).toContain('work');
    expect(ids).toContain('projects');
    expect(ids).toContain('links');
    expect(ids).toContain('contact');
    expect(ids).toContain('now');
    expect(ids).toContain('secret');
  });
});
```

- [x] **Step 2: Implement types, schemas, and default content**

```typescript
// src/types/content.ts
export interface LinkItem {
  label: string;
  url: string;
  copy?: string;
}

export interface ImageRef {
  id: string;
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface TerminalData {
  id: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  lines: string[];
  links?: LinkItem[];
  images?: ImageRef[];
  typewriterSpeed?: number;
}

export interface PortfolioContent {
  terminals: TerminalData[];
}
```

```typescript
// src/utils/contentSchema.ts
import { z } from 'zod';
import { PortfolioContent } from '../types/content';

export const linkSchema = z.object({
  label: z.string(),
  url: z.string(),
  copy: z.string().optional(),
});

export const imageRefSchema = z.object({
  id: z.string(),
  src: z.string(),
  alt: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export const terminalDataSchema = z.object({
  id: z.string(),
  title: z.string(),
  position: z.object({ x: z.number(), y: z.number() }),
  size: z.object({ width: z.number(), height: z.number() }),
  lines: z.array(z.string()),
  links: z.array(linkSchema).optional(),
  images: z.array(imageRefSchema).optional(),
  typewriterSpeed: z.number().optional(),
});

export const portfolioSchema = z.object({
  terminals: z.array(terminalDataSchema),
});

export function parseContent(data: unknown): PortfolioContent {
  return portfolioSchema.parse(data);
}

export function getDefaultContent(): PortfolioContent {
  return {
    terminals: [
      {
        id: 'profile',
        title: '~/profile',
        position: { x: -360, y: -220 },
        size: { width: 400, height: 260 },
        lines: [
          'whoami',
          'Creative Developer & Systems Builder',
          'Passionate about interactive canvas graphics, resilient tooling, and web experiences.'
        ],
        links: [
          { label: 'GitHub', url: 'https://github.com' },
          { label: 'Twitter/X', url: 'https://x.com' }
        ]
      },
      {
        id: 'skills',
        title: '~/skills',
        position: { x: 120, y: -240 },
        size: { width: 380, height: 260 },
        lines: [
          'cat stack.txt',
          'Frontend: TypeScript, React, Vite, Tailwind CSS',
          'Backend: Node.js, Python, Go, GraphQL',
          'Systems: Docker, Git, Linux, WebGL/Canvas'
        ]
      },
      {
        id: 'work',
        title: '~/work',
        position: { x: -440, y: 120 },
        size: { width: 440, height: 320 },
        lines: [
          'history | grep experience',
          '2024 - Present: Senior Frontend Engineer @ TechLab',
          '  * Architected canvas-driven visualization tools',
          '2022 - 2024: Fullstack Developer @ CreativeCode',
          '  * Delivered real-time data monitoring interfaces'
        ]
      },
      {
        id: 'projects',
        title: '~/projects',
        position: { x: 80, y: 100 },
        size: { width: 420, height: 300 },
        lines: [
          'ls -la ./showcase',
          '1. Terminal Canvas Engine (This Site)',
          '2. Agentic Superpowers Toolset',
          '3. Quantum Graph Visualizer'
        ],
        links: [
          { label: 'View Source', url: 'https://github.com' }
        ]
      },
      {
        id: 'links',
        title: '~/links',
        position: { x: 540, y: -120 },
        size: { width: 340, height: 240 },
        lines: [
          'find ~/network -type link',
          'Connect across platforms:'
        ],
        links: [
          { label: 'Email', url: 'mailto:contact@example.com', copy: 'contact@example.com' },
          { label: 'LinkedIn', url: 'https://linkedin.com' },
          { label: 'Blog', url: 'https://example.com' }
        ]
      },
      {
        id: 'contact',
        title: '~/contact',
        position: { x: -160, y: 480 },
        size: { width: 380, height: 220 },
        lines: [
          'echo $CONTACT_INFO',
          'Open for collaborations, interesting engineering projects, and research.'
        ],
        links: [
          { label: 'Say Hello', url: 'mailto:hello@example.com' }
        ]
      },
      {
        id: 'now',
        title: '~/now',
        position: { x: 320, y: 460 },
        size: { width: 360, height: 240 },
        lines: [
          'cat /var/log/now.md',
          '📍 Current Location: Remote',
          '🔨 Working on: Generative web design & agentic systems',
          '📚 Reading: Physics simulation algorithms'
        ]
      },
      {
        id: 'secret',
        title: '~/secret',
        position: { x: 2000, y: 2000 },
        size: { width: 420, height: 280 },
        lines: [
          'cat flag.txt',
          '🎉 You found the Konami easter egg!',
          'Achievement Unlocked: Master Explorer'
        ]
      }
    ]
  };
}
```

```typescript
// src/utils/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

```typescript
// src/utils/content.ts
import { PortfolioContent } from '../types/content';
import { parseContent, getDefaultContent } from './contentSchema';

export async function loadContent(): Promise<PortfolioContent> {
  try {
    const res = await fetch('./content/content.json');
    if (!res.ok) {
      return getDefaultContent();
    }
    const json = await res.json();
    return parseContent(json);
  } catch {
    return getDefaultContent();
  }
}
```

- [x] **Step 3: Create public content JSON**

```json
// public/content/content.json
{
  "terminals": [
    {
      "id": "profile",
      "title": "~/profile",
      "position": { "x": -360, "y": -220 },
      "size": { "width": 400, "height": 260 },
      "lines": [
        "whoami",
        "Creative Developer & Systems Builder",
        "Passionate about interactive canvas graphics, resilient tooling, and web experiences."
      ],
      "links": [
        { "label": "GitHub", "url": "https://github.com" },
        { "label": "Twitter/X", "url": "https://x.com" }
      ]
    },
    {
      "id": "skills",
      "title": "~/skills",
      "position": { "x": 120, "y": -240 },
      "size": { "width": 380, "height": 260 },
      "lines": [
        "cat stack.txt",
        "Frontend: TypeScript, React, Vite, Tailwind CSS",
        "Backend: Node.js, Python, Go, GraphQL",
        "Systems: Docker, Git, Linux, WebGL/Canvas"
      ]
    },
    {
      "id": "work",
      "title": "~/work",
      "position": { "x": -440, "y": 120 },
      "size": { "width": 440, "height": 320 },
      "lines": [
        "history | grep experience",
        "2024 - Present: Senior Frontend Engineer @ TechLab",
        "  * Architected canvas-driven visualization tools",
        "2022 - 2024: Fullstack Developer @ CreativeCode",
        "  * Delivered real-time data monitoring interfaces"
      ]
    },
    {
      "id": "projects",
      "title": "~/projects",
      "position": { "x": 80, "y": 100 },
      "size": { "width": 420, "height": 300 },
      "lines": [
        "ls -la ./showcase",
        "1. Terminal Canvas Engine (This Site)",
        "2. Agentic Superpowers Toolset",
        "3. Quantum Graph Visualizer"
      ],
      "links": [
        { "label": "View Source", "url": "https://github.com" }
      ]
    },
    {
      "id": "links",
      "title": "~/links",
      "position": { "x": 540, "y": -120 },
      "size": { "width": 340, "height": 240 },
      "lines": [
        "find ~/network -type link",
        "Connect across platforms:"
      ],
      "links": [
        { "label": "Email", "url": "mailto:contact@example.com", "copy": "contact@example.com" },
        { "label": "LinkedIn", "url": "https://linkedin.com" },
        { "label": "Blog", "url": "https://example.com" }
      ]
    },
    {
      "id": "contact",
      "title": "~/contact",
      "position": { "x": -160, "y": 480 },
      "size": { "width": 380, "height": 220 },
      "lines": [
        "echo $CONTACT_INFO",
        "Open for collaborations, interesting engineering projects, and research."
      ],
      "links": [
        { "label": "Say Hello", "url": "mailto:hello@example.com" }
      ]
    },
    {
      "id": "now",
      "title": "~/now",
      "position": { "x": 320, "y": 460 },
      "size": { "width": 360, "height": 240 },
      "lines": [
        "cat /var/log/now.md",
        "📍 Current Location: Remote",
        "🔨 Working on: Generative web design & agentic systems",
        "📚 Reading: Physics simulation algorithms"
      ]
    },
    {
      "id": "secret",
      "title": "~/secret",
      "position": { "x": 2000, "y": 2000 },
      "size": { "width": 420, "height": 280 },
      "lines": [
        "cat flag.txt",
        "🎉 You found the Konami easter egg!",
        "Achievement Unlocked: Master Explorer"
      ]
    }
  ]
}
```

- [x] **Step 4: Run tests to verify schema and loader**

Run: `npm test`
Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add public/content/content.json src/types/ src/utils/ src/test/content.test.ts
git commit -m "feat(content): implement schema validation, loader, and default terminal content"
```

---

### Task 3: Canvas Engine, Camera Transformations & Dot Grid

**Files:**
- Create: `src/canvas/types.ts`
- Create: `src/canvas/Camera.ts`
- Create: `src/canvas/CanvasEngine.ts`
- Create: `src/canvas/DotGrid.ts`
- Test: `src/test/canvas.test.ts`

**Interfaces:**
- Consumes: None
- Produces:
  - `Camera` with `worldToScreen`, `screenToWorld`, `zoomAt`, `pan`
  - `DotGrid` with viewport culling
  - `CanvasEngine` managing animation frame rendering

- [x] **Step 1: Write failing tests for Camera coordinate transformations**

```typescript
// src/test/canvas.test.ts
import { describe, it, expect } from 'vitest';
import { Camera } from '../canvas/Camera';

describe('Camera & Coordinate Transformations', () => {
  it('converts world coordinates to screen coordinates at 1.0 zoom centered at origin', () => {
    const camera = new Camera({ x: 0, y: 0 }, 1.0, { width: 800, height: 600 });
    const screen = camera.worldToScreen({ x: 100, y: 50 });
    expect(screen.x).toBe(500); // 800/2 + 100
    expect(screen.y).toBe(350); // 600/2 + 50
  });

  it('converts screen coordinates back to world coordinates', () => {
    const camera = new Camera({ x: 50, y: -20 }, 1.5, { width: 1000, height: 800 });
    const screenPoint = { x: 600, y: 400 };
    const worldPoint = camera.screenToWorld(screenPoint);
    const convertedBack = camera.worldToScreen(worldPoint);

    expect(Math.round(convertedBack.x)).toBe(screenPoint.x);
    expect(Math.round(convertedBack.y)).toBe(screenPoint.y);
  });

  it('clamps zoom levels within specified bounds [0.3, 3.0]', () => {
    const camera = new Camera({ x: 0, y: 0 }, 1.0, { width: 800, height: 600 });
    camera.setZoom(0.1);
    expect(camera.zoom).toBe(0.3);
    camera.setZoom(5.0);
    expect(camera.zoom).toBe(3.0);
  });
});
```

- [x] **Step 2: Implement Camera and CanvasEngine components**

```typescript
// src/canvas/types.ts
export interface Vector2 {
  x: number;
  y: number;
}

export interface ViewportSize {
  width: number;
  height: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}
```

```typescript
// src/canvas/Camera.ts
import { Vector2, ViewportSize, Bounds } from './types';

export class Camera {
  public position: Vector2;
  public zoom: number;
  public viewport: ViewportSize;
  public readonly minZoom = 0.3;
  public readonly maxZoom = 3.0;

  constructor(position: Vector2 = { x: 0, y: 0 }, zoom = 1.0, viewport: ViewportSize = { width: 800, height: 600 }) {
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
    const bottomRight = this.screenToWorld({ x: this.viewport.width + margin, y: this.viewport.height + margin });
    return {
      minX: Math.min(topLeft.x, bottomRight.x),
      minY: Math.min(topLeft.y, bottomRight.y),
      maxX: Math.max(topLeft.x, bottomRight.x),
      maxY: Math.max(topLeft.y, bottomRight.y),
    };
  }
}
```

```typescript
// src/canvas/DotGrid.ts
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
```

- [x] **Step 3: Run tests to verify camera math**

Run: `npm test`
Expected: PASS.

- [x] **Step 4: Commit**

```bash
git add src/canvas/ src/test/canvas.test.ts
git commit -m "feat(canvas): implement Camera coordinate transforms and DotGrid culling"
```

---

### Task 4: Verlet Physics Engine & Node Connections

**Files:**
- Create: `src/canvas/Physics.ts`
- Test: `src/test/physics.test.ts`

**Interfaces:**
- Consumes: `Vector2` from `src/canvas/types.ts`
- Produces:
  - `Particle`, `PhysicsEngine` class with `update(dt)`, `pin(id)`, `unpin(id)`, `setPosition(id, pos)`

- [x] **Step 1: Write failing tests for Verlet integration & repulsion**

```typescript
// src/test/physics.test.ts
import { describe, it, expect } from 'vitest';
import { PhysicsEngine } from '../canvas/Physics';

describe('Verlet Physics Engine', () => {
  it('initializes particles with given positions', () => {
    const engine = new PhysicsEngine();
    engine.addParticle('p1', { x: 0, y: 0 });
    engine.addParticle('p2', { x: 100, y: 0 });

    const p1 = engine.getParticle('p1');
    expect(p1?.position.x).toBe(0);
    expect(p1?.pinned).toBe(false);
  });

  it('preserves pinned particle position during physics steps', () => {
    const engine = new PhysicsEngine();
    engine.addParticle('p1', { x: 0, y: 0 });
    engine.addParticle('p2', { x: 10, y: 0 }); // will repel

    engine.pin('p1');
    engine.setPosition('p1', { x: -50, y: -50 });
    engine.update(1 / 60);

    const p1 = engine.getParticle('p1');
    expect(p1?.position.x).toBe(-50);
    expect(p1?.position.y).toBe(-50);
  });

  it('applies spring and repulsion forces between unpinned particles', () => {
    const engine = new PhysicsEngine();
    engine.addParticle('p1', { x: 0, y: 0 });
    engine.addParticle('p2', { x: 500, y: 0 }); // restLength is 280, should attract
    
    engine.update(1 / 60);
    const p1 = engine.getParticle('p1');
    const p2 = engine.getParticle('p2');

    expect(p1!.position.x).toBeGreaterThan(0);
    expect(p2!.position.x).toBeLessThan(500);
  });
});
```

- [x] **Step 2: Implement Verlet Physics Engine**

```typescript
// src/canvas/Physics.ts
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
  public restLength = 280;
  public springK = 0.02;
  public repulsionK = 50000;
  public centerAttractionK = 0.0001;
  public damping = 0.96;

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

      // Weak center attraction
      p1.acceleration.x -= p1.position.x * this.centerAttractionK;
      p1.acceleration.y -= p1.position.y * this.centerAttractionK;

      for (let j = i + 1; j < particleList.length; j++) {
        const p2 = particleList[j];
        const dx = p2.position.x - p1.position.x;
        const dy = p2.position.y - p1.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const dirX = dx / dist;
        const dirY = dy / dist;

        // Repulsion (all pairs)
        const repForce = Math.min(100, this.repulsionK / (dist * dist));
        p1.acceleration.x -= dirX * repForce;
        p1.acceleration.y -= dirY * repForce;
        p2.acceleration.x += dirX * repForce;
        p2.acceleration.y += dirY * repForce;

        // Spring connection (all pairs mesh)
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
      const p1 = worldToScreen(particleList[i].position);
      for (let j = i + 1; j < particleList.length; j++) {
        const p2 = worldToScreen(particleList[j].position);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }
  }
}
```

- [x] **Step 3: Run tests to verify physics equations**

Run: `npm test`
Expected: PASS.

- [x] **Step 4: Commit**

```bash
git add src/canvas/Physics.ts src/test/physics.test.ts
git commit -m "feat(physics): implement Verlet integration, repulsion, and spring mesh connections"
```

---

### Task 5: Glassmorphic Terminal Component, Typewriter & Drag Hooks

**Files:**
- Create: `src/hooks/useLocalStorage.ts`
- Create: `src/hooks/useReducedMotion.ts`
- Create: `src/terminals/useTypewriter.ts`
- Create: `src/terminals/useDraggable.ts`
- Create: `src/terminals/Terminal.tsx`
- Create: `src/styles/terminal.css`
- Test: `src/test/typewriter.test.ts`

**Interfaces:**
- Consumes: `TerminalData` from `src/types/content.ts`
- Produces:
  - `useTypewriter(lines, speed, onComplete)`
  - `useDraggable(...)`
  - `Terminal` React component with glassmorphism styling and interactive actions

- [x] **Step 1: Write failing test for typewriter state machine**

```typescript
// src/test/typewriter.test.ts
import { describe, it, expect } from 'vitest';
import { calculateTypewriterProgress } from '../terminals/useTypewriter';

describe('Typewriter utility calculation', () => {
  it('calculates full text when progress is complete', () => {
    const lines = ['First line', 'Second line'];
    const rendered = calculateTypewriterProgress(lines, 100);
    expect(rendered).toEqual(['First line', 'Second line']);
  });

  it('renders partial lines accurately during typing progress', () => {
    const lines = ['Hello', 'World'];
    // 5 chars in 'Hello', total 10 chars
    const rendered = calculateTypewriterProgress(lines, 3);
    expect(rendered).toEqual(['Hel']);
  });
});
```

- [x] **Step 2: Implement hooks and Terminal component**

```typescript
// src/hooks/useLocalStorage.ts
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch {
      // Ignore write errors
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
```

```typescript
// src/hooks/useReducedMotion.ts
import { useState, useEffect } from 'react';

export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => setPrefersReduced(event.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReduced;
}
```

```typescript
// src/terminals/useTypewriter.ts
import { useState, useEffect, useRef } from 'react';

export function calculateTypewriterProgress(lines: string[], charCount: number): string[] {
  let remaining = charCount;
  const result: string[] = [];

  for (const line of lines) {
    if (remaining <= 0) break;
    if (remaining >= line.length) {
      result.push(line);
      remaining -= line.length;
    } else {
      result.push(line.slice(0, remaining));
      remaining = 0;
    }
  }
  return result;
}

export function useTypewriter(lines: string[], speed = 25, isVisible = true, reducedMotion = false) {
  const totalChars = lines.reduce((acc, l) => acc + l.length, 0);
  const [charIndex, setCharIndex] = useState(reducedMotion ? totalChars : 0);
  const [isComplete, setIsComplete] = useState(reducedMotion);
  const timerRef = useRef<number | null>(null);

  const completeInstantly = () => {
    setCharIndex(totalChars);
    setIsComplete(true);
  };

  useEffect(() => {
    if (reducedMotion) {
      completeInstantly();
      return;
    }

    if (!isVisible || isComplete) return;

    timerRef.current = window.setInterval(() => {
      setCharIndex((prev) => {
        if (prev + 1 >= totalChars) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsComplete(true);
          return totalChars;
        }
        return prev + 1;
      });
    }, speed);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isVisible, speed, totalChars, isComplete, reducedMotion]);

  const visibleLines = calculateTypewriterProgress(lines, charIndex);

  return {
    visibleLines,
    isComplete,
    completeInstantly,
  };
}
```

```tsx
// src/terminals/Terminal.tsx
import React, { useState, useRef } from 'react';
import { TerminalData } from '../types/content';
import { useTypewriter } from './useTypewriter';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { ExternalLink, Copy, Check } from 'lucide-react';
import { cn } from '../utils/cn';

interface TerminalProps {
  data: TerminalData;
  screenPos: { x: number; y: number };
  zoom: number;
  onDragStart?: (id: string, e: React.PointerEvent) => void;
  isFocused?: boolean;
}

export const Terminal: React.FC<TerminalProps> = ({
  data,
  screenPos,
  zoom,
  onDragStart,
  isFocused = false,
}) => {
  const reducedMotion = useReducedMotion();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const { visibleLines, isComplete, completeInstantly } = useTypewriter(
    data.lines,
    data.typewriterSpeed || 25,
    true,
    reducedMotion
  );

  const handleCopy = (text: string, index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div
      ref={terminalRef}
      tabIndex={0}
      onClick={completeInstantly}
      style={{
        transform: `translate3d(${screenPos.x}px, ${screenPos.y}px, 0) scale(${zoom})`,
        transformOrigin: 'top left',
        width: `${data.size.width}px`,
      }}
      className={cn(
        'absolute select-text rounded-xl border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md shadow-2xl transition-shadow text-xs leading-relaxed text-[#e8e8e8] outline-none',
        isFocused ? 'ring-2 ring-accent shadow-[0_0_25px_rgba(0,212,170,0.3)]' : 'hover:border-white/20'
      )}
    >
      {/* Header / Drag handle */}
      <div
        onPointerDown={(e) => onDragStart && onDragStart(data.id, e)}
        className="flex items-center justify-between px-3 py-2 border-b border-white/10 cursor-grab active:cursor-grabbing bg-white/5 rounded-t-xl select-none"
      >
        <span className="font-mono text-accent font-semibold tracking-wider">{data.title}</span>
        <div className="flex space-x-1.5 opacity-60">
          <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
        </div>
      </div>

      {/* Terminal Content */}
      <div className="p-4 space-y-2 font-mono">
        {visibleLines.map((line, idx) => (
          <div key={idx} className="flex items-start space-x-2">
            {idx === 0 && <span className="text-accent">$</span>}
            <span className={idx === 0 ? 'text-white font-medium' : 'text-fg/90'}>{line}</span>
          </div>
        ))}

        {!isComplete && (
          <span className="inline-block w-2 h-4 bg-accent animate-pulse align-middle ml-1" />
        )}

        {/* Action Links */}
        {data.links && data.links.length > 0 && isComplete && (
          <div className="pt-3 mt-3 border-t border-white/5 flex flex-wrap gap-2">
            {data.links.map((link, idx) => (
              <div key={idx} className="flex items-center">
                {link.copy ? (
                  <button
                    onClick={(e) => handleCopy(link.copy!, idx, e)}
                    className="inline-flex items-center space-x-1 text-accent hover:text-accent/80 bg-accent/10 px-2 py-1 rounded text-[11px] transition-colors"
                  >
                    {copiedIndex === idx ? <Check size={12} /> : <Copy size={12} />}
                    <span>{link.label}</span>
                  </button>
                ) : (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-accent hover:underline bg-accent/10 px-2 py-1 rounded text-[11px]"
                  >
                    <span>{link.label}</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
```

- [x] **Step 3: Run tests to verify typewriter logic**

Run: `npm test`
Expected: PASS.

- [x] **Step 4: Commit**

```bash
git add src/hooks/ src/terminals/ src/styles/ src/test/typewriter.test.ts
git commit -m "feat(terminal): add glassmorphic Terminal component, typewriter animation, and persistence hooks"
```

---

### Task 6: UI Overlays (MiniMap, Help Modal, Konami Code Listener)

**Files:**
- Create: `src/ui/MiniMap.tsx`
- Create: `src/ui/HelpOverlay.tsx`
- Create: `src/hooks/useKonamiCode.ts`
- Test: `src/test/konami.test.ts`

**Interfaces:**
- Consumes: `Camera`, `TerminalData`
- Produces:
  - `MiniMap` component (top-right overview + click to center)
  - `HelpOverlay` component (`?` toggle shortcut dialog)
  - `useKonamiCode(onSuccess)` hook for Easter egg activation

- [x] **Step 1: Write failing test for Konami sequence matching**

```typescript
// src/test/konami.test.ts
import { describe, it, expect } from 'vitest';
import { checkKonamiSequence } from '../hooks/useKonamiCode';

describe('Konami Code Sequence Checker', () => {
  const sequence = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'KeyB', 'KeyA'
  ];

  it('validates the complete correct Konami sequence', () => {
    expect(checkKonamiSequence(sequence)).toBe(true);
  });

  it('rejects an incomplete or incorrect sequence', () => {
    expect(checkKonamiSequence([...sequence.slice(0, -1), 'KeyC'])).toBe(false);
  });
});
```

- [x] **Step 2: Implement MiniMap, HelpOverlay, and Konami Code hook**

```typescript
// src/hooks/useKonamiCode.ts
import { useState, useEffect } from 'react';

const KONAMI_SEQUENCE = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'KeyB', 'KeyA',
];

export function checkKonamiSequence(keys: string[]): boolean {
  if (keys.length !== KONAMI_SEQUENCE.length) return false;
  return keys.every((key, i) => key.toLowerCase() === KONAMI_SEQUENCE[i].toLowerCase() || key === KONAMI_SEQUENCE[i]);
}

export function useKonamiCode(onSuccess: () => void) {
  const [keys, setKeys] = useState<string[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      setKeys((prev) => {
        const next = [...prev, code].slice(-KONAMI_SEQUENCE.length);
        if (checkKonamiSequence(next)) {
          onSuccess();
          return [];
        }
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSuccess]);
}
```

```tsx
// src/ui/MiniMap.tsx
import React from 'react';
import { TerminalData } from '../types/content';
import { Camera } from '../canvas/Camera';

interface MiniMapProps {
  terminals: TerminalData[];
  camera: Camera;
  onJumpTo: (x: number, y: number) => void;
}

export const MiniMap: React.FC<MiniMapProps> = ({ terminals, camera, onJumpTo }) => {
  const mapWidth = 180;
  const mapHeight = 130;
  const worldSpan = 3000;

  const toMapCoord = (x: number, y: number) => ({
    x: ((x + worldSpan / 2) / worldSpan) * mapWidth,
    y: ((y + worldSpan / 2) / worldSpan) * mapHeight,
  });

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const targetX = (clickX / mapWidth) * worldSpan - worldSpan / 2;
    const targetY = (clickY / mapHeight) * worldSpan - worldSpan / 2;
    onJumpTo(targetX, targetY);
  };

  const camCenter = toMapCoord(camera.position.x, camera.position.y);
  const viewWidth = Math.max(16, (camera.viewport.width / (camera.zoom * worldSpan)) * mapWidth);
  const viewHeight = Math.max(12, (camera.viewport.height / (camera.zoom * worldSpan)) * mapHeight);

  return (
    <div
      onClick={handleClick}
      className="hidden sm:block absolute top-4 right-4 bg-[#0a0a0a]/90 border border-white/15 rounded-lg overflow-hidden cursor-crosshair shadow-xl backdrop-blur-md z-30"
      style={{ width: `${mapWidth}px`, height: `${mapHeight}px` }}
    >
      {/* Grid crosshair center */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
        <div className="w-full h-px bg-white" />
        <div className="h-full w-px bg-white absolute" />
      </div>

      {/* Terminal markers */}
      {terminals.map((t) => {
        const pt = toMapCoord(t.position.x, t.position.y);
        return (
          <div
            key={t.id}
            className="absolute w-2 h-2 -translate-x-1 -translate-y-1 bg-accent/80 rounded-sm"
            style={{ left: `${pt.x}px`, top: `${pt.y}px` }}
          />
        );
      })}

      {/* Viewport boundary indicator */}
      <div
        className="absolute border border-accent bg-accent/10 pointer-events-none transition-all"
        style={{
          left: `${camCenter.x - viewWidth / 2}px`,
          top: `${camCenter.y - viewHeight / 2}px`,
          width: `${viewWidth}px`,
          height: `${viewHeight}px`,
        }}
      />
    </div>
  );
};
```

```tsx
// src/ui/HelpOverlay.tsx
import React from 'react';
import { X, Command } from 'lucide-react';

interface HelpOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpOverlay: React.FC<HelpOverlayProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Drag / Touch', desc: 'Pan infinite canvas' },
    { key: 'Mouse Wheel / Pinch', desc: 'Zoom in and out' },
    { key: 'Tab / Shift+Tab', desc: 'Focus through terminals' },
    { key: '+ / -', desc: 'Zoom in / Zoom out' },
    { key: '0', desc: 'Reset camera position' },
    { key: 'Click Header', desc: 'Drag terminal node' },
    { key: 'Click Body', desc: 'Instantly finish typewriter' },
    { key: '?', desc: 'Toggle keyboard shortcuts' },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f0f0f] border border-white/15 rounded-xl max-w-md w-full p-6 shadow-2xl font-mono text-xs">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-2 text-accent">
            <Command size={16} />
            <span className="font-bold uppercase tracking-wider">Canvas Controls & Shortcuts</span>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {shortcuts.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-1">
              <span className="text-fg/90">{item.desc}</span>
              <kbd className="bg-white/10 px-2 py-0.5 rounded text-accent border border-white/10">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 text-center text-[11px] text-muted">
          Press <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-fg">Esc</kbd> or click outside to dismiss
        </div>
      </div>
    </div>
  );
};
```

- [x] **Step 3: Run tests to verify Konami logic**

Run: `npm test`
Expected: PASS.

- [x] **Step 4: Commit**

```bash
git add src/ui/ src/hooks/useKonamiCode.ts src/test/konami.test.ts
git commit -m "feat(ui): implement MiniMap, HelpOverlay shortcuts, and Konami code trigger"
```

---

### Task 7: Mobile Responsiveness, Canvas Integration & Main App

**Files:**
- Create: `src/App.tsx`
- Create: `src/main.tsx`
- Create: `src/styles/globals.css`
- Test: `src/test/app.test.tsx`

**Interfaces:**
- Consumes: All components, hooks, canvas engines, and schemas
- Produces: Complete, interactive Single Page Application

- [x] **Step 1: Write failing test for main App rendering**

```tsx
// src/test/app.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('Portfolio App Main Component', () => {
  it('renders canvas layer and initial terminals', async () => {
    render(<App />);
    expect(screen.getByText(/profile/i)).toBeInTheDocument();
  });
});
```

- [x] **Step 2: Implement App.tsx and root stylesheets**

```css
/* src/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg: #0a0a0a;
  --fg: #e8e8e8;
  --muted: #6a6a6a;
  --accent: #00d4aa;
}

body {
  background-color: var(--bg);
  color: var(--fg);
  font-family: 'JetBrains Mono', monospace;
  user-select: none;
  overflow: hidden;
}

::selection {
  background: var(--accent);
  color: #0a0a0a;
}
```

```tsx
// src/App.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera } from './canvas/Camera';
import { DotGrid } from './canvas/DotGrid';
import { PhysicsEngine } from './canvas/Physics';
import { Terminal } from './terminals/Terminal';
import { MiniMap } from './ui/MiniMap';
import { HelpOverlay } from './ui/HelpOverlay';
import { loadContent } from './utils/content';
import { PortfolioContent, TerminalData } from './types/content';
import { useKonamiCode } from './hooks/useKonamiCode';
import { Map as MapIcon, HelpCircle } from 'lucide-react';

export default function App() {
  const [content, setContent] = useState<PortfolioContent | null>(null);
  const [camera] = useState(() => new Camera({ x: 0, y: 0 }, 1.0));
  const [dotGrid] = useState(() => new DotGrid());
  const [physics] = useState(() => new PhysicsEngine());
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isMobileMapOpen, setIsMobileMapOpen] = useState(false);
  const [isSecretUnlocked, setIsSecretUnlocked] = useState(false);
  const [renderTick, setRenderTick] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingCanvas = useRef(false);
  const dragStartPoint = useRef({ x: 0, y: 0 });
  const draggedParticleId = useRef<string | null>(null);

  // Load content
  useEffect(() => {
    loadContent().then((data) => {
      setContent(data);
      data.terminals.forEach((t) => {
        // Read persisted positions if available
        const saved = localStorage.getItem(`portfolio:pos:${t.id}`);
        const pos = saved ? JSON.parse(saved) : t.position;
        physics.addParticle(t.id, pos);
      });
    });
  }, [physics]);

  // Unlock secret on Konami
  useKonamiCode(() => {
    setIsSecretUnlocked(true);
    camera.position = { x: 2000, y: 2000 };
  });

  // Global key controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?') setIsHelpOpen((prev) => !prev);
      if (e.key === 'Escape') setIsHelpOpen(false);
      if (e.key === '0') {
        camera.position = { x: 0, y: 0 };
        camera.setZoom(1.0);
      }
      if (e.key === '+' || e.key === '=') camera.setZoom(camera.zoom * 1.15);
      if (e.key === '-' || e.key === '_') camera.setZoom(camera.zoom * 0.85);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [camera]);

  // Main Canvas & Physics animation loop
  useEffect(() => {
    let animId: number;

    const loop = () => {
      physics.update(1 / 60);

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          dotGrid.render(ctx, camera);
          physics.renderConnections(ctx, (v) => camera.worldToScreen(v));
        }
      }

      setRenderTick((t) => t + 1);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [camera, dotGrid, physics]);

  // Canvas resize listener
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        camera.setViewport(window.innerWidth, window.innerHeight);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [camera]);

  // Pointer interactions for Canvas pan/zoom
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).tagName === 'CANVAS') {
      isDraggingCanvas.current = true;
      dragStartPoint.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (draggedParticleId.current) {
      const worldPos = camera.screenToWorld({ x: e.clientX, y: e.clientY });
      physics.setPosition(draggedParticleId.current, worldPos);
      localStorage.setItem(`portfolio:pos:${draggedParticleId.current}`, JSON.stringify(worldPos));
    } else if (isDraggingCanvas.current) {
      const dx = e.clientX - dragStartPoint.current.x;
      const dy = e.clientY - dragStartPoint.current.y;
      camera.pan(dx, dy);
      dragStartPoint.current = { x: e.clientX, y: e.clientY };
    }
  }, [camera, physics]);

  const handlePointerUp = () => {
    if (draggedParticleId.current) {
      physics.unpin(draggedParticleId.current);
      draggedParticleId.current = null;
    }
    isDraggingCanvas.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = -e.deltaY * 0.001;
    camera.zoomAt({ x: e.clientX, y: e.clientY }, delta);
  };

  const handleTerminalDragStart = (id: string, e: React.PointerEvent) => {
    e.stopPropagation();
    draggedParticleId.current = id;
    physics.pin(id);
  };

  const terminalsToRender = content?.terminals.filter(
    (t) => t.id !== 'secret' || isSecretUnlocked
  ) || [];

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      className="relative w-screen h-screen overflow-hidden bg-bg"
    >
      {/* Canvas Layer */}
      <canvas ref={canvasRef} className="absolute inset-0 block cursor-grab active:cursor-grabbing" />

      {/* Floating Terminals Layer (Desktop Canvas Mode) */}
      <div className="hidden sm:block absolute inset-0 pointer-events-none">
        {terminalsToRender.map((t) => {
          const particle = physics.getParticle(t.id);
          const pos = particle ? particle.position : t.position;
          const screenPos = camera.worldToScreen(pos);

          return (
            <div key={t.id} className="pointer-events-auto">
              <Terminal
                data={t}
                screenPos={screenPos}
                zoom={camera.zoom}
                onDragStart={handleTerminalDragStart}
              />
            </div>
          );
        })}
      </div>

      {/* Mobile Stack Fallback Mode */}
      <div className="sm:hidden absolute inset-0 overflow-y-auto p-4 space-y-4 pb-20">
        {terminalsToRender.map((t) => (
          <Terminal
            key={t.id}
            data={t}
            screenPos={{ x: 0, y: 0 }}
            zoom={1.0}
          />
        ))}
      </div>

      {/* MiniMap Overlay */}
      <MiniMap
        terminals={terminalsToRender}
        camera={camera}
        onJumpTo={(x, y) => {
          camera.position = { x, y };
        }}
      />

      {/* Bottom Floating Toolbar */}
      <div className="absolute bottom-4 right-4 flex items-center space-x-2 z-40">
        <button
          onClick={() => setIsHelpOpen(true)}
          className="p-2.5 bg-[#0f0f0f]/90 border border-white/10 rounded-full text-muted hover:text-accent shadow-lg backdrop-blur-md transition-colors"
          title="Keyboard shortcuts (?)"
        >
          <HelpCircle size={18} />
        </button>

        <button
          onClick={() => setIsMobileMapOpen(true)}
          className="sm:hidden flex items-center space-x-1.5 px-3 py-2 bg-accent text-bg font-bold rounded-full text-xs shadow-lg"
        >
          <MapIcon size={16} />
          <span>Map</span>
        </button>
      </div>

      {/* Help Modal */}
      <HelpOverlay isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
```

```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [x] **Step 3: Run test suite & build verification**

Run: `npm test && npm run build`
Expected: PASS with all tests passing and `dist/` bundle created without type or lint errors.

- [x] **Step 4: Commit**

```bash
git add src/App.tsx src/main.tsx src/styles/globals.css src/test/app.test.tsx
git commit -m "feat: assemble interactive terminal canvas app with mobile stacking and toolbar"
```

---

### Task 8: GitHub Actions CI/CD Deployment Workflow

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `README.md`
- Test: Build verification (`npm run build`)

**Interfaces:**
- Consumes: Vite production build
- Produces: GitHub Pages automated deployment pipeline

- [x] **Step 1: Create GitHub Pages workflow file**

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [x] **Step 2: Create project README.md documentation**

```markdown
# Experimental Terminal Canvas Portfolio

An interactive, canvas-driven developer portfolio built with React, TypeScript, and Tailwind CSS.

## Features
- **2D Infinite Dot Grid Canvas**: Smooth pan and zoom camera with viewport culling.
- **Verlet Physics Engine**: Aesthetic spring mesh and repulsion forces between terminals.
- **Glassmorphism Terminals**: Draggable floating cards with typewriter animations and localStorage position persistence.
- **Single Source of Truth**: Editable `public/content/content.json` with runtime Zod validation.
- **Mobile Responsive**: Graceful vertical stacking with touch support and map modal.
- **Easter Egg**: Secret Konami code trigger (`↑ ↑ ↓ ↓ ← → ← → B A`).

## Scripts
- `npm run dev`: Launch local development server
- `npm run build`: Typecheck and bundle for production
- `npm test`: Run Vitest unit tests
```

- [x] **Step 3: Verify build and test suite**

Run: `npm run build && npm test`
Expected: PASS.

- [x] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml README.md
git commit -m "chore(ci): add GitHub Actions Pages deployment pipeline and documentation"
```
