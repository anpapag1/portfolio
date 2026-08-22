import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { calculateTypewriterProgress, useTypewriter } from '../terminals/useTypewriter';

describe('calculateTypewriterProgress', () => {
  it('returns empty array when lines is empty or charCount is 0 or negative', () => {
    expect(calculateTypewriterProgress([], 10)).toEqual([]);
    expect(calculateTypewriterProgress(['hello'], 0)).toEqual([]);
    expect(calculateTypewriterProgress(['hello'], -5)).toEqual([]);
  });

  it('calculates full text when progress is complete or exceeds total chars', () => {
    const lines = ['First line', 'Second line'];
    const rendered = calculateTypewriterProgress(lines, 100);
    expect(rendered).toEqual(['First line', 'Second line']);
  });

  it('renders partial lines accurately during typing progress', () => {
    const lines = ['Hello', 'World'];
    // 3 chars -> 'Hel'
    expect(calculateTypewriterProgress(lines, 3)).toEqual(['Hel']);
    // 5 chars -> 'Hello'
    expect(calculateTypewriterProgress(lines, 5)).toEqual(['Hello']);
    // 7 chars -> 'Hello', 'Wo'
    expect(calculateTypewriterProgress(lines, 7)).toEqual(['Hello', 'Wo']);
    // 10 chars -> 'Hello', 'World'
    expect(calculateTypewriterProgress(lines, 10)).toEqual(['Hello', 'World']);
  });

  it('handles multi-line arrays with various lengths', () => {
    const lines = ['A', 'BC', 'DEF'];
    expect(calculateTypewriterProgress(lines, 1)).toEqual(['A']);
    expect(calculateTypewriterProgress(lines, 2)).toEqual(['A', 'B']);
    expect(calculateTypewriterProgress(lines, 3)).toEqual(['A', 'BC']);
    expect(calculateTypewriterProgress(lines, 4)).toEqual(['A', 'BC', 'D']);
    expect(calculateTypewriterProgress(lines, 6)).toEqual(['A', 'BC', 'DEF']);
  });
});

describe('useTypewriter hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('types characters incrementally over time', () => {
    const lines = ['Hey', 'You'];
    const { result } = renderHook(() => useTypewriter(lines, 20, true, false));

    expect(result.current.isComplete).toBe(false);
    expect(result.current.visibleLines).toEqual([]);

    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(result.current.visibleLines).toEqual(['H']);

    act(() => {
      vi.advanceTimersByTime(40);
    });
    expect(result.current.visibleLines).toEqual(['Hey']);

    act(() => {
      vi.advanceTimersByTime(60);
    });
    expect(result.current.visibleLines).toEqual(['Hey', 'You']);
    expect(result.current.isComplete).toBe(true);
  });

  it('completes instantly when completeInstantly is called', () => {
    const lines = ['Long content that takes a while to type'];
    const { result } = renderHook(() => useTypewriter(lines, 25, true, false));

    expect(result.current.isComplete).toBe(false);

    act(() => {
      result.current.completeInstantly();
    });

    expect(result.current.isComplete).toBe(true);
    expect(result.current.visibleLines).toEqual(lines);
  });

  it('completes instantly when reducedMotion is true', () => {
    const lines = ['Accessible text'];
    const { result } = renderHook(() => useTypewriter(lines, 25, true, true));

    expect(result.current.isComplete).toBe(true);
    expect(result.current.visibleLines).toEqual(lines);
  });

  it('does not advance when isVisible is false', () => {
    const lines = ['Hidden text'];
    const { result } = renderHook(() => useTypewriter(lines, 25, false, false));

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.isComplete).toBe(false);
    expect(result.current.visibleLines).toEqual([]);
  });
});
