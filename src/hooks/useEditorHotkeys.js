import { useEffect, useCallback } from 'react';
import { TOOLS } from '@/lib/editor/constants';

export function useEditorHotkeys({
  selectedId,
  setSelectedId,
  setTool,
  setObjects,
  undo,
  redo,
  copySelected,
  pasteClipboard,
  centerOnCanvas,
  deleteSelected,
}) {
  const handleKeyDown = useCallback((e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    const tool = TOOLS.find((x) => x.key === e.key.toLowerCase());
    if (tool) {
      setTool(tool.id);
      return;
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedId && deleteSelected) {
        deleteSelected();
      }
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo?.();
      return;
    }

    if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
      e.preventDefault();
      redo?.();
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
      e.preventDefault();
      copySelected?.();
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
      e.preventDefault();
      pasteClipboard?.();
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      centerOnCanvas?.();
      return;
    }

    if (e.key === 'Escape') {
      setSelectedId?.(null);
      return;
    }
  }, [selectedId, setSelectedId, setTool, setObjects, undo, redo, copySelected, pasteClipboard, centerOnCanvas, deleteSelected]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export default useEditorHotkeys;
