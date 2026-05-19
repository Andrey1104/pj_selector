import React, {useEffect, useRef, useState, useCallback} from 'react';
import {getBBox, hitTest, translate, applyBBoxTransform} from '@/lib/editor-utils';


const GLASS_SIZES = {
  small: {outer: 37, inner: 26},
  large: {outer: 66, inner: 46},
};

export default function CanvasSVG({
                                    width, height, canvasMm = 150, objects, setObjects, selectedId, setSelectedId,
                                    tool, setTool, fill, stroke, strokeWidth, opacity,
                                    bgImageUrl, bgOpacity,
                                    onPointerCoords,
                                    glassSize = 'small',
                                    wireframeMode = false,
                                    selectionMode = 'single',
                                    selectedLayerIds,
                                    setSelectedLayerIds,
                                    dimensionLines = [],
                                    setDimensionLines,
                                    dimensionColor = '#EF4444',
                                    snapGuides = [],
                                    showSnapGuides = true,
                                    onSnapGuidesChange,
                                    snapEnabled = true,
                                    snapToCenter = true,
                                    snapToCircles = true,
                                    snapThreshold = 5,
                                  }) {
  const svgRef = useRef(null);
  const drawingRef = useRef(null);
  const polygonRef = useRef(null);
  const dragRef = useRef(null);
  const handleRef = useRef(null);
  const [marqueeRect, setMarqueeRect] = useState(null);
  const marqueeRef = useRef(null);
  const [draggingDimensionId, setDraggingDimensionId] = useState(null);
  const [activeSnapGuides, setActiveSnapGuides] = useState([]);

  const HANDLE_KEYS = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

  const calculateSnapGuides = useCallback((objBBox, centerX, centerY) => {
    if (!snapEnabled || !showSnapGuides) return [];

    const guides = [];
    const canvasCenterX = width / 2;
    const canvasCenterY = height / 2;
    const localPxPerMm = width / canvasMm;
    const glassSizeConfig = GLASS_SIZES[glassSize] || GLASS_SIZES.small;
    const innerRadius = (glassSizeConfig.inner / 2) * localPxPerMm;
    const outerRadius = (glassSizeConfig.outer / 2) * localPxPerMm;

    const objCenterX = objBBox.x + objBBox.w / 2;
    const objCenterY = objBBox.y + objBBox.h / 2;

    if (snapToCenter) {
      const distX = Math.abs(objCenterX - canvasCenterX);
      const distY = Math.abs(objCenterY - canvasCenterY);

      if (distX < snapThreshold * localPxPerMm) {
        guides.push({type: 'vertical', x: canvasCenterX, label: 'Center'});
      }
      if (distY < snapThreshold * localPxPerMm) {
        guides.push({type: 'horizontal', y: canvasCenterY, label: 'Center'});
      }
    }

    if (snapToCircles) {
      const distFromCenter = Math.sqrt(
        Math.pow(objCenterX - canvasCenterX, 2) +
        Math.pow(objCenterY - canvasCenterY, 2)
      );

      if (Math.abs(distFromCenter - innerRadius) < snapThreshold * localPxPerMm) {
        guides.push({type: 'circle', cx: canvasCenterX, cy: canvasCenterY, r: innerRadius, label: 'Inner'});
      }
      if (Math.abs(distFromCenter - outerRadius) < snapThreshold * localPxPerMm) {
        guides.push({type: 'circle', cx: canvasCenterX, cy: canvasCenterY, r: outerRadius, label: 'Outer'});
      }
    }

    return guides;
  }, [snapEnabled, showSnapGuides, snapToCenter, snapToCircles, snapThreshold, width, height, canvasMm, glassSize]);

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
      if (sel && !sel.locked && !sel.sizeLocked) {
        handleRef.current = {handle: e.target.dataset.handle, oldBox: getBBox(sel), origObj: sel};
      }
      return;
    }

    if (tool === 'select') {
      let hit = null;
      for (let i = objects.length - 1; i >= 0; i--) {
        const o = objects[i];
        if (o.visible === false || o.locked) continue;
        if (hitTest(o, x, y)) {
          hit = o;
          break;
        }
      }
      if (hit) {
        if (e.shiftKey && setSelectedLayerIds) {
          setSelectedLayerIds(prev => {
            const next = new Set(prev);
            if (next.has(hit.id)) {
              next.delete(hit.id);
            } else {
              next.add(hit.id);
            }
            return next;
          });
        } else {
          setSelectedId(hit.id);
          if (setSelectedLayerIds) {
            setSelectedLayerIds(new Set());
          }
        }
        dragRef.current = {startX: x, startY: y, origObj: hit};
      } else {
        if (selectionMode === 'marquee' || e.shiftKey) {
          marqueeRef.current = {startX: x, startY: y};
          setMarqueeRect({x, y, w: 0, h: 0});
        } else {
          setSelectedId(null);
          if (setSelectedLayerIds) {
            setSelectedLayerIds(new Set());
          }
        }
      }
      return;
    }

    if (tool === 'polygon') {
      if (polygonRef.current) {
        updateById(polygonRef.current.id, (o) => ({...o, points: [...o.points, [x, y]]}));
      } else {
        const obj = {...shapeBase(), type: 'polygon', name: 'Polygon', points: [[x, y]]};
        polygonRef.current = {id: obj.id};
        commitObject(obj);
      }
      return;
    }

    if (tool === 'text') {
      const t = window.prompt('Enter text:', 'TEXT');
      if (!t) return;
      const obj = {
        ...shapeBase(),
        type: 'text',
        name: 'Text',
        x,
        y: y + 20,
        text: t,
        fontSize: 32,
        fontFamily: 'IBM Plex Sans',
        fill: fill || '#000',
        stroke: 'none',
        strokeWidth: 0
      };
      commitObject(obj);
      setSelectedId(obj.id);
      setTool('select');
      return;
    }

    if (tool === 'brush') {
      const obj = {
        ...shapeBase(),
        type: 'path',
        name: 'Brush',
        points: [[x, y]],
        fill: 'none',
        stroke: stroke || fill || '#000',
        strokeWidth
      };
      drawingRef.current = {id: obj.id, type: 'path', startX: x, startY: y};
      commitObject(obj);
      return;
    }

    if (tool === 'rect') {
      const obj = {...shapeBase(), type: 'rect', name: 'Rectangle', x, y, width: 1, height: 1};
      drawingRef.current = {id: obj.id, type: 'rect', startX: x, startY: y};
      commitObject(obj);
      return;
    }

    if (tool === 'square') {
      const obj = {...shapeBase(), type: 'rect', name: 'Square', x, y, width: 1, height: 1, isSquare: true};
      drawingRef.current = {id: obj.id, type: 'square', startX: x, startY: y};
      commitObject(obj);
      return;
    }

    if (tool === 'ellipse') {
      const obj = {...shapeBase(), type: 'ellipse', name: 'Ellipse', cx: x, cy: y, rx: 1, ry: 1};
      drawingRef.current = {id: obj.id, type: 'ellipse', startX: x, startY: y};
      commitObject(obj);
      return;
    }

    if (tool === 'circle') {
      const obj = {...shapeBase(), type: 'ellipse', name: 'Circle', cx: x, cy: y, rx: 1, ry: 1, isCircle: true};
      drawingRef.current = {id: obj.id, type: 'circle', startX: x, startY: y};
      commitObject(obj);
      return;
    }

    if (tool === 'line') {
      const obj = {
        ...shapeBase(),
        type: 'line',
        name: 'Line',
        x1: x,
        y1: y,
        x2: x,
        y2: y,
        stroke: stroke || fill || '#000',
        strokeWidth,
        fill: 'none'
      };
      drawingRef.current = {id: obj.id, type: 'line', startX: x, startY: y};
      commitObject(obj);
      return;
    }

    if (tool === 'triangle') {
      const obj = {...shapeBase(), type: 'polygon', name: 'Triangle', points: [[x, y]], shapeType: 'triangle'};
      drawingRef.current = {id: obj.id, type: 'triangle', startX: x, startY: y};
      commitObject(obj);
      return;
    }

    if (tool === 'octagon') {
      const obj = {...shapeBase(), type: 'polygon', name: 'Octagon', points: [[x, y]], shapeType: 'octagon'};
      drawingRef.current = {id: obj.id, type: 'octagon', startX: x, startY: y};
      commitObject(obj);
      return;
    }
  }

  function onPointerMove(e) {
    const [x, y] = getCoords(e);
    onPointerCoords?.(x, y);

    if (marqueeRef.current) {
      const {startX, startY} = marqueeRef.current;
      const nx = Math.min(startX, x);
      const ny = Math.min(startY, y);
      const nw = Math.abs(x - startX);
      const nh = Math.abs(y - startY);
      setMarqueeRect({x: nx, y: ny, w: nw, h: nh});
      return;
    }

    if (handleRef.current) {
      const {handle, oldBox, origObj} = handleRef.current;
      const newBox = computeResizedBox(oldBox, handle, x, y);
      updateById(origObj.id, () => applyBBoxTransform(origObj, oldBox, newBox));
      return;
    }
    if (dragRef.current) {
      const {startX, startY, origObj} = dragRef.current;
      const dx = x - startX;
      const dy = y - startY;
      const translated = translate(origObj, dx, dy);
      updateById(origObj.id, () => translated);

      if (showSnapGuides && snapEnabled) {
        const bbox = getBBox(translated);
        const guides = calculateSnapGuides(bbox, width / 2, height / 2);
        setActiveSnapGuides(guides);
      }
      return;
    }
    if (drawingRef.current) {
      const d = drawingRef.current;
      if (d.type === 'path') {
        updateLast((last) => ({...last, points: [...last.points, [x, y]]}));
      } else if (d.type === 'rect') {
        const nx = Math.min(d.startX, x);
        const ny = Math.min(d.startY, y);
        updateLast((last) => ({
          ...last,
          x: nx,
          y: ny,
          width: Math.abs(x - d.startX) || 1,
          height: Math.abs(y - d.startY) || 1
        }));
      } else if (d.type === 'ellipse') {
        updateLast((last) => ({...last, rx: Math.abs(x - d.startX) || 1, ry: Math.abs(y - d.startY) || 1}));
      } else if (d.type === 'line') {
        updateLast((last) => ({...last, x2: x, y2: y}));
      } else if (d.type === 'square') {
        const size = Math.max(Math.abs(x - d.startX), Math.abs(y - d.startY)) || 1;
        const nx = x < d.startX ? d.startX - size : d.startX;
        const ny = y < d.startY ? d.startY - size : d.startY;
        updateLast((last) => ({...last, x: nx, y: ny, width: size, height: size}));
      } else if (d.type === 'circle') {
        const r = Math.max(Math.abs(x - d.startX), Math.abs(y - d.startY)) || 1;
        updateLast((last) => ({...last, rx: r, ry: r}));
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
        updateLast((last) => ({...last, points}));
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
        updateLast((last) => ({...last, points}));
      }
    }
  }

  function onPointerUp() {
    setActiveSnapGuides([]);

    if (marqueeRef.current && marqueeRect && setSelectedLayerIds) {
      const {x, y, w, h} = marqueeRect;
      const selectedIds = new Set();

      for (const o of objects) {
        if (o.visible === false || o.locked) continue;
        const bbox = getBBox(o);
        const intersects = !(
          bbox.x + bbox.w < x ||
          bbox.x > x + w ||
          bbox.y + bbox.h < y ||
          bbox.y > y + h
        );
        if (intersects) {
          selectedIds.add(o.id);
        }
      }

      if (selectedIds.size > 0) {
        setSelectedLayerIds(selectedIds);
      }

      marqueeRef.current = null;
      setMarqueeRect(null);
      return;
    }

    if (drawingRef.current) {
      setSelectedId(drawingRef.current.id);
      if (drawingRef.current.type !== 'path') setTool('select');
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
    <div className="relative w-full h-full" style={{paddingLeft: '28px', paddingBottom: '28px'}}>
      <div className="absolute left-0 top-0 w-7 pointer-events-none" style={{bottom: '28px'}}>
        <svg width="100%" height="100%" viewBox={`0 0 28 ${height}`} preserveAspectRatio="none"
             className="overflow-visible">
          <rect x="0" y="0" width="28" height={height} fill="#18181b"/>
          {Array.from({length: Math.floor(canvasMm / 5) + 1}, (_, i) => {
            const mm = i * 5;
            const y = height - (mm * pxPerMm);
            const isMajor = mm % 10 === 0;
            return (
              <g key={mm}>
                <line x1={isMajor ? 12 : 18} y1={y} x2={28} y2={y} stroke={isMajor ? "#a1a1aa" : "#52525b"}
                      strokeWidth={isMajor ? 1.5 : 1}/>
                {isMajor && (
                  <text x={10} y={y + 3} textAnchor="end" fill="#d4d4d8" fontSize="9" fontFamily="monospace"
                        fontWeight="500">
                    {mm}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="absolute bottom-0 h-7 pointer-events-none" style={{left: '28px', right: 0}}>
        <svg width="100%" height="100%" viewBox={`0 0 ${width} 28`} preserveAspectRatio="none"
             className="overflow-visible">
          <rect x="0" y="0" width={width} height="28" fill="#18181b"/>
          {Array.from({length: Math.floor(canvasMm / 5) + 1}, (_, i) => {
            const mm = i * 5;
            const x = mm * pxPerMm;
            const isMajor = mm % 10 === 0;
            return (
              <g key={mm}>
                <line x1={x} y1={0} x2={x} y2={isMajor ? 16 : 10} stroke={isMajor ? "#a1a1aa" : "#52525b"}
                      strokeWidth={isMajor ? 1.5 : 1}/>
                {isMajor && (
                  <text x={x} y={24} textAnchor="middle" fill="#d4d4d8" fontSize="9" fontFamily="monospace"
                        fontWeight="500">
                    {mm}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div
        className="absolute left-0 bottom-0 w-7 h-7 bg-zinc-900 flex items-center justify-center pointer-events-none">
        <span className="text-[8px] font-mono text-zinc-500">mm</span>
      </div>
      <svg
        ref={svgRef}
        data-testid="design-canvas"
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full bg-checker border border-zinc-800 cursor-crosshair touch-none select-none"
        style={{display: 'block'}}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
      >
        {bgImageUrl && (
          <image href={bgImageUrl} x="0" y="0" width={width} height={height} preserveAspectRatio="xMidYMid meet"
                 opacity={bgOpacity}/>
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
          <ShapeNode key={o.id} o={o} onSelect={() => tool === 'select' && setSelectedId(o.id)}
                     wireframeMode={wireframeMode}/>
        ))}
        {selected && selectedBox && (
          <g key="selection-overlay">
            <rect
              key="selection-bbox"
              x={selectedBox.x} y={selectedBox.y} width={selectedBox.w} height={selectedBox.h}
              fill="none" stroke={selected.sizeLocked ? "#EF4444" : "#F59E0B"} strokeWidth="1" strokeDasharray="4 4"
              pointerEvents="none"
            />
            {!selected.locked && !selected.sizeLocked && HANDLE_KEYS.map((h) => {
              const pos = handlePos(h, selectedBox);
              return (
                <rect
                  key={h}
                  data-handle={h}
                  data-testid={`handle-${h}`}
                  x={pos.x - 5} y={pos.y - 5} width="10" height="10"
                  fill="#F59E0B" stroke="#000" strokeWidth="1"
                  style={{cursor: handleCursor(h)}}
                />
              );
            })}

            {selected.sizeLocked && (
              <g transform={`translate(${selectedBox.x + selectedBox.w / 2}, ${selectedBox.y - 15})`}>
                <rect x="-20" y="-8" width="40" height="16" fill="#EF4444" rx="2"/>
                <text x="0" y="4" textAnchor="middle" fill="white" fontSize="9" fontFamily="monospace">LOCKED</text>
              </g>
            )}
          </g>
        )}

        {marqueeRect && (
          <rect
            x={marqueeRect.x}
            y={marqueeRect.y}
            width={marqueeRect.w}
            height={marqueeRect.h}
            fill="rgba(59, 130, 246, 0.1)"
            stroke="#3B82F6"
            strokeWidth="1"
            strokeDasharray="4 4"
            pointerEvents="none"
          />
        )}

        {showSnapGuides && activeSnapGuides.length > 0 && (
          <g data-testid="snap-guides" pointerEvents="none">
            {activeSnapGuides.map((guide, index) => {
              if (guide.type === 'vertical') {
                return (
                  <g key={`guide-v-${index}`}>
                    <line
                      x1={guide.x}
                      y1={0}
                      x2={guide.x}
                      y2={height}
                      stroke="#10B981"
                      strokeWidth="1"
                      strokeDasharray="6 4"
                      opacity="0.8"
                    />
                    {guide.label && (
                      <g transform={`translate(${guide.x + 5}, 20)`}>
                        <rect x="-2" y="-10" width="50" height="14" fill="rgba(16, 185, 129, 0.9)" rx="2"/>
                        <text x="2" y="0" fill="white" fontSize="9" fontFamily="monospace">{guide.label}</text>
                      </g>
                    )}
                  </g>
                );
              }
              if (guide.type === 'horizontal') {
                return (
                  <g key={`guide-h-${index}`}>
                    <line
                      x1={0}
                      y1={guide.y}
                      x2={width}
                      y2={guide.y}
                      stroke="#10B981"
                      strokeWidth="1"
                      strokeDasharray="6 4"
                      opacity="0.8"
                    />
                    {guide.label && (
                      <g transform={`translate(20, ${guide.y - 5})`}>
                        <rect x="-2" y="-10" width="50" height="14" fill="rgba(16, 185, 129, 0.9)" rx="2"/>
                        <text x="2" y="0" fill="white" fontSize="9" fontFamily="monospace">{guide.label}</text>
                      </g>
                    )}
                  </g>
                );
              }
              if (guide.type === 'circle') {
                return (
                  <g key={`guide-c-${index}`}>
                    <circle
                      cx={guide.cx}
                      cy={guide.cy}
                      r={guide.r}
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="2"
                      strokeDasharray="8 4"
                      opacity="0.8"
                    />
                    {guide.label && (
                      <g transform={`translate(${guide.cx + guide.r + 5}, ${guide.cy})`}>
                        <rect x="-2" y="-10" width="40" height="14" fill="rgba(16, 185, 129, 0.9)" rx="2"/>
                        <text x="2" y="0" fill="white" fontSize="9" fontFamily="monospace">{guide.label}</text>
                      </g>
                    )}
                  </g>
                );
              }
              return null;
            })}
          </g>
        )}

        {dimensionLines.map((dim) => (
          <DimensionLine
            key={dim.id}
            dimension={dim}
            onUpdate={(updates) => {
              setDimensionLines?.(prev => prev.map(d => d.id === dim.id ? {...d, ...updates} : d));
            }}
            color={dim.color || dimensionColor}
            pxPerMm={pxPerMm}
          />
        ))}
      </svg>
    </div>
  );
}

function ShapeNode({o, wireframeMode = false}) {
  const wireframeFill = 'none';
  const wireframeStroke = '#3B82F6';
  const wireframeStrokeWidth = 1;

  const getFill = () => wireframeMode ? wireframeFill : (o.fill || 'none');
  const getStroke = () => wireframeMode ? wireframeStroke : (o.stroke || 'none');
  const getStrokeWidth = () => wireframeMode ? wireframeStrokeWidth : (o.strokeWidth || 0);
  const getOpacity = () => wireframeMode ? 1 : (o.opacity ?? 1);

  switch (o.type) {
    case 'rect':
      return <rect x={o.x} y={o.y} width={o.width} height={o.height} fill={getFill()} stroke={getStroke()}
                   strokeWidth={getStrokeWidth()} opacity={getOpacity()}/>;
    case 'ellipse':
      return <ellipse cx={o.cx} cy={o.cy} rx={o.rx} ry={o.ry} fill={getFill()} stroke={getStroke()}
                      strokeWidth={getStrokeWidth()} opacity={getOpacity()}/>;
    case 'line':
      return <line x1={o.x1} y1={o.y1} x2={o.x2} y2={o.y2}
                   stroke={wireframeMode ? wireframeStroke : (o.stroke || '#000')}
                   strokeWidth={wireframeMode ? wireframeStrokeWidth : (o.strokeWidth || 1)} opacity={getOpacity()}/>;
    case 'polygon':
      return <polygon points={(o.points || []).map(([x, y]) => `${x},${y}`).join(' ')} fill={getFill()}
                      stroke={getStroke()} strokeWidth={getStrokeWidth()} opacity={getOpacity()}/>;
    case 'path': {
      const d = o.d || (o.points || []).map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
      return <path d={d} fill={getFill()} stroke={wireframeMode ? wireframeStroke : (o.stroke || '#000')}
                   strokeWidth={wireframeMode ? wireframeStrokeWidth : (o.strokeWidth || 2)} strokeLinecap="round"
                   strokeLinejoin="round" opacity={getOpacity()} key={d}/>;
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
        return <rect x={o.x} y={o.y} width={o.width} height={o.height} fill="none" stroke={wireframeStroke}
                     strokeWidth={wireframeStrokeWidth} strokeDasharray="4 2" opacity={0.5}/>;
      }
      return <image x={o.x} y={o.y} width={o.width} height={o.height} href={o.href} opacity={o.opacity ?? 1}/>;
    case 'rectset': {
      const d = (o.cells || []).map(([x, y, w, h]) => `M${x},${y} h${w} v${h} h${-w} z`).join(' ');
      return <path d={d} fill={getFill()} stroke={getStroke()} strokeWidth={getStrokeWidth()} opacity={getOpacity()}/>;
    }
    case 'svgpath':
      return <path key={o.d} d={o.d || ''} fill={getFill()} stroke={getStroke()} strokeWidth={getStrokeWidth()}
                   fillRule={o.fillRule || 'nonzero'} opacity={getOpacity()}/>;
    default:
      return null;
  }
}

function handlePos(handle, b) {
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  switch (handle) {
    case 'nw':
      return {x: b.x, y: b.y};
    case 'n':
      return {x: cx, y: b.y};
    case 'ne':
      return {x: b.x + b.w, y: b.y};
    case 'e':
      return {x: b.x + b.w, y: cy};
    case 'se':
      return {x: b.x + b.w, y: b.y + b.h};
    case 's':
      return {x: cx, y: b.y + b.h};
    case 'sw':
      return {x: b.x, y: b.y + b.h};
    case 'w':
      return {x: b.x, y: cy};
    default:
      return {x: cx, y: cy};
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
  let {x, y, w, h} = oldBox;
  let nx = x, ny = y, nw = w, nh = h;
  if (handle.includes('w')) {
    nx = Math.min(mx, x + w - 1);
    nw = (x + w) - nx;
  }
  if (handle.includes('e')) {
    nw = Math.max(1, mx - x);
  }
  if (handle.includes('n')) {
    ny = Math.min(my, y + h - 1);
    nh = (y + h) - ny;
  }
  if (handle.includes('s')) {
    nh = Math.max(1, my - y);
  }
  return {x: nx, y: ny, w: Math.max(1, nw), h: Math.max(1, nh)};
}

function DimensionLine({dimension, onUpdate, color, pxPerMm}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const lineRef = useRef(null);

  const {x1, y1, x2, y2, angle = 0, length = 50} = dimension;

  const centerX = x1 || 320;
  const centerY = y1 || 320;
  const halfLength = (length * pxPerMm) / 2;
  const angleRad = (angle * Math.PI) / 180;

  const startX = centerX - halfLength * Math.cos(angleRad);
  const startY = centerY - halfLength * Math.sin(angleRad);
  const endX = centerX + halfLength * Math.cos(angleRad);
  const endY = centerY + halfLength * Math.sin(angleRad);

  const arrowSize = 8;

  const arrowAngle1 = angleRad + Math.PI + Math.PI / 6;
  const arrowAngle2 = angleRad + Math.PI - Math.PI / 6;
  const arrowAngle3 = angleRad + Math.PI / 6;
  const arrowAngle4 = angleRad - Math.PI / 6;

  const arrow1 = `${startX + arrowSize * Math.cos(arrowAngle1)},${startY + arrowSize * Math.sin(arrowAngle1)}`;
  const arrow2 = `${startX + arrowSize * Math.cos(arrowAngle2)},${startY + arrowSize * Math.sin(arrowAngle2)}`;
  const arrow3 = `${endX + arrowSize * Math.cos(arrowAngle3)},${endY + arrowSize * Math.sin(arrowAngle3)}`;
  const arrow4 = `${endX + arrowSize * Math.cos(arrowAngle4)},${endY + arrowSize * Math.sin(arrowAngle4)}`;

  const handleMouseDown = (e) => {
    e.stopPropagation();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const svg = lineRef.current?.closest('svg');
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const svgWidth = svg.viewBox.baseVal.width || 640;
      const svgHeight = svg.viewBox.baseVal.height || 640;

      const mouseX = ((e.clientX - rect.left) / rect.width) * svgWidth;
      const mouseY = ((e.clientY - rect.top) / rect.height) * svgHeight;

      const dx = mouseX - centerX;
      const dy = mouseY - centerY;
      let newAngle = (Math.atan2(dy, dx) * 180) / Math.PI;

      if (e.shiftKey) {
        newAngle = Math.round(newAngle / 15) * 15;
      }

      onUpdate?.({angle: Math.round(newAngle)});
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, centerX, centerY, onUpdate]);

  return (
    <g
      ref={lineRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{cursor: isDragging ? 'grabbing' : 'grab'}}
    >
      <line
        x1={startX}
        y1={startY}
        x2={endX}
        y2={endY}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />

      <polygon
        points={`${startX},${startY} ${arrow1} ${arrow2}`}
        fill={color}
      />
      <polygon
        points={`${endX},${endY} ${arrow3} ${arrow4}`}
        fill={color}
      />

      <circle
        cx={endX}
        cy={endY}
        r={isDragging || isHovered ? 10 : 6}
        fill={isDragging ? color : 'transparent'}
        stroke={color}
        strokeWidth={2}
        onMouseDown={handleMouseDown}
        style={{cursor: 'grab'}}
      />

      <circle
        cx={centerX}
        cy={centerY}
        r={isDragging || isHovered ? 8 : 5}
        fill={isHovered || isDragging ? color : 'white'}
        stroke={color}
        strokeWidth={2}
        onMouseDown={(e) => {
          e.stopPropagation();

        }}
        style={{cursor: 'move'}}
      />

      {(isHovered || isDragging) && (
        <g>
          <rect
            x={centerX - 20}
            y={centerY - 30}
            width={40}
            height={18}
            rx={3}
            fill="rgba(0,0,0,0.8)"
          />
          <text
            x={centerX}
            y={centerY - 17}
            textAnchor="middle"
            fill="white"
            fontSize="11"
            fontFamily="monospace"
          >
            {angle}°
          </text>
        </g>
      )}

      <text
        x={centerX + 15 * Math.cos(angleRad - Math.PI / 2)}
        y={centerY + 15 * Math.sin(angleRad - Math.PI / 2)}
        textAnchor="middle"
        fill={color}
        fontSize="10"
        fontFamily="monospace"
        fontWeight="bold"
      >
        {length}mm
      </text>
    </g>
  );
}
