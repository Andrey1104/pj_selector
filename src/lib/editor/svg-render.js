export function shapeToSvgElement(o) {
  const common = `
  fill="${o.fill || 'none'}"
  stroke="${o.stroke || 'none'}"
  stroke-width="${o.strokeWidth || 0}"
  fill-rule="${o.fillRule || 'nonzero'}"
  opacity="${o.opacity ?? 1}"
`;
  switch (o.type) {
    case 'rect':
      return `<rect x="${o.x}" y="${o.y}" width="${o.width}" height="${o.height}" ${common}/>`;
    case 'ellipse':
      return `<ellipse cx="${o.cx}" cy="${o.cy}" rx="${o.rx}" ry="${o.ry}" ${common}/>`;
    case 'line':
      return `<line x1="${o.x1}" y1="${o.y1}" x2="${o.x2}" y2="${o.y2}" stroke="${o.stroke || '#000'}" stroke-width="${o.strokeWidth || 1}" opacity="${o.opacity ?? 1}"/>`;
    case 'polygon':
      return `<polygon points="${(o.points || []).map(([x, y]) => `${x},${y}`).join(' ')}" ${common}/>`;
    case 'path': {
      const d = (o.points || []).map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
      return `<path d="${d}" fill="${o.fill || 'none'}" stroke="${o.stroke || '#000'}" stroke-width="${o.strokeWidth || 2}" stroke-linecap="round" stroke-linejoin="round" opacity="${o.opacity ?? 1}"/>`;
    }
    case 'text': {
      const t = (o.text || '').replace(/[<>&"']/g, (c) => ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&apos;'
      }[c]));
      return `<text x="${o.x}" y="${o.y}" font-size="${o.fontSize || 24}" font-family="${o.fontFamily || 'sans-serif'}" font-weight="${o.fontWeight || 'normal'}" font-style="${o.fontStyle || 'normal'}" text-decoration="${o.textDecoration || 'none'}" text-anchor="${o.textAnchor || 'start'}" fill="${o.fill || '#000'}" opacity="${o.opacity ?? 1}">${t}</text>`;
    }
    case 'image':
      return `<image x="${o.x}" y="${o.y}" width="${o.width}" height="${o.height}" href="${o.href}" opacity="${o.opacity ?? 1}"/>`;
    case 'rectset': {
      const d = (o.cells || []).map(([x, y, w, h]) => `M${x},${y} h${w} v${h} h${(-w)} z`).join(' ');
      return `<path d="${d}" fill="${o.fill || '#000'}" stroke="none" opacity="${o.opacity ?? 1}"/>`;
    }
    case 'svgpath':
      return `<path d="${o.d || ''}" fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.strokeWidth || 0}" fill-rule="${o.fillRule || 'nonzero'}" opacity="${o.opacity ?? 1}"/>`;
    default:
      return '';
  }
}

export function buildSvg(objects, width, height) {
  const visible = objects.filter((o) => o.visible !== false);
  const body = visible.map(shapeToSvgElement).join('\n  ');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n  ${body}\n</svg>`;
}

export function buildSvgsByColor(objects, width, height) {
  const visible = objects.filter((o) => o.visible !== false && o.type !== 'image');
  const groups = new Map();

  for (const o of visible) {
    const hasFill = o.fill && o.fill !== 'none';
    const hasStroke = o.stroke && o.stroke !== 'none';

    if (hasFill) {
      if (!groups.has(o.fill)) groups.set(o.fill, []);
      groups.get(o.fill).push({ ...o, stroke: 'none', strokeWidth: 0 });
    }

    if (hasStroke) {
      if (!groups.has(o.stroke)) groups.set(o.stroke, []);
      groups.get(o.stroke).push({ ...o, fill: 'none' });
    }

    if (!hasFill && !hasStroke) {
      if (!groups.has('__no_color__')) groups.set('__no_color__', []);
      groups.get('__no_color__').push(o);
    }
  }

  const out = [];
  for (const [c, list] of groups.entries()) {
    const body = list.map(shapeToSvgElement).join('\n  ');
    out.push({
      color: c,
      filename: `layer-${c.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 16)}.svg`,
      svg: `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n  ${body}\n</svg>`,
    });
  }
  return out;
}
