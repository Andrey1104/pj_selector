import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import {
  MousePointer2, Pencil, Square, Circle, Minus, Hexagon, Type,
  Image as ImageIcon, Trash2, Save, Download, FileImage,
  RotateCcw, Eye, EyeOff, Lock, Unlock, ArrowUp, ArrowDown,
  Wand2, Octagon, Triangle, RectangleHorizontal
} from 'lucide-react';
import { designsApi } from '@/lib/api';
import {
  buildSvg, buildSvgsByColor, downloadText, traceBitmap, parseSvgString, 
  getBBox, newId, traceBitmapAdvanced, centerObjectsOnCanvas,
  CANVAS_MM, CANVAS_W, CANVAS_H, PX_PER_MM, DEFAULT_COLORS, TOOLS,
} from '@/lib/editor-utils';
import CanvasSVG from '@/components/editor/CanvasSVG';
import { 
  ToolButton, ToolbarButton, Panel, ColorRow, SliderRow, SmallBtn, IconButton 
} from '@/components/editor/EditorUI';
import { ScaleControl } from '@/components/editor/ScaleControl';
import { AdvancedToolbar } from '@/components/editor/AdvancedToolbar';
import { scaleObjectFromCenter } from '@/lib/editor/transforms';
import { parsePath, serializePath } from '@/lib/editor/path-operations';

const EllipseIcon = (props) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <ellipse cx="12" cy="12" rx="10" ry="7" />
  </svg>
);

const TOOL_ICONS = {
  select: MousePointer2,
  brush: Pencil,
  rect: RectangleHorizontal,
  square: Square,
  ellipse: EllipseIcon,
  circle: Circle,
  line: Minus,
  polygon: Hexagon,
  triangle: Triangle,
  octagon: Octagon,
  text: Type,
};

