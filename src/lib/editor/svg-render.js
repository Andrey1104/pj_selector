import {PX_PER_MM, BASE_LASER_COLORS} from "@/lib/editor-utils";

export function shapeToSvgElement(o, canvasMm = 150) {
  const centerOffset = canvasMm / 2;
  const mmX = (px) => ((px / PX_PER_MM) - centerOffset).toFixed(4);
  const mmY = (px) => ((px / PX_PER_MM) - centerOffset).toFixed(4);
  const mmSize = (px) => (px / PX_PER_MM).toFixed(4);
  const getAttributes = (obj, defaultStroke = '#000000') => {
    const attrs = [];
    if (obj.stroke && obj.stroke !== 'none') {
      attrs.push(`stroke="${obj.stroke}"`);
      attrs.push(`stroke-width="${mmSize(obj.strokeWidth || 1)}"`);
    } else if (obj.fill && obj.fill !== 'none') {
      attrs.push(`stroke="${obj.fill}"`);
      attrs.push(`stroke-width="0.05"`);
    } else {
      attrs.push(`stroke="${defaultStroke}"`);
      attrs.push(`stroke-width="0.05"`);
    }

    if (obj.fill && obj.fill !== 'none') {
      attrs.push(`fill="${obj.fill}"`);
    }
    return attrs.join(' ');
  };

  const common = getAttributes(o);

  switch (o.type) {
    case 'rect':
      return `<rect x="${mmX(o.x)}" y="${mmY(o.y)}" width="${mmSize(o.width)}" height="${mmSize(o.height)}" ${common} />`;

    case 'ellipse':
      return `<ellipse cx="${mmX(o.cx)}" cy="${mmY(o.cy)}" rx="${mmSize(o.rx)}" ry="${mmSize(o.ry)}" ${common} />`;

    case 'circle':
      return `<circle cx="${mmX(o.cx)}" cy="${mmY(o.cy)}" r="${mmSize(o.r)}" ${common} />`;

    case 'line':
      return `<line x1="${mmX(o.x1)}" y1="${mmY(o.y1)}" x2="${mmX(o.x2)}" y2="${mmY(o.y2)}" ${getAttributes(o)} />`;

    case 'polygon': {
      const pointsMm = (o.points || []).map(([x, y]) => `${mmX(x)},${mmY(y)}`).join(' ');
      return `<polygon points="${pointsMm}" ${common} />`;
    }

    case 'octagon': {
      const offsetW = o.width * 0.29289;
      const offsetH = o.height * 0.29289;
      const x1 = o.x, y1 = o.y;
      const x2 = o.x + offsetW, y2 = o.y + offsetH;
      const x3 = o.x + o.width - offsetW, y3 = o.y + o.height - offsetH;
      const x4 = o.x + o.width, y4 = o.y + o.height;

      const points = [
        [x2, y1], [x3, y1],
        [x4, y2], [x4, y3],
        [x3, y4], [x2, y4],
        [x1, y3], [x1, y2]
      ];
      const pointsMm = points.map(([x, y]) => `${mmX(x)},${mmY(y)}`).join(' ');
      return `<polygon points="${pointsMm}" ${common} />`;
    }

    case 'path': {
      const d = (o.points || []).map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${mmX(x)},${mmY(y)}`).join(' ');
      return `<path d="${d}" ${getAttributes(o)} stroke-linecap="round" stroke-linejoin="round" />`;
    }

    case 'svgpath': {
      const dMm = (o.d || '').replace(/(-?\d+\.?\d*)/g, (match) => {
        const px = parseFloat(match);
        const val = (px / PX_PER_MM) - centerOffset;
        return val.toFixed(4);
      });
      return `<path d="${dMm}" ${common} />`;
    }

    case 'rectset': {
      const d = (o.cells || []).map(([x, y, w, h]) =>
        `M${mmX(x)},${mmY(y)} L${mmX(x + w)},${mmY(y)} L${mmX(x + w)},${mmY(y + h)} L${mmX(x)},${mmY(y + h)} Z`
      ).join(' ');
      return `<path d="${d}" ${getAttributes({fill: o.fill || '#000000'})} />`;
    }

    case 'text': {
      const t = (o.text || '').replace(/[<>&"']/g, (c) => ({
        '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;'
      }[c]));
      return `<text x="${mmX(o.x)}" y="${mmY(o.y)}" font-size="${mmSize(o.fontSize || 24)}" font-family="${o.fontFamily || 'sans-serif'}" font-weight="${o.fontWeight || 'normal'}" font-style="${o.fontStyle || 'normal'}" text-anchor="${o.textAnchor || 'start'}" ${common}>${t}</text>`;
    }

    case 'image':
    default:
      return '';
  }
}

export function buildSvg(objects, canvasMm = 150) {
  const visible = objects.filter((o) => o.visible !== false);
  const body = visible.map((o) => shapeToSvgElement(o, canvasMm)).join('\n  ');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${canvasMm}" height="${canvasMm}">\n  ${body}\n</svg>`;
}

export function buildSvgsByColor(objects, canvasMm) {
  const visible = objects.filter((o) => o.visible !== false && o.type !== 'image');
  const groups = new Map();

  for (const o of visible) {
    const hasFill = o.fill && o.fill !== 'none';
    const hasStroke = o.stroke && o.stroke !== 'none';
    if (hasFill) {
      const baseColorObj = getClosestColorObject(o.fill);
      const groupKey = baseColorObj.hex;
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {name: baseColorObj.name, list: []});
      }
      groups.get(groupKey).list.push({...o, stroke: 'none', strokeWidth: 0});
    }

    if (hasStroke) {
      const baseColorObj = getClosestColorObject(o.stroke);
      const groupKey = baseColorObj.hex;
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {name: baseColorObj.name, list: []});
      }
      groups.get(groupKey).list.push({...o, fill: 'none'});
    }
    if (!hasFill && !hasStroke) {
      const blackKey = '#000000';
      if (!groups.has(blackKey)) {
        groups.set(blackKey, {name: 'black', list: []});
      }
      groups.get(blackKey).list.push(o);
    }
  }
  const out = [];
  for (const [hexKey, groupData] of groups.entries()) {
    const body = groupData.list.map((o) => shapeToSvgElement(o, canvasMm)).join('\n  ');

    out.push({
      color: hexKey,
      filename: `layer-${groupData.name}.svg`,
      svg: `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${canvasMm}" height="${canvasMm}">\n  ${body}\n</svg>`,
    });
  }
  return out;
}

function hexToRgb(hex) {
  const cleanHex = hex.replace('#', '');
  const fullHex = cleanHex.length === 3
    ? cleanHex.split('').map(c => c + c).join('')
    : cleanHex;
  const num = parseInt(fullHex, 16);
  return {r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255};
}

function getClosestColorObject(inputHex) {
  if (!inputHex || inputHex === 'none') return BASE_LASER_COLORS[0];
  try {
    const target = hexToRgb(inputHex);
    let closest = BASE_LASER_COLORS[0];
    let minDistance = Infinity;

    for (const base of BASE_LASER_COLORS) {
      const distance = Math.sqrt(
        Math.pow(target.r - base.r, 2) +
        Math.pow(target.g - base.g, 2) +
        Math.pow(target.b - base.b, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closest = base;
      }
    }
    return closest;
  } catch (e) {
    return BASE_LASER_COLORS[0];
  }
}