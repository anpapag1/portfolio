import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { checkKonamiSequence, useKonamiCode, KONAMI_SEQUENCE } from '../hooks/useKonamiCode';

describe('Konami Code Sequence Checker', () => {
  const sequence = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'KeyB', 'KeyA'
  ];

  it('validates the complete correct Konami sequence', () => {
    expect(checkKonamiSequence(sequence)).toBe(true);
  });

  it('validates case-insensitive or shorthand key variants', () => {
    const keyVariants = [
      'arrowup', 'arrowup', 'arrowdown', 'arrowdown',
      'arrowleft', 'arrowright', 'arrowleft', 'arrowright',
      'b', 'a'
    ];
    expect(checkKonamiSequence(keyVariants)).toBe(true);
  });

  it('rejects an incomplete sequence', () => {
    expect(checkKonamiSequence(sequence.slice(0, -1))).toBe(false);
  });

  it('rejects an incorrect sequence', () => {
    expect(checkKonamiSequence([...sequence.slice(0, -1), 'KeyC'])).toBe(false);
  });

  it('rejects an array with wrong length', () => {
    expect(checkKonamiSequence([...sequence, 'KeyA'])).toBe(false);
  });
});

describe('useKonamiCode hook', () => {
  it('triggers onSuccess callback when full Konami sequence is entered via keydown', () => {
    const handleSuccess = vi.fn();
    renderHook(() => useKonamiCode(handleSuccess));

    act(() => {
      for (const code of KONAMI_SEQUENCE) {
        window.dispatchEvent(new KeyboardEvent('keydown', { code }));
      }
    });

    expect(handleSuccess).toHaveBeenCalledTimes(1);
  });

  it('does not trigger callback on incomplete or interrupted sequence', () => {
    const handleSuccess = vi.fn();
    renderHook(() => useKonamiCode(handleSuccess));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowUp' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowUp' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyX' })); // interruption
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown' }));
    });

    expect(handleSuccess).not.toHaveBeenCalled();
  });

  it('resets buffer after successful trigger so subsequent keys start new sequence', () => {
    const handleSuccess = vi.fn();
    renderHook(() => useKonamiCode(handleSuccess));

    act(() => {
      for (const code of KONAMI_SEQUENCE) {
        window.dispatchEvent(new KeyboardEvent('keydown', { code }));
      }
    });
    expect(handleSuccess).toHaveBeenCalledTimes(1);

    // Typing another single key shouldn't trigger again
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }));
    });
    expect(handleSuccess).toHaveBeenCalledTimes(1);

    // Typing full sequence again triggers second time
    act(() => {
      for (const code of KONAMI_SEQUENCE) {
        window.dispatchEvent(new KeyboardEvent('keydown', { code }));
      }
    });
    expect(handleSuccess).toHaveBeenCalledTimes(2);
  });
});