function slug(str) {
  return (str || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function Editor() {
  const { designId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [tool, setTool] = useState('select');
  const [objects, setObjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [fill, setFill] = useState('#F59E0B');
  const [stroke, setStroke] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [opacity, setOpacity] = useState(1);
  const [palette, setPalette] = useState(DEFAULT_COLORS);
  const [bgImageUrl, setBgImageUrl] = useState(null);
  const [bgOpacity, setBgOpacity] = useState(0.4);
  const [name, setName] = useState('Untitled design');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [imageMode, setImageMode] = useState(null);
  const [glassSize, setGlassSize] = useState('small');
  const [selectedLayerIds, setSelectedLayerIds] = useState(new Set());
  const [layerScale, setLayerScale] = useState(100);
  const [originalObjectsForScale, setOriginalObjectsForScale] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [gridSize, setGridSize] = useState(10);
  const [zoom, setZoom] = useState(100);
  const [clipboard, setClipboard] = useState(null);
  const [history, setHistory] = useState({ past: [], future: [] });
  const objectsRef = useRef(objects);
  
  useEffect(() => {
    objectsRef.current = objects;
  }, [objects]);

  const pushHistory = useCallback(() => {
    setHistory((h) => ({
      past: [...h.past, JSON.stringify(objectsRef.current)].slice(-50),
      future: []
    }));
  }, []);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.past.length === 0) return h;
      const prev = h.past[h.past.length - 1];
      const future = [JSON.stringify(objectsRef.current), ...h.future];
      setObjects(JSON.parse(prev));
      return { past: h.past.slice(0, -1), future };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((h) => {
      if (h.future.length === 0) return h;
      const next = h.future[0];
      const past = [...h.past, JSON.stringify(objectsRef.current)];
      setObjects(JSON.parse(next));
      return { past, future: h.future.slice(1) };
    });
  }, []);

  useEffect(() => {
    if (!designId) return;
    designsApi.get(designId).then((d) => {
      setName(d.name || 'Untitled design');
      setDescription(d.description || '');
      setObjects(d.canvas_data?.objects || []);
      setPalette(d.canvas_data?.palette || DEFAULT_COLORS);
      setBgImageUrl(d.canvas_data?.bgImage || null);
    }).catch(() => toast.error('Failed to load design'));
  }, [designId]);

  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      
      const t = TOOLS.find((x) => x.key === e.key.toLowerCase());
      if (t) {
        setTool(t.id);
        return;
      }
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) deleteSelected();
        return;
      }
      
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        redo();
        return;
      }
      
      if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        e.preventDefault();
        copySelected();
        return;
      }
      
      if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
        e.preventDefault();
        pasteClipboard();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        centerOnCanvas();
        return;
      }
      
      if (e.key === 'Escape') {
        setSelectedId(null);
        setSelectedLayerIds(new Set());
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, undo, redo]);

  const selected = selectedId ? objects.find((o) => o.id === selectedId) : null;
  const largestLayerInfo = useMemo(() => {
    if (objects.length === 0) return null;
    let largest = null;
    let maxArea = 0;
    for (const o of objects) {
      const bbox = getBBox(o);
      const area = bbox.w * bbox.h;
      if (area > maxArea) {
        maxArea = area;
        largest = { obj: o, bbox };
      }
    }
    if (!largest) return null;
    const sizePx = Math.max(largest.bbox.w, largest.bbox.h);
    const sizeMm = sizePx / PX_PER_MM;
    return { id: largest.obj.id, sizeMm, bbox: largest.bbox };
  }, [objects]);

  const getTargetIds = useCallback(() => {
    return selectedLayerIds.size > 0 ? [...selectedLayerIds] : (selectedId ? [selectedId] : []);
  }, [selectedLayerIds, selectedId]);

  function translateObject(o, dx, dy) {
    switch (o.type) {
      case 'rect':
      case 'image':
        return { ...o, x: o.x + dx, y: o.y + dy };
      case 'ellipse':
      case 'circle':
        return { ...o, cx: o.cx + dx, cy: o.cy + dy };
      case 'line':
        return { ...o, x1: o.x1 + dx, y1: o.y1 + dy, x2: o.x2 + dx, y2: o.y2 + dy };
      case 'polygon':
      case 'path':
        return { ...o, points: (o.points || []).map(([x, y]) => [x + dx, y + dy]) };
      case 'text':
        return { ...o, x: o.x + dx, y: o.y + dy };
      case 'svgpath':
        if (!o.d) return o;
        const parsed = parsePath(o.d);
        const translated = parsed.map(cmd => {
          const newCmd = { ...cmd };
          if (newCmd.x !== undefined) newCmd.x += dx;
          if (newCmd.y !== undefined) newCmd.y += dy;
          if (newCmd.x1 !== undefined) newCmd.x1 += dx;
          if (newCmd.y1 !== undefined) newCmd.y1 += dy;
          if (newCmd.x2 !== undefined) newCmd.x2 += dx;
          if (newCmd.y2 !== undefined) newCmd.y2 += dy;
          return newCmd;
        });
        return { ...o, d: serializePath(translated) };
      default:
        return o;
    }
  }

  function updateSelected(patch) {
    setObjects((prev) => prev.map((o) => (o.id === selectedId ? { ...o, ...patch } : o)));
  }

  function deleteSelected() {
    if (!selectedId) return;
    pushHistory();
    setObjects((prev) => prev.filter((o) => o.id !== selectedId));
    setSelectedId(null);
  }

  function bringForward() {
    if (!selectedId) return;
    pushHistory();
    setObjects((prev) => {
      const idx = prev.findIndex((o) => o.id === selectedId);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const next = prev.slice();
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }

  function sendBackward() {
    if (!selectedId) return;
    pushHistory();
    setObjects((prev) => {
      const idx = prev.findIndex((o) => o.id === selectedId);
      if (idx <= 0) return prev;
      const next = prev.slice();
      [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
      return next;
    });
  }

  function clearAll() {
    if (!window.confirm('Clear the entire canvas?')) return;
    pushHistory();
    setObjects([]);
    setSelectedId(null);
    setSelectedLayerIds(new Set());
  }

  function alignObjects(alignment) {
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
        case 'left': dx = minX - bbox.x; break;
        case 'centerH': dx = (minX + maxX) / 2 - (bbox.x + bbox.w / 2); break;
        case 'right': dx = maxX - (bbox.x + bbox.w); break;
        case 'top': dy = minY - bbox.y; break;
        case 'centerV': dy = (minY + maxY) / 2 - (bbox.y + bbox.h / 2); break;
        case 'bottom': dy = maxY - (bbox.y + bbox.h); break;
      }

      return translateObject(o, dx, dy);
    }));
  }

  function flipObjects(direction) {
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
      const bbox = getBBox(o);
      const objCenterX = bbox.x + bbox.w / 2;
      const objCenterY = bbox.y + bbox.h / 2;

      if (direction === 'horizontal') {
        const newCenterX = centerX + (centerX - objCenterX);
        return translateObject(o, newCenterX - objCenterX, 0);
      } else {
        const newCenterY = centerY + (centerY - objCenterY);
        return translateObject(o, 0, newCenterY - objCenterY);
      }
    }));
  }

  function rotateObjects(degrees) {
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

    const rotatePoint = (x, y) => {
      const dx = x - centerX;
      const dy = y - centerY;
      return [centerX + dx * cos - dy * sin, centerY + dx * sin + dy * cos];
    };

    setObjects(prev => prev.map(o => {
      if (!ids.includes(o.id)) return o;
      
      switch (o.type) {
        case 'rect':
        case 'image': {
          const [nx, ny] = rotatePoint(o.x + o.width / 2, o.y + o.height / 2);
          return { ...o, x: nx - o.width / 2, y: ny - o.height / 2 };
        }
        case 'ellipse':
        case 'circle': {
          const [nx, ny] = rotatePoint(o.cx, o.cy);
          return { ...o, cx: nx, cy: ny };
        }
        case 'line': {
          const [nx1, ny1] = rotatePoint(o.x1, o.y1);
          const [nx2, ny2] = rotatePoint(o.x2, o.y2);
          return { ...o, x1: nx1, y1: ny1, x2: nx2, y2: ny2 };
        }
        case 'polygon':
        case 'path':
          return { ...o, points: (o.points || []).map(([x, y]) => rotatePoint(x, y)) };
        case 'text': {
          const [nx, ny] = rotatePoint(o.x, o.y);
          return { ...o, x: nx, y: ny };
        }
        default:
          return o;
      }
    }));
  }

  function centerOnCanvas() {
    const ids = getTargetIds();
    if (ids.length === 0) {
      toast.error('Select a layer to center');
      return;
    }
    pushHistory();

    const selectedObjs = objects.filter(o => ids.includes(o.id));
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const o of selectedObjs) {
      const bbox = getBBox(o);
      minX = Math.min(minX, bbox.x);
      minY = Math.min(minY, bbox.y);
      maxX = Math.max(maxX, bbox.x + bbox.w);
      maxY = Math.max(maxY, bbox.y + bbox.h);
    }
    
    const contentW = maxX - minX;
    const contentH = maxY - minY;
    const offsetX = (CANVAS_W - contentW) / 2 - minX;
    const offsetY = (CANVAS_H - contentH) / 2 - minY;

    setObjects(prev => prev.map(o => {
      if (!ids.includes(o.id)) return o;
      return translateObject(o, offsetX, offsetY);
    }));
    
    toast.success(`Centered ${ids.length} layer(s)`);
  }

  function copySelected() {
    const ids = getTargetIds();
    if (ids.length === 0) return;
    const objsToCopy = objects.filter(o => ids.includes(o.id));
    setClipboard(JSON.parse(JSON.stringify(objsToCopy)));
    toast.success(`Copied ${objsToCopy.length} object(s)`);
  }

  function pasteClipboard() {
    if (!clipboard || clipboard.length === 0) return;
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
    toast.success(`Pasted ${newObjs.length} object(s)`);
  }

  function toggleLayerSelection(id) {
    setSelectedLayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllLayers() {
    setSelectedLayerIds(new Set(objects.map((o) => o.id)));
  }

  function deselectAllLayers() {
    setSelectedLayerIds(new Set());
  }

  function deleteSelectedLayers() {
    if (selectedLayerIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedLayerIds.size} selected layer(s)?`)) return;
    pushHistory();
    setObjects((prev) => prev.filter((o) => !selectedLayerIds.has(o.id)));
    setSelectedLayerIds(new Set());
    setSelectedId(null);
  }

  function toggleVisibilitySelectedLayers() {
    if (selectedLayerIds.size === 0) return;
    pushHistory();
    setObjects((prev) =>
      prev.map((o) =>
        selectedLayerIds.has(o.id) ? { ...o, visible: !(o.visible !== false) } : o
      )
    );
  }

  function toggleLockSelectedLayers() {
    if (selectedLayerIds.size === 0) return;
    pushHistory();
    setObjects((prev) =>
      prev.map((o) =>
        selectedLayerIds.has(o.id) ? { ...o, locked: !o.locked } : o
      )
    );
  }

  function scaleToTargetMm(targetMm) {
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
    const scaled = objects.map(o => scaleObjectFromCenter(o, scale, centerX, centerY));
    setObjects(scaled);
  }

  function onUploadImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const isSvg = /\.svg$/i.test(file.name) || file.type === 'image/svg+xml';

    const handle = async (dataUrl, svgText) => {
      const choice = imageMode || (window.prompt('Use image as: 1=Reference, 2=Layer, 3=Trace to vector', '1') || '1');
      if (choice === '1' || choice === 'reference') {
        setBgImageUrl(dataUrl);
      } else if (choice === '2' || choice === 'layer') {
        if (isSvg && svgText) {
          try {
            const shapes = parseSvgString(svgText, CANVAS_W, CANVAS_H);
            if (shapes.length === 0) throw new Error('Empty SVG');
            pushHistory();
            setObjects((p) => [...p, ...shapes]);
            toast.success(`Imported ${shapes.length} shape(s) from SVG`);
            setImageMode(null);
            return;
          } catch (err) {}
        }
        pushHistory();
        const img = new window.Image();
        img.onload = () => {
          const maxSize = CANVAS_W * 0.8;
          let imgW = img.width;
          let imgH = img.height;
          if (imgW > maxSize || imgH > maxSize) {
            const scale = Math.min(maxSize / imgW, maxSize / imgH);
            imgW = imgW * scale;
            imgH = imgH * scale;
          }
          const x = (CANVAS_W - imgW) / 2;
          const y = (CANVAS_H - imgH) / 2;
          const obj = {
            type: 'image', id: newId(), name: file.name,
            x, y, width: imgW, height: imgH, href: dataUrl,
            opacity: 1, visible: true, locked: false
          };
          setObjects((p) => [...p, obj]);
          setSelectedId(obj.id);
        };
        img.onerror = () => {
          const obj = {
            type: 'image', id: newId(), name: file.name,
            x: (CANVAS_W - 400) / 2, y: (CANVAS_H - 400) / 2,
            width: 400, height: 400, href: dataUrl,
            opacity: 1, visible: true, locked: false
          };
          setObjects((p) => [...p, obj]);
          setSelectedId(obj.id);
        };
        img.src = dataUrl;
      } else if (choice === '3' || choice === 'trace') {
        if (isSvg && svgText) {
          try {
            const shapes = parseSvgString(svgText, CANVAS_W, CANVAS_H);
            if (shapes.length === 0) throw new Error('Empty SVG');
            pushHistory();
            setObjects((p) => [...p, ...shapes]);
            toast.success(`Imported ${shapes.length} shape(s) from SVG`);
            setImageMode(null);
            return;
          } catch (err) {
            toast.error('SVG parse failed; falling back to bitmap trace');
          }
        }
        toast.info('Tracing image (high quality)...');
        try {
          const traced = await traceBitmapAdvanced(dataUrl, CANVAS_W, CANVAS_H, {
            maxColors: 24, simplify: 0.1
          });
          if (traced.length === 0) throw new Error('No colors detected');
          pushHistory();
          setObjects((p) => [...p, ...traced]);
          toast.success(`Traced into ${traced.length} color layer(s)`);
        } catch (err) {
          toast.error('Trace failed: ' + (err.message || ''));
        }
      }
      setImageMode(null);
    };

    const reader1 = new FileReader();
    reader1.onload = () => {
      const dataUrl = String(reader1.result);
      if (isSvg) {
        const reader2 = new FileReader();
        reader2.onload = () => handle(dataUrl, String(reader2.result));
        reader2.readAsText(file);
      } else {
        handle(dataUrl, null);
      }
    };
    reader1.readAsDataURL(file);
    e.target.value = '';
  }

  function exportPDF() {
    const svgString = buildSvg(objects, CANVAS_W, CANVAS_H);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement('canvas');
      cv.width = CANVAS_W;
      cv.height = CANVAS_H;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H);
      URL.revokeObjectURL(url);
      const dataUrl = cv.toDataURL('image/png');
      const pdf = new jsPDF({ unit: 'pt', format: [CANVAS_W, CANVAS_H], orientation: 'portrait' });
      pdf.addImage(dataUrl, 'PNG', 0, 0, CANVAS_W, CANVAS_H);
      pdf.save(`${slug(name)}.pdf`);
      toast.success('PDF exported');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      toast.error('PDF render failed');
    };
    img.src = url;
  }

  function exportSVG() {
    const drawableObjs = objects.filter((o) => o.visible !== false && o.type !== 'image');
    if (drawableObjs.length === 0) {
      toast.error('Canvas is empty');
      return;
    }
    const perColor = buildSvgsByColor(drawableObjs, CANVAS_W, CANVAS_H);
    perColor.forEach((p) => downloadText(p.svg, `${slug(name)}__${p.filename}`, 'image/svg+xml'));
    downloadText(buildSvg(drawableObjs, CANVAS_W, CANVAS_H), `${slug(name)}__combined.svg`, 'image/svg+xml');
    toast.success(`Exported ${perColor.length} color file(s) + combined`);
  }

  async function saveDesign() {
    setSaving(true);
    try {
      const thumbnail = await buildThumbnail(objects);
      const colorsUsed = Array.from(new Set(objects.flatMap((o) => [o.fill, o.stroke]).filter((c) => c && c !== 'none')));
      const payload = {
        name, description,
        canvas_data: { objects, palette, bgImage: bgImageUrl },
        thumbnail, width: CANVAS_W, height: CANVAS_H, colors: colorsUsed,
      };
      if (designId) {
        await designsApi.update(designId, payload);
        toast.success('Design updated');
      } else {
        const created = await designsApi.create(payload);
        toast.success('Design saved');
        navigate(`/editor/${created.id}`, { replace: true });
      }
    } catch (e) {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  }

  const hasSelection = selectedLayerIds.size > 0 || !!selectedId;
  const selectedCount = selectedLayerIds.size > 0 ? selectedLayerIds.size : (selectedId ? 1 : 0);

  return (
    <div className="flex-1 flex flex-col bg-[#09090B] min-h-0" data-testid="editor-page">
      <div className="border-b border-zinc-900 px-4 py-3 flex flex-wrap items-center gap-3">
        <input
          type="text" value={name} onChange={(e) => setName(e.target.value)}
          data-testid="editor-name-input"
          className="bg-transparent border border-zinc-800 px-3 py-2 text-sm font-mono text-white focus:border-amber-500 focus:outline-none w-64"
          placeholder="Design name"
        />
        <input
          type="text" value={description} onChange={(e) => setDescription(e.target.value)}
          data-testid="editor-desc-input"
          className="bg-transparent border border-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:border-amber-500 focus:outline-none flex-1 min-w-[200px]"
          placeholder="Description (optional)"
        />
        <ToolbarButton onClick={undo} testId="editor-undo" label="Undo" icon={RotateCcw} />
        <ToolbarButton onClick={redo} testId="editor-redo" label="Redo" />
        <ToolbarButton onClick={clearAll} testId="editor-clear" label="Clear" icon={Trash2} danger />
        <div className="ml-auto flex gap-2">
          <button onClick={saveDesign} disabled={saving} data-testid="editor-save"
            className="px-4 py-2 border border-amber-500 bg-amber-500/10 hover:bg-amber-500 hover:text-black text-amber-500 transition-colors text-xs font-mono uppercase tracking-widest disabled:opacity-50">
            <Save className="w-4 h-4 inline -mt-1 mr-1" /> {saving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={exportPDF} data-testid="editor-export-pdf"
            className="px-4 py-2 bg-amber-500 text-black hover:bg-amber-400 text-xs font-mono uppercase tracking-widest">
            <FileImage className="w-4 h-4 inline -mt-1 mr-1" /> PDF
          </button>
          <button onClick={exportSVG} data-testid="editor-export-svg"
            className="px-4 py-2 bg-white text-black hover:bg-zinc-200 text-xs font-mono uppercase tracking-widest">
            <Download className="w-4 h-4 inline -mt-1 mr-1" /> SVG by color
          </button>
        </div>
      </div>
      <AdvancedToolbar
        hasSelection={hasSelection}
        selectedCount={selectedCount}
        onAlignLeft={() => alignObjects('left')}
        onAlignCenterH={() => alignObjects('centerH')}
        onAlignRight={() => alignObjects('right')}
        onAlignTop={() => alignObjects('top')}
        onAlignCenterV={() => alignObjects('centerV')}
        onAlignBottom={() => alignObjects('bottom')}
        onFlipHorizontal={() => flipObjects('horizontal')}
        onFlipVertical={() => flipObjects('vertical')}
        onRotateCW={(deg) => rotateObjects(deg)}
        onRotateCCW={(deg) => rotateObjects(deg)}
        onCenterOnCanvas={centerOnCanvas}
        onBringForward={bringForward}
        onSendBackward={sendBackward}
        onCopy={copySelected}
        onPaste={pasteClipboard}
        onDelete={deleteSelected}
        onToggleVisibility={toggleVisibilitySelectedLayers}
        onToggleLock={toggleLockSelectedLayers}
        showGrid={showGrid}
        setShowGrid={setShowGrid}
        snapToGrid={snapToGrid}
        setSnapToGrid={setSnapToGrid}
        gridSize={gridSize}
        setGridSize={setGridSize}
        zoom={zoom}
        setZoom={setZoom}
        selectedObject={selected}
        onUpdateSelected={updateSelected}
      />

      <div className="flex flex-1 min-h-0">
        <aside className="w-14 border-r border-zinc-900 flex flex-col items-center py-2 gap-1.5" data-testid="left-tools">
          {TOOLS.map((t) => (
            <ToolButton key={t.id} active={tool === t.id} onClick={() => setTool(t.id)} title={t.label} testId={t.testId}>
              {TOOL_ICONS[t.id] && React.createElement(TOOL_ICONS[t.id], { className: "w-5 h-5", strokeWidth: 1.5 })}
            </ToolButton>
          ))}
          <div className="w-full h-px bg-zinc-900 my-1.5" />
          <ToolButton active={false} onClick={() => { setImageMode(null); fileInputRef.current?.click(); }} title="Upload image" testId="tool-image">
            <ImageIcon className="w-5 h-5" strokeWidth={1.5} />
          </ToolButton>
          <ToolButton active={false} onClick={() => { setImageMode('trace'); fileInputRef.current?.click(); }} title="Trace bitmap" testId="tool-trace">
            <Wand2 className="w-5 h-5" strokeWidth={1.5} />
          </ToolButton>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onUploadImage} data-testid="image-file-input" />
        </aside>
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-grid-fine min-h-0 overflow-auto">
          <div className="flex items-center gap-3 mb-4" data-testid="glass-size-switch">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Glass Size:</span>
            <div className="flex bg-zinc-900 border border-zinc-800 p-0.5">
              <button
                onClick={() => setGlassSize('small')}
                data-testid="glass-size-small"
                className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-colors ${
                  glassSize === 'small' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                37/26 mm
              </button>
              <button
                onClick={() => setGlassSize('large')}
                data-testid="glass-size-large"
                className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-colors ${
                  glassSize === 'large' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                66/44 mm
              </button>
            </div>
          </div>
          <div className="relative w-full max-w-[640px]" style={{ aspectRatio: '1/1' }}>
            <div className="absolute -top-6 left-0 label-metric" data-testid="canvas-dimensions">
              {CANVAS_MM} x {CANVAS_MM} mm
            </div>
            {largestLayerInfo && (
              <div className="absolute -top-6 right-0 font-mono text-sm font-bold text-amber-500" data-testid="largest-layer-size">
                Max: {largestLayerInfo.sizeMm.toFixed(1)} mm
              </div>
            )}
            <CanvasSVG
              width={CANVAS_W} height={CANVAS_H}
              canvasMm={CANVAS_MM}
              objects={objects} setObjects={setObjects}
              selectedId={selectedId} setSelectedId={setSelectedId}
              tool={tool} setTool={setTool}
              fill={fill} stroke={stroke} strokeWidth={strokeWidth} opacity={opacity}
              bgImageUrl={bgImageUrl} bgOpacity={bgOpacity}
              onPointerCoords={(x, y) => setPointer({ x, y })}
              glassSize={glassSize}
              showGrid={showGrid}
              snapToGrid={snapToGrid}
              gridSize={gridSize}
            />
          </div>
        </div>

        <aside className="w-96 border-l border-zinc-900 flex flex-col overflow-y-auto" data-testid="right-panel">
          <Panel title="Tool defaults">
            <ColorRow label="Fill" value={fill} onChange={setFill} testId="default-fill" />
            <ColorRow label="Stroke" value={stroke} onChange={setStroke} testId="default-stroke" />
            <SliderRow label="Stroke" value={strokeWidth} onChange={setStrokeWidth} min={0} max={60} testId="default-stroke-w" />
            <SliderRow label="Opacity" value={opacity * 100} onChange={(v) => setOpacity(v / 100)} min={0} max={100} testId="default-opacity" />
          </Panel>

          <Panel title="Palette" data-testid="editor-color-palette">
            <div className="grid grid-cols-6 gap-1.5">
              {palette.map((c) => (
                <button key={c} onClick={() => setFill(c)} title={c}
                  data-testid={`palette-${c}`}
                  className={`w-8 h-8 border-2 ${fill === c ? 'border-amber-500' : 'border-zinc-800'} hover:border-amber-500/70`}
                  style={{ background: c }} />
              ))}
            </div>
          </Panel>

          {selected && (
            <Panel title={`Selected: ${selected.type}`}>
              <ColorRow label="Fill" value={selected.fill || '#000000'} onChange={(v) => updateSelected({ fill: v })} testId="sel-fill" />
              <ColorRow label="Stroke" value={selected.stroke || '#000000'} onChange={(v) => updateSelected({ stroke: v })} testId="sel-stroke" />
              <SliderRow label="Stroke W" value={selected.strokeWidth || 0} onChange={(v) => updateSelected({ strokeWidth: v })} min={0} max={60} testId="sel-stroke-w" />
              <SliderRow label="Opacity" value={(selected.opacity ?? 1) * 100} onChange={(v) => updateSelected({ opacity: v / 100 })} min={0} max={100} testId="sel-opacity" />
              {selected.type === 'text' && (
                <>
                  <input type="text" value={selected.text || ''} onChange={(e) => updateSelected({ text: e.target.value })}
                    className="mt-2 w-full bg-transparent border border-zinc-800 px-2 py-1 text-xs font-mono text-white focus:border-amber-500 focus:outline-none" />
                  <SliderRow label="Size" value={selected.fontSize || 24} onChange={(v) => updateSelected({ fontSize: v })} min={8} max={200} testId="sel-fontsize" />
                </>
              )}
              <div className="grid grid-cols-3 gap-1.5 mt-3">
                <SmallBtn onClick={bringForward} testId="bring-forward"><ArrowUp className="w-3.5 h-3.5" /> Up</SmallBtn>
                <SmallBtn onClick={sendBackward} testId="send-backward"><ArrowDown className="w-3.5 h-3.5" /> Down</SmallBtn>
                <SmallBtn onClick={deleteSelected} testId="delete-selected" danger><Trash2 className="w-3.5 h-3.5" /> Del</SmallBtn>
              </div>
            </Panel>
          )}

          <Panel title="Layers">
            {objects.length === 0 ? (
              <p className="text-xs text-zinc-500 font-mono">No layers yet</p>
            ) : (
              <>
                <div className="flex items-center gap-1 mb-2 pb-2 border-b border-zinc-800">
                  <button onClick={selectAllLayers}
                    className="px-2 py-1 text-[9px] font-mono uppercase tracking-wider text-zinc-400 hover:text-amber-500 border border-zinc-800 hover:border-amber-500"
                    title="Select all" data-testid="select-all-layers">
                    All
                  </button>
                  <button onClick={deselectAllLayers}
                    className="px-2 py-1 text-[9px] font-mono uppercase tracking-wider text-zinc-400 hover:text-amber-500 border border-zinc-800 hover:border-amber-500"
                    title="Deselect all" data-testid="deselect-all-layers">
                    None
                  </button>
                  {selectedLayerIds.size > 0 && (
                    <>
                      <div className="w-px h-4 bg-zinc-700 mx-1" />
                      <button onClick={toggleVisibilitySelectedLayers} className="p-1 text-zinc-400 hover:text-amber-500" title="Toggle visibility" data-testid="toggle-visibility-selected">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={toggleLockSelectedLayers} className="p-1 text-zinc-400 hover:text-amber-500" title="Toggle lock" data-testid="toggle-lock-selected">
                        <Lock className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={deleteSelectedLayers} className="p-1 text-zinc-400 hover:text-red-400" title="Delete selected" data-testid="delete-selected-layers">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="ml-auto text-[9px] font-mono text-zinc-500">{selectedLayerIds.size} selected</span>
                    </>
                  )}
                </div>
                <ul className="space-y-1" data-testid="layers-list">
                  {[...objects].reverse().map((o) => {
                    const bbox = getBBox(o);
                    const sizePx = Math.max(bbox.w, bbox.h);
                    const sizeMm = sizePx / PX_PER_MM;
                    const isLargest = largestLayerInfo && largestLayerInfo.id === o.id;

                    return (
                      <li key={o.id} data-testid={`layer-${o.id}`}
                        className={`flex items-center gap-1.5 border ${selectedLayerIds.has(o.id) ? 'border-blue-500 bg-blue-500/10' : o.id === selectedId ? 'border-amber-500' : 'border-zinc-800'} px-2 py-1`}>
                        <input type="checkbox" checked={selectedLayerIds.has(o.id)} onChange={() => toggleLayerSelection(o.id)}
                          className="w-3 h-3 accent-blue-500 cursor-pointer" data-testid={`layer-checkbox-${o.id}`} />
                        <button onClick={() => setObjects((prev) => prev.map((x) => x.id === o.id ? { ...x, visible: !(x.visible !== false) } : x))}
                          className="text-zinc-400 hover:text-amber-500" title="Visibility">
                          {o.visible !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => setObjects((prev) => prev.map((x) => x.id === o.id ? { ...x, locked: !x.locked } : x))}
                          className="text-zinc-400 hover:text-amber-500" title="Lock">
                          {o.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                        <span onClick={() => { setSelectedId(o.id); setSelectedLayerIds(new Set()); }}
                          className={`flex-1 truncate text-xs font-mono cursor-pointer ${o.id === selectedId ? 'text-amber-500' : 'text-zinc-300'}`}
                          title={o.name || o.type}>
                          {o.name || o.type}
                        </span>
                        <div className="w-4 h-4 border border-zinc-700" style={{ background: o.fill === 'none' ? 'transparent' : o.fill }} />
                        <span className={`text-[9px] font-mono ${isLargest ? 'text-amber-500 font-bold' : 'text-zinc-500'}`}>
                          {sizeMm.toFixed(1)}mm
                        </span>
                      </li>
                    );
                  })}
                </ul>

                <ScaleControl
                  objects={objects}
                  setObjects={setObjects}
                  layerScale={layerScale}
                  setLayerScale={setLayerScale}
                  originalObjectsForScale={originalObjectsForScale}
                  setOriginalObjectsForScale={setOriginalObjectsForScale}
                  pushHistory={pushHistory}
                  scaleToTargetMm={scaleToTargetMm}
                  largestLayerInfo={largestLayerInfo}
                />
              </>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}

async function buildThumbnail(objects) {
  if (objects.length === 0) return null;
  try {
    const svgString = buildSvg(objects, CANVAS_W, CANVAS_H);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const cv = document.createElement('canvas');
    cv.width = 200;
    cv.height = 200;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 200, 200);
    ctx.drawImage(img, 0, 0, 200, 200);
    URL.revokeObjectURL(url);
    return cv.toDataURL('image/png');
  } catch (e) {
    return null;
  }
}
