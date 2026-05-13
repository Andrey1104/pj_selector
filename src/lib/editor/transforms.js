import { getBBox } from './bbox';
import { scaleSvgPath, translateSvgPath } from './path-operations';

export function applyBBoxTransform(o, oldBox, newBox) {
  const sx = newBox.w / Math.max(0.001, oldBox.w);
  const sy = newBox.h / Math.max(0.001, oldBox.h);
  const tx = (x) => newBox.x + (x - oldBox.x) * sx;
  const ty = (y) => newBox.y + (y - oldBox.y) * sy;
  switch (o.type) {
    case 'rect':
    case 'image':
      return { ...o, x: tx(o.x), y: ty(o.y), width: o.width * sx, height: o.height * sy };
    case 'ellipse':
      return { ...o, cx: tx(o.cx), cy: ty(o.cy), rx: o.rx * sx, ry: o.ry * sy };
    case 'rectset':
      return { ...o, cells: o.cells.map(([x, y, w, h]) => [tx(x), ty(y), w * sx, h * sy]) };
    case 'line':
      return { ...o, x1: tx(o.x1), y1: ty(o.y1), x2: tx(o.x2), y2: ty(o.y2) };
    case 'polygon':
    case 'path':
      return { ...o, points: o.points.map(([x, y]) => [tx(x), ty(y)]) };
    case 'svgpath':
      return { ...o, d: scaleSvgPath(o.d, oldBox, newBox) };
    case 'text':
      return { ...o, x: tx(o.x), y: ty(o.y) + (o.fontSize * sy - o.fontSize), fontSize: Math.max(6, o.fontSize * sy) };
    default:
      return o;
  }
}

export function translate(o, dx, dy) {
  switch (o.type) {
    case 'rect':
    case 'image':
    case 'text':
      return { ...o, x: o.x + dx, y: o.y + dy };
    case 'ellipse':
      return { ...o, cx: o.cx + dx, cy: o.cy + dy };
    case 'line':
      return { ...o, x1: o.x1 + dx, y1: o.y1 + dy, x2: o.x2 + dx, y2: o.y2 + dy };
    case 'polygon':
    case 'path':
      return { ...o, points: o.points.map(([x, y]) => [x + dx, y + dy]) };
    case 'svgpath':
      return { ...o, d: translateSvgPath(o.d, dx, dy) };
    case 'rectset':
      return { ...o, cells: o.cells.map(([x, y, w, h]) => [x + dx, y + dy, w, h]) };
    default:
      return o;
  }
}

export function scaleObjectFromCenter(o, scale, centerX, centerY) {
  const bbox = getBBox(o);
  const objCenterX = bbox.x + bbox.w / 2;
  const objCenterY = bbox.y + bbox.h / 2;

  const newObjCenterX = centerX + (objCenterX - centerX) * scale;
  const newObjCenterY = centerY + (objCenterY - centerY) * scale;

  switch (o.type) {
    case 'rect':
      return {
        ...o,
        x: newObjCenterX - (o.width * scale) / 2,
        y: newObjCenterY - (o.height * scale) / 2,
        width: o.width * scale,
        height: o.height * scale,
      };
    case 'ellipse':
      return {
        ...o,
        cx: newObjCenterX,
        cy: newObjCenterY,
        rx: o.rx * scale,
        ry: o.ry * scale,
      };
    case 'circle':
      return {
        ...o,
        cx: newObjCenterX,
        cy: newObjCenterY,
        r: o.r * scale,
      };
    case 'polygon':
    case 'path':
      return {
        ...o,
        points: (o.points || []).map(([x, y]) => [
          centerX + (x - centerX) * scale,
          centerY + (y - centerY) * scale,
        ]),
      };
    case 'line':
      return {
        ...o,
        x1: centerX + (o.x1 - centerX) * scale,
        y1: centerY + (o.y1 - centerY) * scale,
        x2: centerX + (o.x2 - centerX) * scale,
        y2: centerY + (o.y2 - centerY) * scale,
      };
    case 'text':
      return {
        ...o,
        x: centerX + (o.x - centerX) * scale,
        y: centerY + (o.y - centerY) * scale,
        fontSize: Math.max(6, (o.fontSize || 24) * scale),
      };
    case 'image':
      return {
        ...o,
        x: newObjCenterX - (o.width * scale) / 2,
        y: newObjCenterY - (o.height * scale) / 2,
        width: o.width * scale,
        height: o.height * scale,
      };
    case 'rectset':
      return {
        ...o,
        cells: (o.cells || []).map(([x, y, w, h]) => [
          centerX + (x - centerX) * scale,
          centerY + (y - centerY) * scale,
          w * scale,
          h * scale,
        ]),
      };
    case 'svgpath':
      if (!o.d) return o;
      const oldBox = bbox;
      const newW = bbox.w * scale;
      const newH = bbox.h * scale;
      const newBox = {
        x: centerX + (bbox.x - centerX) * scale,
        y: centerY + (bbox.y - centerY) * scale,
        w: newW,
        h: newH,
      };
      return {
        ...o,
        d: scaleSvgPath(o.d, oldBox, newBox),
      };
    default:
      return o;
  }
}

export function centerObjectsOnCanvas(objects, canvasW, canvasH) {
  if (objects.length === 0) return objects;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const o of objects) {
    const bbox = getBBox(o);
    minX = Math.min(minX, bbox.x);
    minY = Math.min(minY, bbox.y);
    maxX = Math.max(maxX, bbox.x + bbox.w);
    maxY = Math.max(maxY, bbox.y + bbox.h);
  }

  const contentW = maxX - minX;
  const contentH = maxY - minY;
  const offsetX = (canvasW - contentW) / 2 - minX;
  const offsetY = (canvasH - contentH) / 2 - minY;

  return objects.map(o => translate(o, offsetX, offsetY));
}

export function flipObject(o, direction, centerX, centerY) {
  const bbox = getBBox(o);
  const objCenterX = bbox.x + bbox.w / 2;
  const objCenterY = bbox.y + bbox.h / 2;

  if (direction === 'horizontal') {
    const newCenterX = centerX + (centerX - objCenterX);
    const dx = newCenterX - objCenterX;
    return translate(o, dx, 0);
  } else {
    const newCenterY = centerY + (centerY - objCenterY);
    const dy = newCenterY - objCenterY;
    return translate(o, 0, dy);
  }
}

export function rotateObject(o, cx, cy, cos, sin) {
  const rotatePoint = (x, y) => {
    const dx = x - cx;
    const dy = y - cy;
    return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos];
  };

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
}
