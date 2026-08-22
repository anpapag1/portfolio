import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MiniMap, worldToMiniMap, miniMapToWorld } from '../ui/MiniMap';
import { HelpOverlay } from '../ui/HelpOverlay';
import { Camera } from '../canvas/Camera';
import { TerminalData } from '../types/content';

describe('MiniMap Component & Coordinate Translation', () => {
  const sampleTerminals: TerminalData[] = [
    {
      id: 'profile',
      title: '~/profile',
      position: { x: 0, y: 0 },
      size: { width: 400, height: 300 },
      lines: ['Hello world'],
    },
    {
      id: 'skills',
      title: '~/skills',
      position: { x: 600, y: -450 },
      size: { width: 380, height: 260 },
      lines: ['Skills content'],
    },
  ];

  it('translates world coordinates to minimap coordinates and back accurately', () => {
    const worldPoint = { x: 300, y: -600 };
    const mapSize = { width: 180, height: 130 };
    const worldSpan = 3000;

    const mapCoord = worldToMiniMap(worldPoint, mapSize, worldSpan);
    // x: ((300 + 1500) / 3000) * 180 = (1800/3000) * 180 = 0.6 * 180 = 108
    // y: ((-600 + 1500) / 3000) * 130 = (900/3000) * 130 = 0.3 * 130 = 39
    expect(mapCoord.x).toBeCloseTo(108);
    expect(mapCoord.y).toBeCloseTo(39);

    const backToWorld = miniMapToWorld(mapCoord, mapSize, worldSpan);
    expect(backToWorld.x).toBeCloseTo(worldPoint.x);
    expect(backToWorld.y).toBeCloseTo(worldPoint.y);
  });

  it('renders all terminal markers with titles', () => {
    const camera = new Camera({ x: 0, y: 0 }, 1.0, { width: 800, height: 600 });
    const handleJumpTo = vi.fn();

    render(
      <MiniMap
        terminals={sampleTerminals}
        camera={camera}
        onJumpTo={handleJumpTo}
      />
    );

    expect(screen.getByTestId('minimap')).toBeInTheDocument();
    expect(screen.getByTestId('minimap-marker-profile')).toBeInTheDocument();
    expect(screen.getByTestId('minimap-marker-skills')).toBeInTheDocument();
    expect(screen.getByTitle('~/profile')).toBeInTheDocument();
    expect(screen.getByTitle('~/skills')).toBeInTheDocument();
  });

  it('renders viewport boundary indicator box', () => {
    const camera = new Camera({ x: 150, y: -150 }, 1.5, { width: 1200, height: 800 });
    const handleJumpTo = vi.fn();

    render(
      <MiniMap
        terminals={sampleTerminals}
        camera={camera}
        onJumpTo={handleJumpTo}
      />
    );

    const viewportBox = screen.getByTestId('minimap-viewport');
    expect(viewportBox).toBeInTheDocument();
    expect(viewportBox).toHaveClass('absolute');
    expect(viewportBox).toHaveStyle({ position: 'absolute' });
  });

  it('calculates target world position and triggers onJumpTo on click', () => {
    const camera = new Camera({ x: 0, y: 0 }, 1.0, { width: 800, height: 600 });
    const handleJumpTo = vi.fn();

    render(
      <MiniMap
        terminals={sampleTerminals}
        camera={camera}
        onJumpTo={handleJumpTo}
        width={180}
        height={130}
        worldSpan={3000}
      />
    );

    const minimapEl = screen.getByTestId('minimap');
    // Mock getBoundingClientRect
    vi.spyOn(minimapEl, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 50,
      width: 180,
      height: 130,
      right: 280,
      bottom: 180,
      x: 100,
      y: 50,
      toJSON: () => {},
    });

    // Click at center (client: 100 + 90 = 190, 50 + 65 = 115)
    fireEvent.click(minimapEl, { clientX: 190, clientY: 115 });

    expect(handleJumpTo).toHaveBeenCalledTimes(1);
    const [targetX, targetY] = handleJumpTo.mock.calls[0];
    expect(targetX).toBeCloseTo(0);
    expect(targetY).toBeCloseTo(0);
  });
});

describe('HelpOverlay Component', () => {
  it('does not render when isOpen is false', () => {
    const handleClose = vi.fn();
    render(<HelpOverlay isOpen={false} onClose={handleClose} />);

    expect(screen.queryByTestId('help-modal')).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders modal with shortcuts list when isOpen is true', () => {
    const handleClose = vi.fn();
    render(<HelpOverlay isOpen={true} onClose={handleClose} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Canvas Controls & Shortcuts/i)).toBeInTheDocument();
    expect(screen.getByText('Pan infinite canvas')).toBeInTheDocument();
    expect(screen.getByText('Zoom at cursor')).toBeInTheDocument();
    expect(screen.getByText('Focus through terminals')).toBeInTheDocument();
    expect(screen.getByText('Toggle keyboard shortcuts')).toBeInTheDocument();
  });

  it('calls onClose when close X button is clicked', () => {
    const handleClose = vi.fn();
    render(<HelpOverlay isOpen={true} onClose={handleClose} />);

    const closeBtn = screen.getByTestId('help-close-btn');
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking backdrop outside modal', () => {
    const handleClose = vi.fn();
    render(<HelpOverlay isOpen={true} onClose={handleClose} />);

    const backdrop = screen.getByTestId('help-backdrop');
    fireEvent.click(backdrop);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when clicking inside the modal content', () => {
    const handleClose = vi.fn();
    render(<HelpOverlay isOpen={true} onClose={handleClose} />);

    const modal = screen.getByTestId('help-modal');
    fireEvent.click(modal);

    expect(handleClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();
    render(<HelpOverlay isOpen={true} onClose={handleClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
