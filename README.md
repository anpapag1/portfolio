# Terminal Canvas Portfolio

An interactive, canvas-driven personal developer portfolio built with React 18, TypeScript, Vite, and Tailwind CSS. The portfolio features an infinite 2D canvas with viewport culling, bespoke Verlet physics graph connections, glassmorphism floating terminals with typewriter animations, position persistence, responsive mobile stacking, and a Konami easter egg.

---

## Table of Contents
- [Features](#features)
- [Architecture](#architecture)
- [Custom Physics Engine](#custom-physics-engine)
- [Interactive Controls & Shortcuts](#interactive-controls--shortcuts)
- [Content Customization Guide](#content-customization-guide)
- [Development & Scripts](#development--scripts)
- [CI/CD & Deployment](#cicd--deployment)

---

## Features

- **2D Infinite Dot Grid Canvas**: High-performance HTML5 `<canvas>` rendering engine with smooth pan, zoom (0.3x to 3.0x), and viewport culling targeting 60fps.
- **Bespoke Verlet Physics Engine**: Zero-dependency particle physics with distance constraints (springs), repulsion forces, and collision damping to keep terminals aesthetically spaced and connected.
- **Glassmorphism Floating Terminals**: Draggable floating cards rendered with CSS glassmorphism, glowing borders, custom typewriter text animation, and copy-to-clipboard interactions.
- **Interactive Mini-Map**: Live radar-style radar viewport indicator in the top-right allowing direct click-to-navigate jumps across the 2D world.
- **Position Persistence**: Terminal positions automatically persist to `localStorage` when moved, with keyboard/toolbar reset support (`0` key).
- **Responsive Stacking Mode**: Automatic fallback to clean, accessible vertical scroll layout on mobile devices (`< 640px`) with touch support and mobile map modal navigation.
- **Accessible & Motion-Aware**: Full keyboard navigation (`Tab`, `Shift+Tab`, `+`, `-`, `0`, `?`), semantic HTML, high contrast text, and automatic adaptation to `prefers-reduced-motion`.
- **Konami Code Easter Egg**: Hidden terminal revealed upon entering `↑ ↑ ↓ ↓ ← → ← → B A`.
- **Single Source of Truth**: Static, runtime-validated JSON configuration in `public/content/content.json` using Zod schemas with fallback defaults.

---

## Architecture

```
portfolio/
├── .github/workflows/
│   └── deploy.yml            # Automated CI/CD deployment to GitHub Pages
├── public/
│   └── content/
│       └── content.json      # Single source of truth for portfolio content
├── src/
│   ├── canvas/
│   │   ├── Camera.ts         # World-to-screen coordinate math and zoom-at-point
│   │   ├── CanvasEngine.ts   # RAF loop manager for canvas rendering & physics ticks
│   │   ├── DotGrid.ts        # Infinite dot grid with viewport culling
│   │   ├── Physics.ts        # Bespoke Verlet integration physics simulation
│   │   └── types.ts          # Vector2, Viewport, and Physics interfaces
│   ├── components/
│   │   ├── HelpOverlay.tsx   # Keyboard shortcuts modal
│   │   ├── MiniMap.tsx       # Canvas-based radar mini-map overlay
│   │   ├── MobileMapModal.tsx# Mobile terminal list navigation modal
│   │   └── Terminal.tsx      # Draggable glassmorphic terminal card
│   ├── hooks/
│   │   ├── useCamera.ts      # Camera pan/zoom and gesture management
│   │   ├── useKonami.ts      # Easter egg sequence listener
│   │   ├── useLocalStorage.ts# Safe localStorage persistence hook
│   │   └── useTypewriter.ts  # Configurable typewriter text animation
│   ├── types/
│   │   └── content.ts        # TypeScript definitions for portfolio data
│   ├── utils/
│   │   ├── cn.ts             # Tailwind classnames merger (clsx + tailwind-merge)
│   │   ├── content.ts        # Asynchronous content loader with fallback
│   │   └── contentSchema.ts  # Zod schema definitions and default content
│   ├── App.tsx               # Main portfolio canvas layout & orchestration
│   ├── main.tsx              # React DOM entry point
│   └── styles/
│       └── globals.css       # Tailwind directives, animations & glassmorphism utilities
├── docs/                     # Design specs and implementation plans
├── index.html                # Entry HTML with JetBrains Mono font loading
├── tailwind.config.js        # Theme tokens (bg, fg, muted, accent)
├── tsconfig.json             # TypeScript compiler configuration
└── vite.config.ts            # Vite & Vitest configuration
```

### Tech Stack
- **Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Tooling**: [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 3](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Validation**: [Zod](https://zod.dev/)
- **Testing**: [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/)

---

## Custom Physics Engine

The portfolio avoids heavy 3D/physics dependencies in favor of a lightweight, custom-built 2D Verlet integration engine (`src/canvas/Physics.ts`):

1. **Verlet Integration**: Position updates calculated via $pos_{new} = pos + (pos - pos_{old}) \times damping + acceleration \times \Delta t^2$.
2. **Distance Constraints (Springs)**: Relaxation loops enforce desired connection distances between nodes without stiff oscillation.
3. **Repulsion Forces**: Inverse-square electrostatic repulsion prevents terminal cards from overlapping.
4. **Interactive Pinning**: Terminals pinned while dragged by the user, smoothly releasing kinetic momentum back into the graph when unpinned.
5. **Boundary Damping**: Enforces soft boundary limits within the canvas space.

---

## Interactive Controls & Shortcuts

| Action | Control / Shortcut |
| :--- | :--- |
| **Pan Canvas** | Click & drag canvas background / Touch drag |
| **Zoom In / Out** | Mouse wheel / Pinch gesture / `+` / `-` keys |
| **Move Terminal** | Click and drag terminal title bar |
| **Reset View & Positions** | `0` key (clears saved positions and recenters camera) |
| **Toggle Shortcuts Help** | `?` key or bottom-right `(?)` button |
| **Navigate Terminals** | Click mini-map nodes / Select from mobile map menu |
| **Copy Link / Email** | Click any link with a copy tag to copy to clipboard |
| **Secret Easter Egg** | Type Konami sequence: `↑ ↑ ↓ ↓ ← → ← → B A` |

---

## Content Customization Guide

All portfolio content is driven by `public/content/content.json`. You can modify, add, or rearrange terminals without altering application logic.

### JSON Structure

```json
{
  "terminals": [
    {
      "id": "profile",
      "title": "~/profile",
      "position": { "x": -360, "y": -220 },
      "size": { "width": 400, "height": 260 },
      "typewriterSpeed": 20,
      "lines": [
        "whoami",
        "Creative Developer & Systems Builder",
        "Passionate about interactive canvas graphics and resilient tooling."
      ],
      "links": [
        { "label": "GitHub", "url": "https://github.com/yourusername" },
        { "label": "Email", "url": "mailto:you@example.com", "copy": "you@example.com" }
      ],
      "images": [
        { "id": "avatar", "src": "/images/avatar.png", "alt": "Profile Avatar", "width": 64, "height": 64 }
      ]
    }
  ]
}
```

### Terminal Field Reference
- `id` *(string, required)*: Unique identifier (e.g., `"profile"`, `"skills"`, `"work"`, `"projects"`). Note: `"secret"` is reserved for the Konami code unlock.
- `title` *(string, required)*: Header title shown on the terminal title bar (e.g., `"~/skills"`).
- `position` *(`{ x: number, y: number }`, required)*: World coordinate spawn position.
- `size` *(`{ width: number, height: number }`, required)*: Dimensions of the terminal card in pixels.
- `lines` *(string[], required)*: Array of text lines rendered sequentially with typewriter effects. Lines starting with `$` or command prompts are styled automatically.
- `links` *(optional)*: Array of `{ label: string, url: string, copy?: string }`. If `copy` is provided, clicking copies the text to the clipboard.
- `images` *(optional)*: Array of image references `{ id, src, alt, width?, height? }` embedded within the terminal.
- `typewriterSpeed` *(number, optional)*: Typing delay in milliseconds per character (default: 20ms).

---

## Development & Scripts

### Prerequisites
- Node.js 18+ (Node.js 20 LTS recommended)
- npm 9+

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/portfolio.git
cd portfolio

# Install dependencies
npm install
```

### Available Scripts

- **`npm run dev`**: Starts the Vite local development server with HMR at `http://localhost:5173`.
- **`npm run build`**: Runs TypeScript compilation (`tsc`) followed by Vite production bundling to `dist/`.
- **`npm run preview`**: Locally serves the production build in `dist/` for verification.
- **`npm test`**: Executes the Vitest unit and integration test suite.
- **`npm run test:watch`**: Runs Vitest in interactive watch mode.

---

## CI/CD & Deployment

This project includes a continuous deployment workflow configured for **GitHub Pages** in `.github/workflows/deploy.yml`.

### Deployment Steps
1. Push your changes to the `main` branch.
2. In your GitHub repository settings, navigate to **Settings > Pages**.
3. Under **Build and deployment > Source**, select **GitHub Actions**.
4. The workflow will automatically:
   - Check out code and set up Node.js 20.
   - Install dependencies via `npm ci`.
   - Run the Vitest test suite (`npm test`).
   - Compile TypeScript and generate the production bundle (`npm run build`).
   - Deploy the `./dist` folder to GitHub Pages.

---

## License

MIT © 2026. Built with focus on performance, aesthetics, and clean architecture.
