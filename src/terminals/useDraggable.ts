import { useState, useCallback, useRef, useEffect } from 'react';

export interface DragPosition {
  x: number;
  y: number;
}

export interface UseDraggableOptions {
  onDragStart?: (id: string, worldPos: DragPosition, e: React.PointerEvent) => void;
  onDrag?: (id: string, worldPos: DragPosition, delta: DragPosition) => void;
  onDragEnd?: (id: string, worldPos: DragPosition) => void;
  screenToWorld?: (screen: DragPosition) => DragPosition;
  disabled?: boolean;
}

export function useDraggable(options: UseDraggableOptions = {}) {
  const { screenToWorld, disabled = false } = options;
  const [isDragging, setIsDragging] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const activeIdRef = useRef<string | null>(null);
  const lastScreenPosRef = useRef<DragPosition>({ x: 0, y: 0 });
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const handlePointerDown = useCallback(
    (id: string, e: React.PointerEvent) => {
      if (disabled || e.button !== 0) return;

      e.stopPropagation();
      activeIdRef.current = id;
      setDraggedId(id);
      setIsDragging(true);

      const screenPos: DragPosition = { x: e.clientX, y: e.clientY };
      lastScreenPosRef.current = screenPos;

      const worldPos = screenToWorld ? screenToWorld(screenPos) : screenPos;
      if (optionsRef.current.onDragStart) {
        optionsRef.current.onDragStart(id, worldPos, e);
      }
    },
    [disabled, screenToWorld]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      const currentId = activeIdRef.current;
      if (!currentId) return;

      const currentScreenPos: DragPosition = { x: e.clientX, y: e.clientY };
      const delta: DragPosition = {
        x: currentScreenPos.x - lastScreenPosRef.current.x,
        y: currentScreenPos.y - lastScreenPosRef.current.y,
      };
      lastScreenPosRef.current = currentScreenPos;

      const currentWorldPos = optionsRef.current.screenToWorld
        ? optionsRef.current.screenToWorld(currentScreenPos)
        : currentScreenPos;

      if (optionsRef.current.onDrag) {
        optionsRef.current.onDrag(currentId, currentWorldPos, delta);
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      const currentId = activeIdRef.current;
      if (!currentId) return;

      const finalScreenPos: DragPosition = { x: e.clientX, y: e.clientY };
      const finalWorldPos = optionsRef.current.screenToWorld
        ? optionsRef.current.screenToWorld(finalScreenPos)
        : finalScreenPos;

      if (optionsRef.current.onDragEnd) {
        optionsRef.current.onDragEnd(currentId, finalWorldPos);
      }

      activeIdRef.current = null;
      setDraggedId(null);
      setIsDragging(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isDragging]);

  return {
    isDragging,
    draggedId,
    handlePointerDown,
  };
}
