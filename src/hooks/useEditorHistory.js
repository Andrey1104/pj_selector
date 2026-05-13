import { useState, useRef, useCallback } from 'react';
import { HISTORY_LIMIT } from '@/lib/editor/constants';

export function useEditorHistory(initialObjects = []) {
  const [history, setHistory] = useState({ past: [], future: [] });
  const objectsRef = useRef(initialObjects);

  const updateObjectsRef = useCallback((objects) => {
    objectsRef.current = objects;
  }, []);

  const pushHistory = useCallback(() => {
    setHistory((h) => ({
      past: [...h.past, JSON.stringify(objectsRef.current)].slice(-HISTORY_LIMIT),
      future: []
    }));
  }, []);

  const undo = useCallback((setObjects) => {
    setHistory((h) => {
      if (h.past.length === 0) return h;
      const prev = h.past[h.past.length - 1];
      const future = [JSON.stringify(objectsRef.current), ...h.future];
      setObjects(JSON.parse(prev));
      return { past: h.past.slice(0, -1), future };
    });
  }, []);

  const redo = useCallback((setObjects) => {
    setHistory((h) => {
      if (h.future.length === 0) return h;
      const next = h.future[0];
      const past = [...h.past, JSON.stringify(objectsRef.current)];
      setObjects(JSON.parse(next));
      return { past, future: h.future.slice(1) };
    });
  }, []);

  return {
    history,
    pushHistory,
    undo,
    redo,
    updateObjectsRef,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0
  };
}

export default useEditorHistory;
