# Interactive Portfolio Design Spec

**Date:** 2026-08-21  
**Status:** Approved for Implementation  
**Project:** Personal Portfolio — Experimental Terminal Canvas

---

## 1. Vision & Goals

### Core Concept
An infinite 2D dotted canvas with floating glassmorphism terminals as nodes. Terminals contain profile, skills, work history, projects, links, contact, and a "now" page. Physics-based connections between terminals (purely aesthetic). Pan/zoom navigation. Typewriter animations. Draggable terminals with persisted positions. Hidden CLI easter egg.

### Target Feel
- **Experimental/Playful** — surprising interactions, shows personality
- **Technical/Deep** — appeals to fellow developers
- **Keyboard-first** — power-user affordances
- **Desktop-focused** with graceful mobile fallback

### Success Criteria
- Loads in <2s on 3G
- 60fps physics + canvas on 5-year-old hardware
- Fully navigable via keyboard
- Works on mobile (stacked terminals, touch pan/zoom)
- Deploys to GitHub Pages with zero config

---

## 2. Architecture

### Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Build** | Vite + React 18 + TypeScript | Fast HMR, tree-shaking, modern defaults |
| **Styling** | Tailwind CSS + CSS Variables | Utility-first, design tokens, dark-mode ready |
| **Canvas** | Vanilla `<canvas>` 2D API | Lightweight, no WebGL overhead for dots/lines |
| **Physics** | Custom Verlet integration | 6-8 nodes = trivial; no external deps |
| **Icons** | `lucide-react` | Tree-shakable, consistent stroke style |
| **Font** | `JetBrains Mono` (variable) | Monospace, coding aesthetic, weight control |
| **Deploy** | GitHub Actions → GitHub Pages | Free, integrated, custom domain support |

### High-Level Data Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│ content.json │────▶│  App.tsx     │────▶│  Terminal[]     │
└─────────────┘     │  (layout)    │     │  (components)   │
                    └──────┬───────┘     └────────┬────────┘
                           │                      │
                    ┌──────▼───────┐     ┌────────▼────────┐
                    │ CanvasEngine │     │  Physics Engine │
                    │ (pan/zoom,   │◀───▶│  (positions)    │
                    │  dot grid)   │     └─────────────────┘
                    └──────────────┘
```

### Component Hierarchy

```
App
├── CanvasLayer (canvas ref, pan/zoom state)
│   ├── DotGrid (viewport-culled rendering)
│   ├── ConnectionLines (physics-driven)
│   └── MiniMap (corner overlay)
├── TerminalLayer (absolute positioned terminals)
│   ├── Terminal[id=profile] (TerminalShell + ProfileContent)
│   ├── Terminal[id=skills]  (TerminalShell + SkillsContent)
│   ├── Terminal[id=work]    (TerminalShell + WorkContent)
│   ├── Terminal[id=projects](TerminalShell + ProjectsContent)
│   ├── Terminal[id=links]   (TerminalShell + LinksContent)
│   ├── Terminal[id=contact] (TerminalShell + ContactContent)
│   ├── Terminal[id=now]     (TerminalShell + NowContent)
│   └── Terminal[id=secret]  (HiddenCLI easter egg)
├── HelpOverlay (keyboard shortcuts)
└── HiddenCLI (konami-activated command palette)
```

---

## 3. Canvas Layer Specification

### 3.1 Dot Grid

- **Spacing:** 48px (configurable via CSS variable `--grid-spacing`)
- **Dot radius:** 1px
- **Opacity:** 0.1 (base), 0.05 (zoomed out), 0.15 (zoomed in)
- **Color:** `var(--fg)` / `#e8e8e8` with opacity
- **Viewport culling:** Only draw dots within `camera.bounds + margin`
- **Redraw:** On pan/zoom/resize; `requestAnimationFrame` loop

### 3.2 Camera (Pan/Zoom)

