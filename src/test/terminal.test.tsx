import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Terminal } from '../terminals/Terminal';
import { TerminalData } from '../types/content';

describe('Terminal component', () => {
  const sampleData: TerminalData = {
    id: 'test-terminal',
    title: '~/test-dir',
    position: { x: 100, y: 100 },
    size: { width: 400, height: 300 },
    lines: ['cat hello.txt', 'Hello World! This is terminal output.'],
    links: [
      { label: 'GitHub', url: 'https://github.com/example' },
      { label: 'Email', url: 'mailto:test@example.com', copy: 'test@example.com' },
    ],
    typewriterSpeed: 10,
  };

  beforeEach(() => {
    vi.useFakeTimers();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders terminal header with title', () => {
    render(
      <Terminal
        data={sampleData}
        screenPos={{ x: 50, y: 50 }}
        zoom={1.0}
      />
    );

    expect(screen.getByText('~/test-dir')).toBeInTheDocument();
    expect(screen.getByText('$')).toBeInTheDocument();
  });

  it('displays cursor while typing and finishes when completed', () => {
    render(
      <Terminal
        data={sampleData}
        screenPos={{ x: 50, y: 50 }}
        zoom={1.0}
      />
    );

    expect(screen.getByTestId('terminal-cursor')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByTestId('terminal-cursor')).not.toBeInTheDocument();
    expect(screen.getByText('cat hello.txt')).toBeInTheDocument();
    expect(screen.getByText('Hello World! This is terminal output.')).toBeInTheDocument();
  });

  it('completes typing immediately when terminal is clicked', () => {
    render(
      <Terminal
        data={sampleData}
        screenPos={{ x: 50, y: 50 }}
        zoom={1.0}
      />
    );

    const terminalRegion = screen.getByRole('region', { name: /terminal ~\/test-dir/i });
    fireEvent.click(terminalRegion);

    expect(screen.queryByTestId('terminal-cursor')).not.toBeInTheDocument();
    expect(screen.getByText('Hello World! This is terminal output.')).toBeInTheDocument();
    expect(screen.getByTestId('terminal-links')).toBeInTheDocument();
  });

  it('renders external links and copyable links when typing completes', () => {
    render(
      <Terminal
        data={sampleData}
        screenPos={{ x: 50, y: 50 }}
        zoom={1.0}
      />
    );

    // Fast-forward
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const extLink = screen.getByRole('link', { name: /github/i });
    expect(extLink).toHaveAttribute('href', 'https://github.com/example');
    expect(extLink).toHaveAttribute('target', '_blank');
    expect(extLink).toHaveAttribute('rel', 'noopener noreferrer');

    const copyBtn = screen.getByRole('button', { name: /copy email/i });
    expect(copyBtn).toBeInTheDocument();
  });

  it('handles copy button click and clipboard feedback', async () => {
    render(
      <Terminal
        data={sampleData}
        screenPos={{ x: 50, y: 50 }}
        zoom={1.0}
      />
    );

    // Fast-forward to complete
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const copyBtn = screen.getByRole('button', { name: /copy email/i });
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test@example.com');
    expect(screen.getByText('Copied!')).toBeInTheDocument();
    expect(screen.getByTestId('copy-success-icon')).toBeInTheDocument();

    // After timeout, resets
    act(() => {
      vi.advanceTimersByTime(1600);
    });

    expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('triggers onDragStart when header is pointerDowned', () => {
    const handleDragStart = vi.fn();
    render(
      <Terminal
        data={sampleData}
        screenPos={{ x: 50, y: 50 }}
        zoom={1.0}
        onDragStart={handleDragStart}
      />
    );

    const header = screen.getByTestId('terminal-header');
    fireEvent.pointerDown(header, { clientX: 100, clientY: 100 });

    expect(handleDragStart).toHaveBeenCalledTimes(1);
    expect(handleDragStart).toHaveBeenCalledWith('test-terminal', expect.any(Object));
  });

  it('applies ring and focused style when isFocused is true', () => {
    const { container } = render(
      <Terminal
        data={sampleData}
        screenPos={{ x: 50, y: 50 }}
        zoom={1.0}
        isFocused={true}
      />
    );

    const terminalEl = container.firstChild as HTMLElement;
    expect(terminalEl.className).toContain('ring-2 ring-accent');
  });
});
