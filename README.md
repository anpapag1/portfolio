# Interactive Node-Based Portfolio

**A physics-simulated, node-based personal developer canvas running at 60fps in the browser.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-kommwtria.com-4ade80?style=flat&logo=googlechrome&logoColor=white)](https://kommwtria.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat)](LICENSE)

<br/>

Most personal developer portfolios are static vertical pages: a hero banner, an about section, a grid of project cards, and a contact form. They do the job, but they feel like reading a PDF resume with slightly nicer fonts.

I wanted something that felt more like exploring a live system: an infinite, fluid 2D canvas where your projects, skills, competitions, and background exist as interconnected physical nodes. You can fling them around, latch new dynamic topology bonds in real-time, inspect them up close, or overview the whole cluster from afar.

---

## What It Is

An interactive graph-based portfolio that renders dynamic information cards connected by spring physics and distance constraints:

- **Dynamic Graph Topology**: Dragging nodes near each other dynamically forms new elastic bonds in real-time (`src/physics/graph.ts`), while dragging them too far apart snaps the connection.
- **Zoom-Aware Interactivity**: When zoomed out in overview mode (`zoom < 0.72`), nodes become pure drag surfaces so you can touch or click anywhere across the card to move it without accidental link clicks. When focused or zoomed in, all inner links and buttons become clickable.
- **Mobile Focus Mode**: Mobile devices get a responsive collapsible HUD — focusing on any node automatically shrinks the Sitemap to a sliver pill and hides the radar map, giving full-screen focus to the content.
- **Single Source of Truth**: All portfolio data (projects, bio, experience, skills, awards) is cleanly decoupled into [`public/content/content.json`](public/content/content.json).

---

## Features

**Custom Verlet Physics Engine** — Zero-dependency particle physics with distance constraints (Hooke's spring relaxation), inverse-square repulsion, and velocity damping to keep nodes aesthetically spaced and organically reactive.

**Real-Time Dynamic Bonding** — Nodes dynamically latch spring bonds to their closest neighbors as you drag them around the canvas, and break bonds when pulled beyond their elastic threshold.

**Zoom-Aware Drag Surfaces** — In overview mode, whole cards serve as drag handles (`pointer-events: none` on inner links). Zooming in close-up seamlessly reactivates all links, GitHub repositories, and contact buttons.

**Mobile Double-Tap & Focus Mode** — Double-tapping any node or selecting it from the bottom-left Sitemap smoothly centers the camera, calculates responsive viewport margins, and collapses HUD distractions.

**Radar Minimap** — A live, HiDPI-scaled canvas radar box in the corner featuring glowing node dots, dynamic bond rendering, and real-time camera viewport tracking.

**Trackpad & Touch Native** — Full support for 2-finger continuous pinch-to-zoom, smooth trackpad panning, multi-touch mobile pinch, and mouse wheel navigation with zero passive listener warnings.

**Pure Static Decoupling** — Changing or adding new projects, skills, or competition awards only requires editing a single JSON file without touching React components.

---

## License

MIT © [Antonis Papageorgiou](https://github.com/anpapag1)

