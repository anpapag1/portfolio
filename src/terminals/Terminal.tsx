import React, { useState, useRef, useCallback } from 'react';
import { TerminalData } from '../types/content';
import { useTypewriter } from './useTypewriter';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { ExternalLink, Copy, Check } from 'lucide-react';
import { cn } from '../utils/cn';
import '../styles/terminal.css';

export interface TerminalProps {
  data: TerminalData;
  screenPos: { x: number; y: number };
  zoom: number;
  onDragStart?: (id: string, e: React.PointerEvent) => void;
  isFocused?: boolean;
  onFocus?: () => void;
}

export const Terminal: React.FC<TerminalProps> = ({
  data,
  screenPos,
  zoom,
  onDragStart,
  isFocused = false,
  onFocus,
}) => {
  const reducedMotion = useReducedMotion();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const copyTimeoutRef = useRef<number | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const { visibleLines, isComplete, completeInstantly } = useTypewriter(
    data.lines,
    data.typewriterSpeed || 25,
    true,
    reducedMotion
  );

  const handleCopy = useCallback(
    (text: string, index: number, e: React.MouseEvent) => {
      e.stopPropagation();
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(text);
      }
      setCopiedIndex(index);
      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = window.setTimeout(() => {
        setCopiedIndex(null);
        copyTimeoutRef.current = null;
      }, 1500);
    },
    []
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      completeInstantly();
    }
  };

  return (
    <div
      ref={terminalRef}
      role="region"
      aria-label={`Terminal ${data.title}`}
      tabIndex={0}
      onClick={completeInstantly}
      onKeyDown={handleKeyDown}
      onFocus={onFocus}
      style={{
        transform: `translate3d(${screenPos.x}px, ${screenPos.y}px, 0) scale(${zoom})`,
        transformOrigin: 'top left',
        width: `${data.size.width}px`,
      }}
      className={cn(
        'terminal-window absolute select-text font-mono text-xs leading-relaxed outline-none',
        isFocused ? 'ring-2 ring-accent shadow-[0_0_25px_rgba(0,212,170,0.3)]' : ''
      )}
    >
      {/* Header / Drag handle */}
      <div
        data-testid="terminal-header"
        onPointerDown={(e) => onDragStart && onDragStart(data.id, e)}
        className="flex items-center justify-between px-3 py-2 border-b border-white/10 cursor-grab active:cursor-grabbing bg-white/5 rounded-t-xl select-none"
      >
        <span className="text-accent font-semibold tracking-wider">{data.title}</span>
        <div className="flex space-x-1.5 opacity-60" aria-hidden="true">
          <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
        </div>
      </div>

      {/* Terminal Body */}
      <div className="p-4 space-y-2" data-testid="terminal-content">
        {visibleLines.length === 0 && !isComplete && data.lines.length > 0 ? (
          <div className="flex items-start space-x-2">
            <span className="text-accent font-bold select-none">$</span>
            <span className="text-white font-medium"></span>
          </div>
        ) : (
          visibleLines.map((line, idx) => (
            <div key={idx} className="flex items-start space-x-2">
              {idx === 0 ? (
                <span className="text-accent font-bold select-none">$</span>
              ) : (
                <span className="text-muted select-none opacity-40">›</span>
              )}
              <span className={idx === 0 ? 'text-white font-medium' : 'text-fg/90 whitespace-pre-wrap'}>
                {line}
              </span>
            </div>
          ))
        )}

        {!isComplete && (
          <span
            data-testid="terminal-cursor"
            className="terminal-cursor"
            aria-hidden="true"
          />
        )}

        {/* Action Links */}
        {data.links && data.links.length > 0 && isComplete && (
          <div
            data-testid="terminal-links"
            className="pt-3 mt-3 border-t border-white/5 flex flex-wrap gap-2"
          >
            {data.links.map((link, idx) => (
              <div key={idx} className="flex items-center">
                {link.copy ? (
                  <button
                    type="button"
                    onClick={(e) => handleCopy(link.copy!, idx, e)}
                    aria-label={`Copy ${link.label}`}
                    className="inline-flex items-center space-x-1.5 text-accent hover:text-accent/80 bg-accent/10 hover:bg-accent/20 px-2 py-1 rounded text-[11px] transition-colors focus:ring-1 focus:ring-accent outline-none"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check size={12} data-testid="copy-success-icon" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} data-testid="copy-icon" />
                        <span>{link.label}</span>
                      </>
                    )}
                  </button>
                ) : (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 text-accent hover:underline bg-accent/10 hover:bg-accent/20 px-2 py-1 rounded text-[11px] transition-colors focus:ring-1 focus:ring-accent outline-none"
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
