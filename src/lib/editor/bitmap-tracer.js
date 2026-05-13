import { newId, rgbToHex, simplifyPath } from './utils';
import { pointsToSvgPath } from './path-operations';

async function loadImageRobust(src, targetSize) {
  const loadSize = Math.max(targetSize, 1024);

  try {
    const resp = await fetch(src);
    const blob = await resp.blob();
    if (typeof createImageBitmap !== 'undefined') {
      try {
        return await createImageBitmap(blob, {
          resizeWidth: loadSize,
          resizeHeight: loadSize,
          resizeQuality: 'high',
        });
      } catch (_) {
        return await createImageBitmap(blob);
      }
    }
  } catch (_) {}

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!img.width || !img.height) {
        img.width = loadSize;
        img.height = loadSize;
      }
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
}

export async function traceBitmap(dataUrl, canvasW, canvasH, gridSize = 400, maxColors = 8) {
  const effectiveGridSize = Math.max(gridSize, Math.min(800, Math.max(canvasW, canvasH)));

  const img = await loadImageRobust(dataUrl, effectiveGridSize);
  const cv = document.createElement('canvas');
  cv.width = effectiveGridSize;
  cv.height = effectiveGridSize;
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, effectiveGridSize, effectiveGridSize);

  const iw = img.width || img.naturalWidth || effectiveGridSize;
  const ih = img.height || img.naturalHeight || effectiveGridSize;
  const ratio = Math.min(effectiveGridSize / iw, effectiveGridSize / ih);
  const w = iw * ratio;
  const h = ih * ratio;
  ctx.drawImage(img, (effectiveGridSize - w) / 2, (effectiveGridSize - h) / 2, w, h);
  const data = ctx.getImageData(0, 0, effectiveGridSize, effectiveGridSize).data;

  const counts = new Map();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 32) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (r > 245 && g > 245 && b > 245) continue;
    const key = ((r & 0xF0) << 16) | ((g & 0xF0) << 8) | (b & 0xF0);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  if (counts.size === 0) {
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 32) continue;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const key = ((r & 0xF0) << 16) | ((g & 0xF0) << 8) | (b & 0xF0);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  const palette = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, maxColors).map(([k]) => [
    (k >> 16) & 0xff, (k >> 8) & 0xff, k & 0xff,
  ]);
  if (palette.length === 0) return [];

  const cellW = canvasW / effectiveGridSize;
  const cellH = canvasH / effectiveGridSize;
  const buckets = palette.map(() => []);
  for (let y = 0; y < effectiveGridSize; y++) {
    for (let x = 0; x < effectiveGridSize; x++) {
      const idx = (y * effectiveGridSize + x) * 4;
      if (data[idx + 3] < 32) continue;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      if (r > 245 && g > 245 && b > 245) continue;
      let best = 0, bestD = Infinity;
      for (let p = 0; p < palette.length; p++) {
        const [pr, pg, pb] = palette[p];
        const d = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
        if (d < bestD) {
          bestD = d;
          best = p;
        }
      }
      buckets[best].push([x * cellW, y * cellH, cellW + 0.5, cellH + 0.5]);
    }
  }

  const out = [];
  for (let i = 0; i < buckets.length; i++) {
    const cells = buckets[i];
    if (cells.length === 0) continue;
    const [r, g, b] = palette[i];
    const fill = rgbToHex(r, g, b);
    out.push({
      type: 'rectset', id: newId(), fill, stroke: 'none', strokeWidth: 0,
      opacity: 1, visible: true, locked: false, name: `Trace ${fill}`, cells,
    });
  }
  return out;
}

function marchingSquares(mask, w, h) {
  const paths = [];
  const visited = new Uint8Array(w * h);

  function trace(x, y) {
    const path = [];
    let cx = x, cy = y;

    do {
      path.push([cx, cy]);
      visited[cy * w + cx] = 1;

      if (cx + 1 < w && mask[cy * w + cx + 1] && !visited[cy * w + cx + 1]) cx++;
      else if (cy + 1 < h && mask[(cy + 1) * w + cx] && !visited[(cy + 1) * w + cx]) cy++;
      else if (cx - 1 >= 0 && mask[cy * w + cx - 1] && !visited[cy * w + cx - 1]) cx--;
      else if (cy - 1 >= 0 && mask[(cy - 1) * w + cx] && !visited[(cy - 1) * w + cx]) cy--;
      else break;

    } while (true);

    return path;
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x] && !visited[y * w + x]) {
        const p = trace(x, y);
        if (p.length > 10) paths.push(p);
      }
    }
  }

  return paths;
}

export async function traceBitmapAdvanced(dataUrl, canvasW, canvasH, {
  maxColors = 16,
  threshold = 16,
  simplify: simplifyTolerance = 0.8
} = {}) {
  const img = await loadImageRobust(dataUrl, 1024);
  const cv = document.createElement('canvas');
  cv.width = img.width;
  cv.height = img.height;
  const ctx = cv.getContext('2d');

  ctx.drawImage(img, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, cv.width, cv.height);

  const colorMap = new Map();

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < threshold) continue;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const key = (r << 16) | (g << 8) | b;
    colorMap.set(key, (colorMap.get(key) || 0) + 1);
  }

  const palette = [...colorMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxColors)
    .map(([k]) => [
      (k >> 16) & 255,
      (k >> 8) & 255,
      k & 255
    ]);

  const result = [];

  for (const [pr, pg, pb] of palette) {
    const mask = new Uint8Array(width * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        if (data[i + 3] < threshold) continue;

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const dist = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;

        if (dist < 900) {
          mask[y * width + x] = 1;
        }
      }
    }

    const paths = marchingSquares(mask, width, height);

    for (const path of paths) {
      const simplified = simplifyPath(path, simplifyTolerance);

      const d = pointsToSvgPath(simplified, canvasW, canvasH, width, height);

      result.push({
        type: 'svgpath',
        id: newId(),
        fill: rgbToHex(pr, pg, pb),
        stroke: 'none',
        strokeWidth: 0,
        opacity: 1,
        visible: true,
        d
      });
    }
  }

  return result;
}
