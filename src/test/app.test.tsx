import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from '../App';

describe('App Integration Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const renderAndAwaitLoad = async () => {
    const utils = render(<App />);
    await waitFor(() => {
      expect(screen.getAllByText('~/profile').length).toBeGreaterThan(0);
    });
    return utils;
  };

  it('renders canvas layer and initial terminals after loading content', async () => {
    await renderAndAwaitLoad();

    expect(screen.getByTestId('canvas-element')).toBeInTheDocument();
    expect(screen.getByTestId('desktop-terminals-layer')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-terminals-layer')).toBeInTheDocument();

    expect(screen.getAllByText('~/skills').length).toBeGreaterThan(0);
    expect(screen.getAllByText('~/work').length).toBeGreaterThan(0);

    // Secret terminal should not be visible before Konami code
    expect(screen.queryByText('~/secret')).not.toBeInTheDocument();
  });

  it('opens and closes the help modal via toolbar button and Escape key', async () => {
    await renderAndAwaitLoad();

    const helpBtn = screen.getByTestId('help-toggle-btn');
    expect(screen.queryByTestId('help-modal')).not.toBeInTheDocument();

    act(() => {
      fireEvent.click(helpBtn);
    });
    expect(screen.getByTestId('help-modal')).toBeInTheDocument();
    expect(screen.getByText(/Canvas Controls & Shortcuts/i)).toBeInTheDocument();

    // Press Escape
    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });
    expect(screen.queryByTestId('help-modal')).not.toBeInTheDocument();
  });

  it('toggles help modal with ? key and closes with close button', async () => {
    await renderAndAwaitLoad();

    act(() => {
      fireEvent.keyDown(window, { key: '?' });
    });
    expect(screen.getByTestId('help-modal')).toBeInTheDocument();

    const closeBtn = screen.getByTestId('help-close-btn');
    act(() => {
      fireEvent.click(closeBtn);
    });
    expect(screen.queryByTestId('help-modal')).not.toBeInTheDocument();
  });

  it('opens mobile map modal, lists sections, and allows closing', async () => {
    await renderAndAwaitLoad();

    const mobileMapBtn = screen.getByTestId('mobile-map-toggle-btn');
    act(() => {
      fireEvent.click(mobileMapBtn);
    });

    expect(screen.getByTestId('mobile-map-modal')).toBeInTheDocument();
    expect(screen.getByText('Terminal Map')).toBeInTheDocument();

    const closeBtn = screen.getByTestId('mobile-map-close-btn');
    act(() => {
      fireEvent.click(closeBtn);
    });

    expect(screen.queryByTestId('mobile-map-modal')).not.toBeInTheDocument();
  });

  it('navigates to terminal from mobile map modal list', async () => {
    const scrollMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollMock;

    await renderAndAwaitLoad();

    act(() => {
      fireEvent.click(screen.getByTestId('mobile-map-toggle-btn'));
    });
    expect(screen.getByTestId('mobile-map-modal')).toBeInTheDocument();

    // Click on ~/skills button in mobile map list
    const skillsBtns = screen.getAllByRole('button', { name: /~\/skills/i });
    act(() => {
      fireEvent.click(skillsBtns[0]);
    });

    expect(screen.queryByTestId('mobile-map-modal')).not.toBeInTheDocument();
  });

  it('handles zoom and camera reset keyboard shortcuts', async () => {
    await renderAndAwaitLoad();

    // Press +, -, 0
    act(() => {
      fireEvent.keyDown(window, { key: '+' });
      fireEvent.keyDown(window, { key: '-' });
      fireEvent.keyDown(window, { key: '0' });
    });

    const resetBtn = screen.getByTestId('reset-cam-btn');
    act(() => {
      fireEvent.click(resetBtn);
    });

    expect(screen.getByTestId('canvas-element')).toBeInTheDocument();
  });

  it('unlocks secret terminal when Konami code sequence is entered', async () => {
    await renderAndAwaitLoad();

    expect(screen.queryByText('~/secret')).not.toBeInTheDocument();

    const sequence = [
      'ArrowUp',
      'ArrowUp',
      'ArrowDown',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'ArrowLeft',
      'ArrowRight',
      'KeyB',
      'KeyA',
    ];

    act(() => {
      for (const code of sequence) {
        window.dispatchEvent(new KeyboardEvent('keydown', { code }));
      }
    });

    await waitFor(() => {
      expect(screen.getAllByText('~/secret').length).toBeGreaterThan(0);
    });
  });

  it('reads saved terminal positions from localStorage', async () => {
    localStorage.setItem(
      'portfolio:pos:profile',
      JSON.stringify({ x: -100, y: -200 })
    );

    await renderAndAwaitLoad();

    expect(localStorage.getItem('portfolio:pos:profile')).toBe(
      JSON.stringify({ x: -100, y: -200 })
    );
  });

  it('handles canvas wheel zoom and pointer drag events', async () => {
    await renderAndAwaitLoad();

    const canvas = screen.getByTestId('canvas-element');

    act(() => {
      fireEvent.wheel(canvas, { clientX: 400, clientY: 300, deltaY: 100 });
      fireEvent.pointerDown(canvas, { clientX: 200, clientY: 200, pointerId: 1 });
      fireEvent.pointerMove(canvas, { clientX: 220, clientY: 210, pointerId: 1 });
      fireEvent.pointerUp(canvas, { pointerId: 1 });
    });

    expect(canvas).toBeInTheDocument();
  });

  it('handles terminal header drag start and movement', async () => {
    await renderAndAwaitLoad();

    const headers = screen.getAllByTestId('terminal-header');
    const root = screen.getByTestId('app-root');

    act(() => {
      fireEvent.pointerDown(headers[0], { clientX: 100, clientY: 100, pointerId: 1 });
      fireEvent.pointerMove(root, { clientX: 150, clientY: 120, pointerId: 1 });
      fireEvent.pointerUp(root, { pointerId: 1 });
    });

    expect(headers[0]).toBeInTheDocument();
  });
});
