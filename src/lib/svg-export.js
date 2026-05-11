export function buildSvgsByColor(strokes, width, height) {
  const byColor = new Map();
  for (const s of strokes) {
    if (!s || !s.color || !s.points || s.points.length === 0) continue;
    if (!byColor.has(s.color)) byColor.set(s.color, []);
    byColor.get(s.color).push(s);
  }

  const results = [];
  for (const [color, list] of byColor.entries()) {
    const paths = list
      .map((s) => {
        const d = s.points
          .map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(2)},${p[1].toFixed(2)}`)
          .join(' ');
        return `<path d="${d}" fill="none" stroke="${escapeAttr(color)}" stroke-width="${s.brushSize || 6}" stroke-linecap="round" stroke-linejoin="round"/>`;
      })
      .join('\n  ');
    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n  ${paths}\n</svg>`;
    results.push({
      color,
      svg,
      filename: `layer-${colorToFilename(color)}.svg`,
    });
  }
  return results;
}

export function buildCombinedSvg(strokes, width, height) {
  const paths = strokes
    .filter((s) => s && s.points && s.points.length > 0)
    .map((s) => {
      const d = s.points
        .map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(2)},${p[1].toFixed(2)}`)
        .join(' ');
      return `<path d="${d}" fill="none" stroke="${escapeAttr(s.color)}" stroke-width="${s.brushSize || 6}" stroke-linecap="round" stroke-linejoin="round"/>`;
    })
    .join('\n  ');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n  ${paths}\n</svg>`;
}

function escapeAttr(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
}

function colorToFilename(color) {
  return String(color).replace(/[^a-zA-Z0-9]/g, '_').slice(0, 24) || 'color';
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadText(text, filename, mime = 'text/plain') {
  downloadBlob(new Blob([text], { type: mime }), filename);
}
