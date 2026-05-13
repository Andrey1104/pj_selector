import React, { useEffect, useRef, useState } from 'react';
import { getBBox, hitTest, translate, applyBBoxTransform } from '@/lib/editor-utils';


const GLASS_SIZES = {
  small: { outer: 37, inner: 26 },
  large: { outer: 66, inner: 44 },
};

export default function CanvasSVG({
  width, height, canvasMm = 150, objects, setObjects, selectedId, setSelectedId,
  tool, setTool, fill, stroke, strokeWidth, opacity,
  bgImageUrl, bgOpacity,
  onPointerCoords,
  glassSize = 'small',
  wireframeMode = false,
}) {
  const svgRef = useRef(null);
  const drawingRef = useRef(null);
  const polygonRef = useRef(null);
  const dragRef = useRef(null);
  const handleRef = useRef(null);

  const HANDLE_KEYS = ['nw','n','ne','e','se','s','sw','w'];

  function getCoords(e) {
    const svg = svgRef.current;
    const r = svg.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * width;
    const y = ((e.clientY - r.top) / r.height) * height;
    return [x, y];
  }

  function commitObject(obj) {
    setObjects((prev) => [...prev, obj]);
    return obj;
  }

  function updateLast(updater) {
    setObjects((prev) => {
      if (prev.length === 0) return prev;
      const next = prev.slice();
      next[next.length - 1] = updater(next[next.length - 1]);
      return next;
    });
  }

  function updateById(id, updater) {
    setObjects((prev) => prev.map((o) => (o.id === id ? updater(o) : o)));
  }

  function shapeBase() {
    return {
      id: Math.random().toString(36).slice(2, 10),
      fill, stroke, strokeWidth, opacity,
      visible: true, locked: false,
    };
  }

  function onPointerDown(e) {
    e.target.setPointerCapture?.(e.pointerId);
    const [x, y] = getCoords(e);

    if (e.target.dataset.handle && selectedId) {
      const sel = objects.find((o) => o.id === selectedId);
      // Prevent resize if size is locked
      if (sel && !sel.locked && !sel.sizeLocked) {
        handleRef.current = { handle: e.target.dataset.handle, oldBox: getBBox(sel), origObj: sel };
      }
      return;
    }

    if (tool === 'select') {
      let hit = null;
      for (let i = objects.length - 1; i >= 0; i--) {
        const o = objects[i];
        if (o.visible === false || o.locked) continue;
        if (hitTest(o, x, y)) { hit = o; break; }
      }
      if (hit) {
        setSelectedId(hit.id);
        dragRef.current = { startX: x, startY: y, origObj: hit };
      } else {
        setSelectedId(null);
      }
      return;
    }

    if (tool === 'polygon') {
      if (polygonRef.current) {
        updateById(polygonRef.current.id, (o) => ({ ...o, points: [...o.points, [x, y]] }));
      } else {
        const obj = { ...shapeBase(), type: 'polygon', name: 'Polygon', points: [[x, y]] };
        polygonRef.current = { id: obj.id };
        commitObject(obj);
      }
      return;
    }

    if (tool === 'text') {
      const t = window.prompt('Enter text:', 'TEXT');
      if (!t) return;
      const obj = { ...shapeBase(), type: 'text', name: 'Text', x, y: y + 20, text: t, fontSize: 32, fontFamily: 'IBM Plex Sans', fill: fill || '#000', stroke: 'none', strokeWidth: 0 };
      commitObject(obj);
      setSelectedId(obj.id);
      setTool('select');
      return;
    }

    if (tool === 'brush') {
      const obj = { ...shapeBase(), type: 'path', name: 'Brush', points: [[x, y]], fill: 'none', stroke: stroke || fill || '#000', strokeWidth };
      drawingRef.current = { id: obj.id, type: 'path', startX: x, startY: y };
      commitObject(obj);
      return;
    }

    if (tool === 'rect') {
      const obj = { ...shapeBase(), type: 'rect', name: 'Rectangle', x, y, width: 1, height: 1 };
      drawingRef.current = { id: obj.id, type: 'rect', startX: x, startY: y };
      commitObject(obj);
      return;
    }

    if (tool === 'square') {
      const obj = { ...shapeBase(), type: 'rect', name: 'Square', x, y, width: 1, height: 1, isSquare: true };
      drawingRef.current = { id: obj.id, type: 'square', startX: x, startY: y };
      commitObject(obj);
      return;
    }

    if (tool === 'ellipse') {
      const obj = { ...shapeBase(), type: 'ellipse', name: 'Ellipse', cx: x, cy: y, rx: 1, ry: 1 };
      drawingRef.current = { id: obj.id, type: 'ellipse', startX: x, startY: y };
      commitObject(obj);
      return;
    }

    if (tool === 'circle') {
      const obj = { ...shapeBase(), type: 'ellipse', name: 'Circle', cx: x, cy: y, rx: 1, ry: 1, isCircle: true };
      drawingRef.current = { id: obj.id, type: 'circle', startX: x, startY: y };
      commitObject(obj);
      return;
    }

    if (tool === 'line') {
      const obj = { ...shapeBase(), type: 'line', name: 'Line', x1: x, y1: y, x2: x, y2: y, stroke: stroke || fill || '#000', strokeWidth, fill: 'none' };
      drawingRef.current = { id: obj.id, type: 'line', startX: x, startY: y };
      commitObject(obj);
      return;
    }

    if (tool === 'triangle') {
      const obj = { ...shapeBase(), type: 'polygon', name: 'Triangle', points: [[x, y]], shapeType: 'triangle' };
      drawingRef.current = { id: obj.id, type: 'triangle', startX: x, startY: y };
      commitObject(obj);
      return;
    }

    if (tool === 'octagon') {
      const obj = { ...shapeBase(), type: 'polygon', name: 'Octagon', points: [[x, y]], shapeType: 'octagon' };
      drawingRef.current = { id: obj.id, type: 'octagon', startX: x, startY: y };
      commitObject(obj);
      return;
    }
  }

  function onPointerMove(e) {
    const [x, y] = getCoords(e);
    onPointerCoords?.(x, y);

    if (handleRef.current) {
      const { handle, oldBox, origObj } = handleRef.current;
      const newBox = computeResizedBox(oldBox, handle, x, y);
      updateById(origObj.id, () => applyBBoxTransform(origObj, oldBox, newBox));
      return;
    }
    if (dragRef.current) {
      const { startX, startY, origObj } = dragRef.current;
      const dx = x - startX;
      const dy = y - startY;
      updateById(origObj.id, () => translate(origObj, dx, dy));
      return;
    }

    if (drawingRef.current) {
      const d = drawingRef.current;
      if (d.type === 'path') {
        updateLast((last) => ({ ...last, points: [...last.points, [x, y]] }));
      } else if (d.type === 'rect') {
        const nx = Math.min(d.startX, x);
        const ny = Math.min(d.startY, y);
        updateLast((last) => ({ ...last, x: nx, y: ny, width: Math.abs(x - d.startX) || 1, height: Math.abs(y - d.startY) || 1 }));
      } else if (d.type === 'ellipse') {
        updateLast((last) => ({ ...last, rx: Math.abs(x - d.startX) || 1, ry: Math.abs(y - d.startY) || 1 }));
      } else if (d.type === 'line') {
        updateLast((last) => ({ ...last, x2: x, y2: y }));
      } else if (d.type === 'square') {
        const size = Math.max(Math.abs(x - d.startX), Math.abs(y - d.startY)) || 1;
        const nx = x < d.startX ? d.startX - size : d.startX;
        const ny = y < d.startY ? d.startY - size : d.startY;
        updateLast((last) => ({ ...last, x: nx, y: ny, width: size, height: size }));
      } else if (d.type === 'circle') {
        const r = Math.max(Math.abs(x - d.startX), Math.abs(y - d.startY)) || 1;
        updateLast((last) => ({ ...last, rx: r, ry: r }));
      } else if (d.type === 'triangle') {
        const size = Math.max(Math.abs(x - d.startX), Math.abs(y - d.startY)) || 1;
        const cx = d.startX;
        const cy = d.startY;
        const h = size * Math.sqrt(3) / 2;
        const points = [
          [cx, cy - size],
          [cx - h, cy + size / 2],
          [cx + h, cy + size / 2],
        ];
        updateLast((last) => ({ ...last, points }));
      } else if (d.type === 'octagon') {
        const size = Math.max(Math.abs(x - d.startX), Math.abs(y - d.startY)) || 1;
        const cx = d.startX;
        const cy = d.startY;
        const points = [];
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI / 8) + (i * Math.PI / 4);
          points.push([
            cx + size * Math.cos(angle),
            cy + size * Math.sin(angle)
          ]);
        }
        updateLast((last) => ({ ...last, points }));
      }
    }
  }

  function onPointerUp() {
    if (drawingRef.current) {
      setSelectedId(drawingRef.current.id);
      drawingRef.current = null;
    }
    handleRef.current = null;
    dragRef.current = null;
  }

  function onDoubleClick() {
    if (polygonRef.current) {
      polygonRef.current = null;
      setTool('select');
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Escape' && polygonRef.current) {
      polygonRef.current = null;
    }
  }
  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const selected = selectedId ? objects.find((o) => o.id === selectedId) : null;
  const selectedBox = selected ? getBBox(selected) : null;
  const pxPerMm = width / canvasMm;
  const glassSizeConfig = GLASS_SIZES[glassSize] || GLASS_SIZES.small;

  return (
    <div className="relative w-full h-full" style={{ paddingLeft: '28px', paddingBottom: '28px' }}>
      <div className="absolute left-0 top-0 w-7 pointer-events-none" style={{ bottom: '28px' }}>
        <svg width="100%" height="100%" viewBox={`0 0 28 ${height}`} preserveAspectRatio="none" className="overflow-visible">
          <rect x="0" y="0" width="28" height={height} fill="#18181b" />
          {Array.from({ length: Math.floor(canvasMm / 5) + 1 }, (_, i) => {
            const mm = i * 5;
            const y = height - (mm * pxPerMm);
            const isMajor = mm % 10 === 0;
            return (
              <g key={mm}>
                <line x1={isMajor ? 12 : 18} y1={y} x2={28} y2={y} stroke={isMajor ? "#a1a1aa" : "#52525b"} strokeWidth={isMajor ? 1.5 : 1} />
                {isMajor && (
                  <text x={10} y={y + 3} textAnchor="end" fill="#d4d4d8" fontSize="9" fontFamily="monospace" fontWeight="500">
                    {mm}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="absolute bottom-0 h-7 pointer-events-none" style={{ left: '28px', right: 0 }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${width} 28`} preserveAspectRatio="none" className="overflow-visible">
          <rect x="0" y="0" width={width} height="28" fill="#18181b" />
          {Array.from({ length: Math.floor(canvasMm / 5) + 1 }, (_, i) => {
            const mm = i * 5;
            const x = mm * pxPerMm;
            const isMajor = mm % 10 === 0;
            return (
              <g key={mm}>
                <line x1={x} y1={0} x2={x} y2={isMajor ? 16 : 10} stroke={isMajor ? "#a1a1aa" : "#52525b"} strokeWidth={isMajor ? 1.5 : 1} />
                {isMajor && (
                  <text x={x} y={24} textAnchor="middle" fill="#d4d4d8" fontSize="9" fontFamily="monospace" fontWeight="500">
                    {mm}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="absolute left-0 bottom-0 w-7 h-7 bg-zinc-900 flex items-center justify-center pointer-events-none">
        <span className="text-[8px] font-mono text-zinc-500">mm</span>
      </div>
      <svg
        ref={svgRef}
        data-testid="design-canvas"
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full bg-checker border border-zinc-800 cursor-crosshair touch-none select-none"
        style={{ display: 'block' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
      >
      {bgImageUrl && (
        <image href={bgImageUrl} x="0" y="0" width={width} height={height} preserveAspectRatio="xMidYMid meet" opacity={bgOpacity} />
      )}

      {(() => {
        const localPxPerMm = width / canvasMm;
        const outerRadiusMm = glassSizeConfig.outer / 2;
        const innerRadiusMm = glassSizeConfig.inner / 2;
        const outerRadius = outerRadiusMm * localPxPerMm;
        const innerRadius = innerRadiusMm * localPxPerMm;
        const centerX = width / 2;
        const centerY = height / 2;

        return (
          <g data-testid="glass-visualization" pointerEvents="none">
            <circle
              cx={centerX}
              cy={centerY}
              r={outerRadius}
              fill="rgba(59, 130, 246, 0.06)"
              stroke="rgba(59, 130, 246, 0.5)"
              strokeWidth="2"
              strokeDasharray="10 5"
            />
            <circle
              cx={centerX}
              cy={centerY}
              r={innerRadius}
              fill="rgba(156, 163, 175, 0.08)"
              stroke="rgba(156, 163, 175, 0.6)"
              strokeWidth="2"
              strokeDasharray="6 3"
            />
          </g>
        );
      })()}

      {objects.filter((o) => o.visible !== false).map((o) => (
        <ShapeNode key={o.id} o={o} onSelect={() => tool === 'select' && setSelectedId(o.id)} wireframeMode={wireframeMode} />
      ))}
      {selected && selectedBox && (
        <g key="selection-overlay">
          <rect
            key="selection-bbox"
            x={selectedBox.x} y={selectedBox.y} width={selectedBox.w} height={selectedBox.h}
            fill="none" stroke={selected.sizeLocked ? "#EF4444" : "#F59E0B"} strokeWidth="1" strokeDasharray="4 4" pointerEvents="none"
          />
          {/* Show resize handles only if not locked and not sizeLocked */}
          {!selected.locked && !selected.sizeLocked && HANDLE_KEYS.map((h) => {
            const pos = handlePos(h, selectedBox);
            return (
              <rect
                key={h}
                data-handle={h}
                data-testid={`handle-${h}`}
                x={pos.x - 5} y={pos.y - 5} width="10" height="10"
                fill="#F59E0B" stroke="#000" strokeWidth="1"
                style={{ cursor: handleCursor(h) }}
              />
            );
          })}
          {/* Show lock indicator when sizeLocked */}
          {selected.sizeLocked && (
            <g transform={`translate(${selectedBox.x + selectedBox.w / 2}, ${selectedBox.y - 15})`}>
              <rect x="-20" y="-8" width="40" height="16" fill="#EF4444" rx="2" />
              <text x="0" y="4" textAnchor="middle" fill="white" fontSize="9" fontFamily="monospace">LOCKED</text>
            </g>
          )}
        </g>
      )}
      </svg>
    </div>
  );
}

function ShapeNode({ o, wireframeMode = false }) {
  // Wireframe mode: transparent fill, thin blue stroke
  const wireframeFill = 'none';
  const wireframeStroke = '#3B82F6';
  const wireframeStrokeWidth = 1;

  const getFill = () => wireframeMode ? wireframeFill : (o.fill || 'none');
  const getStroke = () => wireframeMode ? wireframeStroke : (o.stroke || 'none');
  const getStrokeWidth = () => wireframeMode ? wireframeStrokeWidth : (o.strokeWidth || 0);
  const getOpacity = () => wireframeMode ? 1 : (o.opacity ?? 1);

  switch (o.type) {
    case 'rect':
      return <rect x={o.x} y={o.y} width={o.width} height={o.height} fill={getFill()} stroke={getStroke()} strokeWidth={getStrokeWidth()} opacity={getOpacity()} />;
    case 'ellipse':
      return <ellipse cx={o.cx} cy={o.cy} rx={o.rx} ry={o.ry} fill={getFill()} stroke={getStroke()} strokeWidth={getStrokeWidth()} opacity={getOpacity()} />;
    case 'line':
      return <line x1={o.x1} y1={o.y1} x2={o.x2} y2={o.y2} stroke={wireframeMode ? wireframeStroke : (o.stroke || '#000')} strokeWidth={wireframeMode ? wireframeStrokeWidth : (o.strokeWidth || 1)} opacity={getOpacity()} />;
    case 'polygon':
      return <polygon points={(o.points || []).map(([x, y]) => `${x},${y}`).join(' ')} fill={getFill()} stroke={getStroke()} strokeWidth={getStrokeWidth()} opacity={getOpacity()} />;
    case 'path': {
      const d = o.d || (o.points || []).map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
      return <path d={d} fill={getFill()} stroke={wireframeMode ? wireframeStroke : (o.stroke || '#000')} strokeWidth={wireframeMode ? wireframeStrokeWidth : (o.strokeWidth || 2)} strokeLinecap="round" strokeLinejoin="round" opacity={getOpacity()} key={d} />;
    }
    case 'text':
      return (
        <text 
          x={o.x} 
          y={o.y} 
          fontSize={o.fontSize || 24} 
          fontFamily={o.fontFamily || 'sans-serif'} 
          fontWeight={o.fontWeight || 'normal'}
          fontStyle={o.fontStyle || 'normal'}
          textDecoration={o.textDecoration || 'none'}
          textAnchor={o.textAnchor || 'start'}
          fill={wireframeMode ? wireframeStroke : (o.fill || '#000')}
          stroke={wireframeMode ? wireframeStroke : 'none'}
          strokeWidth={wireframeMode ? 0.5 : 0}
          opacity={getOpacity()}
        >
          {o.text}
        </text>
      );
    case 'image':
      if (wireframeMode) {
        // In wireframe mode, show a rectangle placeholder for images
        return <rect x={o.x} y={o.y} width={o.width} height={o.height} fill="none" stroke={wireframeStroke} strokeWidth={wireframeStrokeWidth} strokeDasharray="4 2" opacity={0.5} />;
      }
      return <image x={o.x} y={o.y} width={o.width} height={o.height} href={o.href} opacity={o.opacity ?? 1} />;
    case 'rectset': {
      const d = (o.cells || []).map(([x, y, w, h]) => `M${x},${y} h${w} v${h} h${-w} z`).join(' ');
      return <path d={d} fill={getFill()} stroke={getStroke()} strokeWidth={getStrokeWidth()} opacity={getOpacity()} />;
    }
    case 'svgpath':
      return <path key={o.d} d={o.d || ''} fill={getFill()} stroke={getStroke()} strokeWidth={getStrokeWidth()} fillRule={o.fillRule || 'nonzero'} opacity={getOpacity()} />;
    default:
      return null;
  }
}

function handlePos(handle, b) {
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  switch (handle) {
    case 'nw': return { x: b.x, y: b.y };
    case 'n':  return { x: cx, y: b.y };
    case 'ne': return { x: b.x + b.w, y: b.y };
    case 'e':  return { x: b.x + b.w, y: cy };
    case 'se': return { x: b.x + b.w, y: b.y + b.h };
    case 's':  return { x: cx, y: b.y + b.h };
    case 'sw': return { x: b.x, y: b.y + b.h };
    case 'w':  return { x: b.x, y: cy };
    default: return { x: cx, y: cy };
  }
}

function handleCursor(h) {
  return ({
    nw: 'nwse-resize', se: 'nwse-resize',
    ne: 'nesw-resize', sw: 'nesw-resize',
    n: 'ns-resize', s: 'ns-resize',
    e: 'ew-resize', w: 'ew-resize',
  })[h] || 'default';
}

function computeResizedBox(oldBox, handle, mx, my) {
  let { x, y, w, h } = oldBox;
  let nx = x, ny = y, nw = w, nh = h;
  if (handle.includes('w')) { nx = Math.min(mx, x + w - 1); nw = (x + w) - nx; }
  if (handle.includes('e')) { nw = Math.max(1, mx - x); }
  if (handle.includes('n')) { ny = Math.min(my, y + h - 1); nh = (y + h) - ny; }
  if (handle.includes('s')) { nh = Math.max(1, my - y); }
  return { x: nx, y: ny, w: Math.max(1, nw), h: Math.max(1, nh) };
}