| Property | Value |
|----------|-------|
| **Initial zoom** | 1.0 |
| **Zoom range** | 0.3x – 3.0x |
| **Zoom step (wheel)** | 0.1x per notch |
| **Zoom center** | Mouse cursor position |
| **Pan** | Mouse drag (left button) or touch drag (1 finger) |
| **Pinch zoom** | 2-finger touch |
| **Momentum** | Optional: deceleration on release |

### 3.3 Coordinate System

- **World coordinates:** Canvas space (0,0 at center initially)
- **Screen coordinates:** Viewport pixels
- **Terminal positions:** Stored in world coordinates
- **Conversion:** `screen = (world - camera.position) * camera.zoom`

### 3.4 Mini-Map

- **Position:** Top-right, fixed 200×150px
- **Shows:** All terminal positions as colored dots
- **Viewport indicator:** Semi-transparent rectangle
- **Click:** Jumps camera to position
- **Hidden on mobile** (< 600px)

---

## 4. Physics System Specification

### 4.1 Verlet Integration

```typescript
interface Particle {
  id: string;
  position: Vector2;      // current
  previous: Vector2;      // previous frame
  acceleration: Vector2;  // accumulated forces
  pinned: boolean;        // true while dragging
  mass: number;           // 1.0 default
}

const SUBSTEPS = 2;
const DT = 1/60 / SUBSTEPS;

function verletUpdate(particles: Particle[], dt: number) {
  for (const p of particles) {
    if (p.pinned) continue;
    const velocity = p.position - p.previous;
    p.previous = p.position;
    p.position += velocity + p.acceleration * dt * dt;
    p.acceleration = { x: 0, y: 0 };
  }
}
```

### 4.2 Forces

| Force | Formula | Parameters |
|-------|---------|------------|
| **Spring** (connected) | `F = -k * (dist - restLength) * dir` | `k=0.02`, `restLength=280px` |
| **Repulsion** (all pairs) | `F = k / dist² * dir` | `k=50000`, `minDist=120px` |
| **Center attraction** | `F = -k * position` | `k=0.0001` (weak) |
| **Drag damping** | `v *= 0.99` per frame | Applied to velocity |

### 4.3 Connections (Aesthetic Only)

- **Graph:** Fully connected mesh (each terminal connects to all others)
- **Visual:** Lines drawn between terminal centers
- **Style:** `stroke: rgba(255,255,255,0.06)`, `strokeWidth: 1`, `lineCap: round`
- **No semantic meaning** — purely visual spacing

### 4.4 Drag Interaction

- **On pointerdown:** `particle.pinned = true`
- **On pointermove:** `particle.position = screenToWorld(clientX, clientY)`
- **On pointerup:** `particle.pinned = false`, persist to `localStorage`
- **Persistence key:** `portfolio:terminal-positions:{terminalId}`

---

## 5. Terminal Specification

### 5.1 Visual Design (Glassmorphism)

```css
.terminal {
  --glass-bg: rgba(10, 10, 10, 0.7);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-shadow: 0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05);
  
  background: var(--glass-bg);
  backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  box-shadow: var(--glass-shadow);
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  line-height: 1.7;
  color: #e8e8e8;
  min-width: 320px;
  max-width: 560px;
  max-height: 70vh;
  overflow: auto;
}
```

### 5.2 Terminal Anatomy

```
┌────────────────────────────────────────┐
│  ~/terminal-title          ● ● ●       │  ← Header (non-draggable area)
├────────────────────────────────────────┤
│  $ command_that_types_out              │  ← Typewriter line (green prompt)
│  output line 1                         │  ← Static content
│  output line 2                         │
│  █                                     │  ← Blinking cursor (last line)
└────────────────────────────────────────┘
```

- **Header:** Terminal title (monospace, uppercase, `letter-spacing: 0.05em`), no traffic lights
- **Prompt:** `$ ` in accent color (`#00d4aa`)
- **Cursor:** Blinking block (`█`), 530ms period
- **Padding:** 16px horizontal, 12px vertical
- **Selection:** `::selection { background: #00d4aa; color: #0a0a0a; }`

### 5.3 Typewriter Effect

