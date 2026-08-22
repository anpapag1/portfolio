import { useState, useEffect, useRef, useCallback } from 'react';

export function calculateTypewriterProgress(lines: string[], charCount: number): string[] {
  if (!lines || lines.length === 0 || charCount <= 0) {
    return [];
  }

  let remaining = charCount;
  const result: string[] = [];

  for (const line of lines) {
    if (remaining <= 0) break;
    if (remaining >= line.length) {
      result.push(line);
      remaining -= line.length;
    } else {
      result.push(line.slice(0, remaining));
      remaining = 0;
    }
  }

  return result;
}

export interface UseTypewriterReturn {
  visibleLines: string[];
  isComplete: boolean;
  completeInstantly: () => void;
}

export function useTypewriter(
  lines: string[],
  speed = 25,
  isVisible = true,
  reducedMotion = false
): UseTypewriterReturn {
  const totalChars = lines.reduce((acc, line) => acc + line.length, 0);
  const [charIndex, setCharIndex] = useState(() => (reducedMotion ? totalChars : 0));
  const [isComplete, setIsComplete] = useState(() => reducedMotion || totalChars === 0);
  const timerRef = useRef<number | null>(null);

  const completeInstantly = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCharIndex(totalChars);
    setIsComplete(true);
  }, [totalChars]);

  useEffect(() => {
    if (reducedMotion || totalChars === 0) {
      completeInstantly();
      return;
    }

    if (!isVisible || isComplete) {
      return;
    }

    timerRef.current = window.setInterval(() => {
      setCharIndex((prev) => {
        const next = prev + 1;
        if (next >= totalChars) {
          if (timerRef.current !== null) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setIsComplete(true);
          return totalChars;
        }
        return next;
      });
    }, speed);

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isVisible, speed, totalChars, isComplete, reducedMotion, completeInstantly]);

  const visibleLines = calculateTypewriterProgress(lines, charIndex);

  return {
    visibleLines,
    isComplete,
    completeInstantly,
  };
}
