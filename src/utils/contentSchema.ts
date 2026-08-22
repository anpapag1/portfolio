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
        position: { x: -500, y: -260 },
        size: { width: 400, height: 260 },
        lines: [
          'whoami',
          'Creative Developer & Systems Builder',
          'Passionate about interactive canvas graphics, resilient tooling, and web experiences.',
        ],
        links: [
          { label: 'GitHub', url: 'https://github.com' },
          { label: 'Twitter/X', url: 'https://x.com' },
        ],
      },
      {
        id: 'skills',
        title: '~/skills',
        position: { x: 100, y: -300 },
        size: { width: 380, height: 260 },
        lines: [
          'cat stack.txt',
          'Frontend: TypeScript, React, Vite, Tailwind CSS',
          'Backend: Node.js, Python, Go, GraphQL',
          'Systems: Docker, Git, Linux, WebGL/Canvas',
        ],
      },
      {
        id: 'work',
        title: '~/work',
        position: { x: -560, y: 200 },
        size: { width: 440, height: 320 },
        lines: [
          'history | grep experience',
          '2024 - Present: Senior Frontend Engineer @ TechLab',
          '  * Architected canvas-driven visualization tools',
          '2022 - 2024: Fullstack Developer @ CreativeCode',
          '  * Delivered real-time data monitoring interfaces',
        ],
      },
      {
        id: 'projects',
        title: '~/projects',
        position: { x: 60, y: 150 },
        size: { width: 420, height: 300 },
        lines: [
          'ls -la ./showcase',
          '1. Terminal Canvas Engine (This Site)',
          '2. Agentic Superpowers Toolset',
          '3. Quantum Graph Visualizer',
        ],
        links: [{ label: 'View Source', url: 'https://github.com' }],
      },
      {
        id: 'links',
        title: '~/links',
        position: { x: 650, y: -180 },
        size: { width: 340, height: 240 },
        lines: ['find ~/network -type link', 'Connect across platforms:'],
        links: [
          { label: 'Email', url: 'mailto:contact@example.com', copy: 'contact@example.com' },
          { label: 'LinkedIn', url: 'https://linkedin.com' },
          { label: 'Blog', url: 'https://example.com' },
        ],
      },
      {
        id: 'contact',
        title: '~/contact',
        position: { x: -200, y: 640 },
        size: { width: 380, height: 220 },
        lines: [
          'echo $CONTACT_INFO',
          'Open for collaborations, interesting engineering projects, and research.',
        ],
        links: [{ label: 'Say Hello', url: 'mailto:hello@example.com' }],
      },
      {
        id: 'now',
        title: '~/now',
        position: { x: 480, y: 580 },
        size: { width: 360, height: 240 },
        lines: [
          'cat /var/log/now.md',
          '📍 Current Location: Remote',
          '🔨 Working on: Generative web design & agentic systems',
          '📚 Reading: Physics simulation algorithms',
        ],
      },
      {
        id: 'secret',
        title: '~/secret',
        position: { x: 2000, y: 2000 },
        size: { width: 420, height: 280 },
        lines: [
          'cat flag.txt',
          '🎉 You found the Konami easter egg!',
          'Achievement Unlocked: Master Explorer',
        ],
      },
    ],
  };
}
