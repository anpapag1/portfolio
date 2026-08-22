import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { portfolioSchema, getDefaultContent, parseContent, linkSchema, imageRefSchema } from '../utils/contentSchema';
import { loadContent } from '../utils/content';
import { cn } from '../utils/cn';

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
          links: [{ label: 'GitHub', url: 'https://github.com' }],
          images: [{ id: 'avatar', src: 'images/avatar.png', alt: 'Avatar photo', width: 120, height: 120 }],
          typewriterSpeed: 30,
        },
      ],
    };
    const parsed = parseContent(raw);
    expect(parsed.terminals.length).toBe(1);
    expect(parsed.terminals[0].id).toBe('profile');
    expect(parsed.terminals[0].title).toBe('~/profile');
    expect(parsed.terminals[0].links?.[0].label).toBe('GitHub');
    expect(parsed.terminals[0].images?.[0].id).toBe('avatar');
  });

  it('rejects invalid portfolio structure missing required fields', () => {
    const invalidRaw = {
      terminals: [
        {
          id: 'profile',
          // missing title, position, size, lines
        },
      ],
    };
    expect(() => parseContent(invalidRaw)).toThrow();
  });

  it('validates individual linkSchema and imageRefSchema', () => {
    const validLink = { label: 'Site', url: 'https://example.com', copy: 'https://example.com' };
    expect(linkSchema.parse(validLink)).toEqual(validLink);

    const validImage = { id: 'img1', src: '/img.png', alt: 'Alt text', width: 100 };
    expect(imageRefSchema.parse(validImage)).toEqual(validImage);
  });

  it('provides complete default content with all 8 terminals', () => {
    const def = getDefaultContent();
    expect(def.terminals.length).toBeGreaterThanOrEqual(8);
    const ids = def.terminals.map((t) => t.id);
    expect(ids).toContain('profile');
    expect(ids).toContain('skills');
    expect(ids).toContain('work');
    expect(ids).toContain('projects');
    expect(ids).toContain('links');
    expect(ids).toContain('contact');
    expect(ids).toContain('now');
    expect(ids).toContain('secret');

    // Default content must pass its own schema validation
    expect(() => portfolioSchema.parse(def)).not.toThrow();
  });
});

describe('Content Loader', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads and parses valid content from fetch', async () => {
    const mockData = {
      terminals: [
        {
          id: 'custom',
          title: '~/custom',
          position: { x: 10, y: 20 },
          size: { width: 300, height: 200 },
          lines: ['Custom content line'],
        },
      ],
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockData),
    }));

    const result = await loadContent();
    expect(result.terminals.length).toBe(1);
    expect(result.terminals[0].id).toBe('custom');
  });

  it('falls back to default content if fetch response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }));

    const result = await loadContent();
    expect(result.terminals.length).toBeGreaterThanOrEqual(8);
    expect(result.terminals.map((t) => t.id)).toContain('profile');
  });

  it('falls back to default content if fetch throws network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const result = await loadContent();
    expect(result.terminals.length).toBeGreaterThanOrEqual(8);
    expect(result.terminals.map((t) => t.id)).toContain('profile');
  });

  it('falls back to default content if fetched json fails schema validation', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ corrupted: true }),
    }));

    const result = await loadContent();
    expect(result.terminals.length).toBeGreaterThanOrEqual(8);
    expect(result.terminals.map((t) => t.id)).toContain('profile');
  });
});

describe('Classnames Helper (cn)', () => {
  it('merges classnames correctly using clsx and tailwind-merge', () => {
    expect(cn('px-2 py-1', 'bg-red-500')).toBe('px-2 py-1 bg-red-500');
    expect(cn('p-4', 'p-2')).toBe('p-2');
    expect(cn('text-white', false && 'text-black', null, undefined, 'font-bold')).toBe('text-white font-bold');
  });
});
