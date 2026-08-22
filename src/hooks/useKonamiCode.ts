import { useEffect, useRef } from 'react';

export const KONAMI_SEQUENCE = [
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
] as const;

/**
 * Checks if an array of keys/codes matches the Konami sequence.
 */
export function checkKonamiSequence(keys: string[]): boolean {
  if (keys.length !== KONAMI_SEQUENCE.length) return false;
  return keys.every((key, i) => {
    const target = KONAMI_SEQUENCE[i];
    if (key === target) return true;
    if (key.toLowerCase() === target.toLowerCase()) return true;
    if (target === 'KeyB' && (key === 'b' || key === 'B' || key === 'KeyB')) return true;
    if (target === 'KeyA' && (key === 'a' || key === 'A' || key === 'KeyA')) return true;
    return false;
  });
}

/**
 * Hook to listen for the global Konami code sequence and invoke onSuccess when completed.
 */
export function useKonamiCode(onSuccess: () => void) {
  const callbackRef = useRef(onSuccess);
  callbackRef.current = onSuccess;

  useEffect(() => {
    let buffer: string[] = [];

    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code || e.key;
      buffer = [...buffer, code].slice(-KONAMI_SEQUENCE.length);

      if (checkKonamiSequence(buffer)) {
        callbackRef.current();
        buffer = [];
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}