- **Trigger:** `IntersectionObserver` — starts when terminal enters viewport (threshold 0.3)
- **Speed:** 25ms/character (configurable per terminal)
- **Behavior:** Types line by line; 400ms pause between lines
- **Skip:** Click terminal → instant complete
- **Reduced motion:** Instant complete (respects `prefers-reduced-motion`)

### 5.4 Draggable Behavior

- **Handle:** Entire header area (title + drag indicator)
- **Cursor:** `grab` → `grabbing`
- **Constraints:** None (infinite canvas)
- **Persist:** `localStorage` on drag end
- **Restore:** On mount, read `localStorage` → override content.json position

### 5.5 Terminal Content Map

| ID | Title | Content Source | Approx Lines |
|----|-------|----------------|--------------|
| `profile` | `~/profile` | `content.json` | 12 |
| `skills` | `~/skills` | `content.json` | 10 |
| `work` | `~/work` | `content.json` | 18 |
| `projects` | `~/projects` | `content.json` + links | 14 |
| `links` | `~/links` | `content.json` + click-to-copy | 10 |
| `contact` | `~/contact` | `content.json` | 10 |
| `now` | `~/now` | `content.json` | 10 |
| `secret` | `~/secret` | `content.json` (hidden) | 16 |

---

## 6. Content System

### 6.1 Content Folder Structure

```
public/
├── content/
│   ├── content.json         # Single source of truth for all terminal text
│   └── images/              # All portfolio images (avatars, project screenshots, etc.)
│       ├── avatar.png
│       ├── project-1.png
│       └── ...
```

### 6.2 `public/content/content.json` Structure

```typescript
interface TerminalContent {
  id: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  lines: string[];           // Typewriter lines
  links?: Link[];            // Clickable links (projects, contacts)
  images?: ImageRef[];       // Image references for this terminal
  typewriterSpeed?: number;  // ms/char, default 25
}

interface Link {
  label: string;
  url: string;
  copy?: string;             // Text to copy on click (for email, etc.)
}

interface ImageRef {
  id: string;                // Unique identifier for referencing in lines
  src: string;               // Relative path: "images/avatar.png"
  alt: string;               // Accessibility text
  width?: number;            // Optional display width
  height?: number;           // Optional display height
}
```

**Image referencing in typewriter lines:** Use `{{image:id}}` placeholder syntax in `lines[]` array. The terminal renderer replaces placeholders with `<img>` elements at render time.

Example:
```json
{
  "id": "profile",
  "lines": [
    "Welcome to my portfolio! {{image:avatar}}",
    "I'm a developer specializing in..."
  ],
  "images": [
    { "id": "avatar", "src": "images/avatar.png", "alt": "Profile photo", "width": 120 }
  ]
}
```

### 6.3 Content Loading

- **Fetch:** `fetch('/content/content.json')` on app mount
- **Cache:** Browser cache (static files)
- **Fallback:** Hardcoded default in `utils/content.ts`
- **Type-safe:** Zod schema validation on load
- **Images:** Served statically from `/content/images/` via Vite `public/` folder

### 6.4 Link Handling

- **External links:** `target="_blank" rel="noopener noreferrer"`
- **Copy links:** Click → `navigator.clipboard.writeText()` → toast "Copied!"
- **Email:** `mailto:` links open default client

### 6.5 Content Editing Workflow

- **Single file editing:** All text content in `public/content/content.json`
- **Image management:** Drop images into `public/content/images/`, reference by filename
- **No rebuild needed:** Changes reflect on refresh (static files served directly)
- **Version control:** Both JSON and images tracked in git

---

## 7. Mobile Adaptation

### 7.1 Breakpoint: 600px

| Feature | Desktop (≥600px) | Mobile (<600px) |
|---------|------------------|-----------------|
| **Terminal layout** | Absolute on canvas | Flex column, `gap: 16px`, centered |
| **Canvas** | Full viewport, pan/zoom | Full viewport, touch pan/zoom |
| **Terminal width** | Fixed per content | `min(90vw, 480px)` |
| **Terminal font** | 13px | `clamp(13px, 3.5vw, 15px)` |
| **Physics** | Full | Runs but terminals don't move |
| **Mini-map** | Visible | Hidden |
| **Map toggle** | N/A | Button "🗺 Map" → full-screen canvas modal |

