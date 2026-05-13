import { useCallback } from 'react';
import { getBBox } from '@/lib/editor/bbox';
import { translate, scaleObjectFromCenter, flipObject, rotateObject, centerObjectsOnCanvas } from '@/lib/editor/transforms';
import { parsePath, serializePath } from '@/lib/editor/path-operations';
import { newId } from '@/lib/editor/utils';
import { CANVAS_W, CANVAS_H } from '@/lib/editor/constants';

export function useObjectManipulation({
  objects,
  setObjects,
  selectedId,
  setSelectedId,
  selectedLayerIds,
  setSelectedLayerIds,
  pushHistory,
  clipboard,
  setClipboard,
}) {

  const getTargetIds = useCallback(() => {
    return selectedLayerIds.size > 0 ? [...selectedLayerIds] : (selectedId ? [selectedId] : []);
  }, [selectedLayerIds, selectedId]);

  const translateObject = useCallback((o, dx, dy) => {
    return translate(o, dx, dy);
  }, []);

  const alignObjects = useCallback((alignment) => {
    const ids = getTargetIds();
    if (ids.length === 0) return;

    pushHistory();
    const objsToAlign = objects.filter(o => ids.includes(o.id));

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const o of objsToAlign) {
      const bbox = getBBox(o);
      minX = Math.min(minX, bbox.x);
      minY = Math.min(minY, bbox.y);
      maxX = Math.max(maxX, bbox.x + bbox.w);
      maxY = Math.max(maxY, bbox.y + bbox.h);
    }

    setObjects(prev => prev.map(o => {
      if (!ids.includes(o.id)) return o;
      const bbox = getBBox(o);
      let dx = 0, dy = 0;

      switch (alignment) {
        case 'left':
          dx = minX - bbox.x;
          break;
        case 'centerH':
          dx = (minX + maxX) / 2 - (bbox.x + bbox.w / 2);
          break;
        case 'right':
          dx = maxX - (bbox.x + bbox.w);
          break;
        case 'top':
          dy = minY - bbox.y;
          break;
        case 'centerV':
          dy = (minY + maxY) / 2 - (bbox.y + bbox.h / 2);
          break;
        case 'bottom':
          dy = maxY - (bbox.y + bbox.h);
          break;
        default:
          break;
      }

      return translate(o, dx, dy);
    }));
  }, [getTargetIds, objects, setObjects, pushHistory]);

  const flipObjects = useCallback((direction) => {
    const ids = getTargetIds();
    if (ids.length === 0) return;

    pushHistory();
    const objsToFlip = objects.filter(o => ids.includes(o.id));

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const o of objsToFlip) {
      const bbox = getBBox(o);
      minX = Math.min(minX, bbox.x);
      minY = Math.min(minY, bbox.y);
      maxX = Math.max(maxX, bbox.x + bbox.w);
      maxY = Math.max(maxY, bbox.y + bbox.h);
    }
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setObjects(prev => prev.map(o => {
      if (!ids.includes(o.id)) return o;
      return flipObject(o, direction, centerX, centerY);
    }));
  }, [getTargetIds, objects, setObjects, pushHistory]);

  const rotateObjects = useCallback((degrees) => {
    const ids = getTargetIds();
    if (ids.length === 0) return;

    pushHistory();
    const objsToRotate = objects.filter(o => ids.includes(o.id));

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const o of objsToRotate) {
      const bbox = getBBox(o);
      minX = Math.min(minX, bbox.x);
      minY = Math.min(minY, bbox.y);
      maxX = Math.max(maxX, bbox.x + bbox.w);
      maxY = Math.max(maxY, bbox.y + bbox.h);
    }
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const rad = (degrees * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    setObjects(prev => prev.map(o => {
      if (!ids.includes(o.id)) return o;
      return rotateObject(o, centerX, centerY, cos, sin);
    }));
  }, [getTargetIds, objects, setObjects, pushHistory]);

  const centerOnCanvas = useCallback(() => {
    if (objects.length === 0) return;
    pushHistory();
    setObjects(centerObjectsOnCanvas(objects, CANVAS_W, CANVAS_H));
  }, [objects, setObjects, pushHistory]);

  const copySelected = useCallback(() => {
    const ids = getTargetIds();
    if (ids.length === 0) return;
    const objsToCopy = objects.filter(o => ids.includes(o.id));
    setClipboard(JSON.parse(JSON.stringify(objsToCopy)));
    return objsToCopy.length;
  }, [getTargetIds, objects, setClipboard]);

  const pasteClipboard = useCallback(() => {
    if (!clipboard || clipboard.length === 0) return 0;
    pushHistory();
    const offset = 20;
    const newObjs = clipboard.map(o => ({
      ...o,
      id: newId(),
      ...(o.x !== undefined ? { x: o.x + offset } : {}),
      ...(o.y !== undefined ? { y: o.y + offset } : {}),
      ...(o.cx !== undefined ? { cx: o.cx + offset } : {}),
      ...(o.cy !== undefined ? { cy: o.cy + offset } : {}),
    }));
    setObjects(prev => [...prev, ...newObjs]);
    setSelectedLayerIds(new Set(newObjs.map(o => o.id)));
    return newObjs.length;
  }, [clipboard, setObjects, setSelectedLayerIds, pushHistory]);

  const bringForward = useCallback(() => {
    if (!selectedId) return;
    pushHistory();
    setObjects(prev => {
      const idx = prev.findIndex(o => o.id === selectedId);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const next = prev.slice();
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }, [selectedId, setObjects, pushHistory]);

  const sendBackward = useCallback(() => {
    if (!selectedId) return;
    pushHistory();
    setObjects(prev => {
      const idx = prev.findIndex(o => o.id === selectedId);
      if (idx <= 0) return prev;
      const next = prev.slice();
      [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
      return next;
    });
  }, [selectedId, setObjects, pushHistory]);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    pushHistory();
    setObjects(prev => prev.filter(o => o.id !== selectedId));
    setSelectedId(null);
  }, [selectedId, setObjects, setSelectedId, pushHistory]);

  const updateSelected = useCallback((patch) => {
    setObjects(prev => prev.map(o => (o.id === selectedId ? { ...o, ...patch } : o)));
  }, [selectedId, setObjects]);

  const scaleToTargetMm = useCallback((targetMm, largestLayerInfo) => {
    if (!largestLayerInfo || objects.length === 0) return;
    const currentSizeMm = largestLayerInfo.sizeMm;
    if (currentSizeMm <= 0) return;
    const scale = targetMm / currentSizeMm;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const o of objects) {
      const bbox = getBBox(o);
      minX = Math.min(minX, bbox.x);
      minY = Math.min(minY, bbox.y);
      maxX = Math.max(maxX, bbox.x + bbox.w);
      maxY = Math.max(maxY, bbox.y + bbox.h);
    }
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    pushHistory();
    setObjects(objects.map(o => scaleObjectFromCenter(o, scale, centerX, centerY)));
  }, [objects, setObjects, pushHistory]);

  return {
    translateObject,
    alignObjects,
    flipObjects,
    rotateObjects,
    centerOnCanvas,
    copySelected,
    pasteClipboard,
    bringForward,
    sendBackward,
    deleteSelected,
    updateSelected,
    scaleToTargetMm,
    getTargetIds,
  };
}

export default useObjectManipulation;
