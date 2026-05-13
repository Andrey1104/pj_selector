import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getBBox } from '@/lib/editor/bbox';
import { scaleObjectFromCenter } from '@/lib/editor/transforms';

export function ScaleControl({
  objects,
  setObjects,
  layerScale,
  setLayerScale,
  originalObjectsForScale,
  setOriginalObjectsForScale,
  pushHistory,
  scaleToTargetMm,
  largestLayerInfo
}) {
  const containerRef = useRef(null);
  const [inputValue, setInputValue] = useState('100');

  useEffect(() => {
    setInputValue(String(Math.round(layerScale)));
  }, [layerScale]);

  const applyScale = (newScale, finalize = false) => {
    if (objects.length === 0) return;

    const origObjects = originalObjectsForScale || objects;
    if (!originalObjectsForScale) {
      setOriginalObjectsForScale(JSON.parse(JSON.stringify(objects)));
    }

    setLayerScale(newScale);

    const scale = newScale / 100;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const sourceObjects = originalObjectsForScale || origObjects;
    for (const o of sourceObjects) {
      const bbox = getBBox(o);
      minX = Math.min(minX, bbox.x);
      minY = Math.min(minY, bbox.y);
      maxX = Math.max(maxX, bbox.x + bbox.w);
      maxY = Math.max(maxY, bbox.y + bbox.h);
    }
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const scaled = sourceObjects.map(o => scaleObjectFromCenter(o, scale, centerX, centerY));
    setObjects(scaled);

    if (finalize) {
      setOriginalObjectsForScale(null);
      setLayerScale(100);
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -5 : 5;
    const newScale = Math.max(10, Math.min(200, layerScale + delta));
    applyScale(newScale);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault();
      const newScale = Math.min(200, layerScale + 1);
      applyScale(newScale);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const newScale = Math.max(10, layerScale - 1);
      applyScale(newScale);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      applyScale(layerScale, true);
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleInputSubmit = () => {
    const val = parseInt(inputValue, 10);
    if (!isNaN(val) && val >= 10 && val <= 200) {
      applyScale(val, true);
    } else {
      setInputValue(String(Math.round(layerScale)));
    }
  };

  const decrementScale = () => {
    const newScale = Math.max(10, layerScale - 1);
    applyScale(newScale);
  };

  const incrementScale = () => {
    const newScale = Math.min(200, layerScale + 1);
    applyScale(newScale);
  };

  const finalizeScale = () => {
    setOriginalObjectsForScale(null);
    setLayerScale(100);
  };

  return (
    <div className="mt-3 pt-3 border-t border-zinc-800">
      <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
        Scale all layers
      </div>
      <div
        ref={containerRef}
        className="flex items-center gap-1 mb-2"
        onWheel={handleWheel}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        data-testid="scale-control-container"
      >
        <button
          onClick={decrementScale}
          className="p-1 border border-zinc-800 text-zinc-400 hover:text-amber-500 hover:border-amber-500"
          title="Decrease scale (Arrow Left)"
          data-testid="scale-decrement"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <input
          type="range"
          min={10}
          max={200}
          value={layerScale}
          onChange={(e) => applyScale(Number(e.target.value))}
          onMouseUp={finalizeScale}
          onTouchEnd={finalizeScale}
          data-testid="layer-scale-slider"
          className="flex-1 accent-amber-500"
        />

        <button
          onClick={incrementScale}
          className="p-1 border border-zinc-800 text-zinc-400 hover:text-amber-500 hover:border-amber-500"
          title="Increase scale (Arrow Right)"
          data-testid="scale-increment"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleInputSubmit();
            }
          }}
          className="w-12 bg-transparent border border-zinc-800 px-1 py-0.5 text-xs font-mono text-white text-center focus:border-amber-500 focus:outline-none"
          data-testid="scale-input"
        />
        <span className="text-[10px] font-mono text-zinc-500">%</span>
      </div>

      <div className="text-[8px] font-mono text-zinc-600 mb-3">
        Scroll wheel, arrows, or type to adjust. Press Enter or release to apply.
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => scaleToTargetMm(26)}
          disabled={!largestLayerInfo}
          className="flex-1 py-1.5 border border-zinc-800 text-[10px] font-mono uppercase tracking-wider text-zinc-300 hover:border-amber-500 hover:text-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="scale-to-26mm"
        >
          26 mm
        </button>
        <button
          onClick={() => scaleToTargetMm(44)}
          disabled={!largestLayerInfo}
          className="flex-1 py-1.5 border border-zinc-800 text-[10px] font-mono uppercase tracking-wider text-zinc-300 hover:border-amber-500 hover:text-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="scale-to-44mm"
        >
          44 mm
        </button>
      </div>

      {largestLayerInfo && (
        <div className="text-[8px] font-mono text-zinc-600 mt-2 text-center">
          Current max: {largestLayerInfo.sizeMm.toFixed(1)} mm
        </div>
      )}
    </div>
  );
}

export default ScaleControl;