### 7.2 Touch Interactions

- **1 finger drag:** Pan canvas
- **2 finger pinch:** Zoom canvas
- **Terminal scroll:** Native touch scroll (overflow: auto)
- **Drag terminals:** Long-press header (500ms) → drag mode

### 7.3 Map Modal (Mobile)

- **Trigger:** Fixed bottom-right button "🗺 Map"
- **Opens:** Full-screen canvas view (terminals hidden)
- **Close:** Tap overlay or "Done" button
- **Use case:** Overview of terminal positions

---

## 8. Hidden CLI Easter Egg

### 8.1 Konami Code Activation

- **Sequence:** `ArrowUp` `ArrowUp` `ArrowDown` `ArrowDown` `ArrowLeft` `ArrowRight` `ArrowLeft` `ArrowRight` `KeyB` `KeyA`
- **Detection:** Global keydown listener, resets on wrong key
- **Feedback:** Subtle screen flash + terminal title "~/secret" appears in mini-map

### 8.2 Hidden Terminal (`~/secret`)

- **Position:** Far off-screen (2000, 2000) — only reachable via mini-map click or konami
- **Content:** ASCII art + congrats message
- **Behavior:** Same as other terminals (draggable, typewriter)
- **Persistence:** Once found, stays in `localStorage` positions

### 8.3 Hidden Command Palette (Stretch)

- **Trigger:** `Ctrl`+`Shift`+`P` (or `Cmd`+`Shift`+`P`)
- **UI:** Centered modal, fuzzy search over commands
- **Commands:** `about`, `theme`, `reset`, `matrix`, `credits`
- **Priority:** Low — implement after core complete

---

## 9. Accessibility & Polish

### 9.1 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .terminal { animation: none !important; }
  .canvas { animation: none !important; }
  /* Physics: skip animation loop, set positions directly */
}
```

- **Physics:** Skip verlet loop; set terminal positions to rest immediately
- **Typewriter:** Instant complete
- **Transitions:** Disabled via CSS

### 9.2 Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Cycle terminals (forward) |
| `Shift+Tab` | Cycle terminals (backward) |
| `Enter` / `Space` | Focus terminal (scroll into view) |
| `Esc` | Unfocus terminal |
| `?` | Toggle HelpOverlay |
| `Arrow keys` | Pan canvas (when no terminal focused) |
| `+/-` or `=`/`-` | Zoom in/out |
| `0` | Reset zoom/pan |
| `Ctrl+Shift+P` | Hidden CLI (stretch) |

### 9.3 Focus Styles

```css
.terminal:focus-visible {
  outline: 2px solid #00d4aa;
  outline-offset: 2px;
}
```

### 9.4 Color Scheme

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#0a0a0a` | Page background |
| `--fg` | `#e8e8e8` | Primary text |
| `--muted` | `#6a6a6a` | Secondary text, comments |
| `--accent` | `#00d4aa` | Prompt, cursor, links, focus |
| `--glass-bg` | `rgba(10,10,10,0.7)` | Terminal background |
| `--glass-border` | `rgba(255,255,255,0.08)` | Terminal border |

### 9.5 Performance Budgets

| Metric | Target |
|--------|--------|
| **Initial JS** | < 80KB gzipped |
| **Canvas FPS** | 60fps (idle), 55fps (dragging) |
| **Physics update** | < 1ms/frame (8 nodes) |
| **Typewriter** | No main thread blocking |
| **LCP** | < 2.5s on 3G |
| **CLS** | 0 (no layout shift) |

---

## 10. File Structure

