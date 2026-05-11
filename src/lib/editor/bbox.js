import { extractPathCoordinates } from './path-operations';

export function getBBox(o) {
  switch (o.type) {
    case 'rect':
    case 'image':
      return { x: o.x, y: o.y, w: o.width, h: o.height };
    case 'ellipse':
      return { x: o.cx - o.rx, y: o.cy - o.ry, w: o.rx * 2, h: o.ry * 2 };
    case 'line': {
      const x = Math.min(o.x1, o.x2);
      const y = Math.min(o.y1, o.y2);
      const w = Math.abs(o.x2 - o.x1);
      const h = Math.abs(o.y2 - o.y1);
      return { x, y, w: Math.max(1, w), h: Math.max(1, h) };
    }
    case 'polygon':
    case 'path': {
      const pts = o.points || [];
      if (pts.length === 0) return { x: 0, y: 0, w: 1, h: 1 };
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const [x, y] of pts) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      return { x: minX, y: minY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY) };
    }
    case 'svgpath': {
      const coords = extractPathCoordinates(o.d || '');
      if (coords.length === 0) return { x: 0, y: 0, w: 1, h: 1 };
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const [x, y] of coords) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      return { x: minX, y: minY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY) };
    }
    case 'text': {
      const fs = o.fontSize || 24;
      const w = (o.text || '').length * fs * 0.6;
      return { x: o.x, y: o.y - fs, w: Math.max(1, w), h: fs * 1.2 };
    }
    case 'rectset': {
      const cells = o.cells || [];
      if (cells.length === 0) return { x: 0, y: 0, w: 1, h: 1 };
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const [x, y, w, h] of cells) {
        if (x < minX) minX = x;
        if (x + w > maxX) maxX = x + w;
        if (y < minY) minY = y;
        if (y + h > maxY) maxY = y + h;
      }
      return { x: minX, y: minY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY) };
    }
    default:
      return { x: 0, y: 0, w: 1, h: 1 };
  }
}

export function hitTest(o, px, py) {
  const b = getBBox(o);
  const pad = (o.type === 'line' || o.type === 'path' || o.type === 'svgpath') ? Math.max(8, (o.strokeWidth || 2) / 2 + 4) : 0;
  return px >= b.x - pad && px <= b.x + b.w + pad && py >= b.y - pad && py <= b.y + b.h + pad;
}
