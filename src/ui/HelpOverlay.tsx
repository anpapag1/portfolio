import React, { useEffect } from 'react';
import { X, Command } from 'lucide-react';
import { cn } from '../utils/cn';

export interface HelpOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const HelpOverlay: React.FC<HelpOverlayProps> = ({ isOpen, onClose, className }) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      data-testid="help-backdrop"
      onClick={handleBackdropClick}
      className={cn(
        'fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4',
        className
      )}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Canvas Controls & Shortcuts"
        data-testid="help-modal"
        className="bg-[#0f0f0f] border border-white/15 rounded-xl max-w-md w-full p-6 shadow-2xl font-mono text-xs select-none"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-2 text-accent">
            <Command size={16} />
            <span className="font-bold uppercase tracking-wider">Canvas Controls & Shortcuts</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close help modal"
            data-testid="help-close-btn"
            className="text-muted hover:text-white transition-colors p-1 rounded hover:bg-white/5"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {shortcuts.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-1">
              <span className="text-fg/90">{item.desc}</span>
              <kbd className="bg-white/10 px-2 py-0.5 rounded text-accent border border-white/10 text-[11px]">
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