```
portfolio/
├── public/
│   └── content.json
├── src/
│   ├── canvas/
│   │   ├── CanvasEngine.ts
│   │   ├── Physics.ts
│   │   ├── useCanvas.ts
│   │   └── types.ts
│   ├── terminals/
│   │   ├── Terminal.tsx
│   │   ├── TerminalContent.tsx
│   │   ├── useTypewriter.ts
│   │   ├── useDraggable.ts
│   │   └── components/
│   │       ├── ProfileTerminal.tsx
│   │       ├── SkillsTerminal.tsx
│   │       ├── WorkTerminal.tsx
│   │       ├── ProjectsTerminal.tsx
│   │       ├── LinksTerminal.tsx
│   │       ├── ContactTerminal.tsx
│   │       └── NowTerminal.tsx
│   ├── ui/
│   │   ├── MiniMap.tsx
│   │   ├── HelpOverlay.tsx
│   │   └── HiddenCLI.tsx
│   ├── hooks/
│   │   ├── useReducedMotion.ts
│   │   └── useLocalStorage.ts
│   ├── styles/
│   │   ├── globals.css
│   │   └── terminal.css
│   ├── utils/
│   │   ├── cn.ts
│   │   └── content.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── .github/workflows/deploy.yml
├── .gitignore
└── README.md
```

---

## 11. Deployment

### 11.1 GitHub Pages Configuration

- **Source:** GitHub Actions (not branch)
- **Build output:** `dist/` (Vite default)
- **Base path:** `/<repo-name>/` (configured in `vite.config.ts`)
- **Custom domain:** Optional `CNAME` in `public/`

### 11.2 Vite Config for GitHub Pages

```typescript
// vite.config.ts
export default defineConfig({
  base: '/portfolio/',  // repository name
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
```

### 11.3 Deploy Workflow

- **Trigger:** Push to `main`
- **Steps:** Checkout → Setup Node → `npm ci` → `npm run build` → Upload artifact → Deploy to Pages
- **Permissions:** `contents: read`, `pages: write`, `id-token: write`

---

## 12. Implementation Phases

| Phase | Deliverable | Est. Hours |
|-------|-------------|------------|
| **1. Setup** | Vite + React + TS + Tailwind + Deploy workflow | 3 |
| **2. Canvas Engine** | Dot grid, pan/zoom, animation loop, resize | 6 |
| **3. Physics** | Verlet integration, forces, drag, persist | 8 |
| **4. Terminal Shell** | Glassmorphism, typewriter, drag, header | 10 |
| **5. Content System** | content.json, loader, 7 terminal components | 8 |
| **6. Mobile Stack** | CSS breakpoint, map modal, touch handling | 6 |
| **7. Polish** | Mini-map, help overlay, konami, reduced motion, a11y | 8 |
| **8. Deploy & QA** | GitHub Pages, cross-browser, performance audit | 4 |
| **Total** | | **~53 hours** |

---

## 13. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Physics jitter on drag | Medium | High | Increase drag damping; snap to grid on release |
| Mobile performance | Medium | High | Reduce dot density; disable physics on mobile |
| Glassmorphism browser support | Low | Medium | Fallback: solid bg + border (Safari < 15) |
| Content.json caching | Low | Low | Add `?v=<hash>` query param on update |
| Konami code false positive | Low | Low | Require exact sequence + timeout reset |

---

## 14. Future Enhancements (Post-v1)

- **Theme switcher** (light, sepia, matrix, high contrast)
- **Project detail modals** (click project → expand)
- **Blog/notes terminal** (MDX-powered)
- **Visitor terminal** (WebSocket "who's online")
- **Sound design** (subtle keystrokes, ambient hum)
- **URL deep-linking** (`#terminal=projects`)

---

## 15. Approval

**Spec Review Checklist:**

- [x] Architecture matches vision
- [x] All 7 terminals specified
- [x] Physics is aesthetic-only (no semantic meaning)
- [x] Mobile strategy defined (stack + map modal)
- [x] Accessibility covered (reduced motion, keyboard, focus)
- [x] Performance budgets set
- [x] Deployment path clear (GitHub Pages + Actions)
- [x] Easter egg defined (konami → hidden terminal)
- [x] File structure actionable

**Next Step:** Invoke `writing-plans` skill to generate detailed implementation plan with task breakdown, dependencies, and acceptance criteria.