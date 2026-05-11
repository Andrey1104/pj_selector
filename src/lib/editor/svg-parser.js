import { newId, normalizeColor } from './utils';
import { getBBox } from './bbox';
import { translate } from './transforms';

function transformSvgPathWithMatrix(d, ctm, vbX, vbY, ratio, ox, oy) {
  function mapPt(x, y) {
    if (ctm) {
      const p = new DOMPoint(x, y).matrixTransform(ctm);
      x = p.x;
      y = p.y;
    }
    return [
      ox + (x - vbX) * ratio,
      oy + (y - vbY) * ratio
    ];
  }

  function scaleR(v) {
    if (ctm) {
      const s = Math.sqrt(Math.abs(ctm.a * ctm.d - ctm.b * ctm.c));
      return +(v * s * ratio);
    }
    return +(v * ratio);
  }

  const regex = /([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g;
  let out = '';
  let match;
  let cx = 0, cy = 0;
  let sx = 0, sy = 0;

  while ((match = regex.exec(d)) !== null) {
    const cmd = match[1];
    const raw = match[2].trim();
    const args = raw ? (raw.match(/-?\d*\.?\d+(?:[eE][-+]?\d+)?/g) || []).map(Number) : [];
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();

    if (C === 'Z') {
      out += 'Z ';
      cx = sx;
      cy = sy;
      continue;
    }

    let na = [];
    switch (C) {
      case 'M':
        for (let i = 0; i + 1 < args.length; i += 2) {
          cx = rel ? cx + args[i] : args[i];
          cy = rel ? cy + args[i + 1] : args[i + 1];
          const [px, py] = mapPt(cx, cy);
          na.push(px, py);
          if (i === 0) {
            sx = cx;
            sy = cy;
          }
        }
        out += 'M ' + na.join(' ') + ' ';
        break;
      case 'L':
        for (let i = 0; i + 1 < args.length; i += 2) {
          cx = rel ? cx + args[i] : args[i];
          cy = rel ? cy + args[i + 1] : args[i + 1];
          const [px, py] = mapPt(cx, cy);
          na.push(px, py);
        }
        out += 'L ' + na.join(' ') + ' ';
        break;
      case 'H':
        for (let i = 0; i < args.length; i++) {
          cx = rel ? cx + args[i] : args[i];
          const [px, py] = mapPt(cx, cy);
          na.push(px, py);
        }
        out += 'L ' + na.join(' ') + ' ';
        break;
      case 'V':
        for (let i = 0; i < args.length; i++) {
          cy = rel ? cy + args[i] : args[i];
          const [px, py] = mapPt(cx, cy);
          na.push(px, py);
        }
        out += 'L ' + na.join(' ') + ' ';
        break;
      case 'C':
        for (let i = 0; i + 5 < args.length; i += 6) {
          const [x1, y1] = mapPt(rel ? cx + args[i] : args[i], rel ? cy + args[i + 1] : args[i + 1]);
          const [x2, y2] = mapPt(rel ? cx + args[i + 2] : args[i + 2], rel ? cy + args[i + 3] : args[i + 3]);
          cx = rel ? cx + args[i + 4] : args[i + 4];
          cy = rel ? cy + args[i + 5] : args[i + 5];
          const [ex, ey] = mapPt(cx, cy);
          na.push(x1, y1, x2, y2, ex, ey);
        }
        out += 'C ' + na.join(' ') + ' ';
        break;
      case 'S':
        for (let i = 0; i + 3 < args.length; i += 4) {
          const [x2, y2] = mapPt(rel ? cx + args[i] : args[i], rel ? cy + args[i + 1] : args[i + 1]);
          cx = rel ? cx + args[i + 2] : args[i + 2];
          cy = rel ? cy + args[i + 3] : args[i + 3];
          const [ex, ey] = mapPt(cx, cy);
          na.push(x2, y2, ex, ey);
        }
        out += 'S ' + na.join(' ') + ' ';
        break;
      case 'Q':
        for (let i = 0; i + 3 < args.length; i += 4) {
          const [x1, y1] = mapPt(rel ? cx + args[i] : args[i], rel ? cy + args[i + 1] : args[i + 1]);
          cx = rel ? cx + args[i + 2] : args[i + 2];
          cy = rel ? cy + args[i + 3] : args[i + 3];
          const [ex, ey] = mapPt(cx, cy);
          na.push(x1, y1, ex, ey);
        }
        out += 'Q ' + na.join(' ') + ' ';
        break;
      case 'T':
        for (let i = 0; i + 1 < args.length; i += 2) {
          cx = rel ? cx + args[i] : args[i];
          cy = rel ? cy + args[i + 1] : args[i + 1];
          const [px, py] = mapPt(cx, cy);
          na.push(px, py);
        }
        out += 'T ' + na.join(' ') + ' ';
        break;
      case 'A':
        for (let i = 0; i + 6 < args.length; i += 7) {
          cx = rel ? cx + args[i + 5] : args[i + 5];
          cy = rel ? cy + args[i + 6] : args[i + 6];
          const [ex, ey] = mapPt(cx, cy);
          na.push(scaleR(args[i]), scaleR(args[i + 1]), args[i + 2], args[i + 3], args[i + 4], ex, ey);
        }
        out += 'A ' + na.join(' ') + ' ';
        break;
      default:
        out += cmd + args.join(' ') + ' ';
    }
  }
  return out.trim() || null;
}

function transformSvgPath(d, vbX, vbY, ratio, ox, oy) {
  return transformSvgPathWithMatrix(d, null, vbX, vbY, ratio, ox, oy);
}

export function parseSvgString(svgText, canvasW, canvasH) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  const svg = doc.querySelector('svg');
  if (!svg) return [];

  let vb = svg.getAttribute('viewBox');
  let vbX = 0, vbY = 0, vbW = parseFloat(svg.getAttribute('width')) || canvasW;
  let vbH = parseFloat(svg.getAttribute('height')) || canvasH;
  if (vb) {
    const parts = vb.trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4) {
      [vbX, vbY, vbW, vbH] = parts;
    }
  }
  const ratio = Math.min(canvasW / vbW, canvasH / vbH);
  const ox = (canvasW - vbW * ratio) / 2;
  const oy = (canvasH - vbH * ratio) / 2;

  function applyCtm(x, y, ctm) {
    if (ctm) {
      const pt = new DOMPoint(x, y).matrixTransform(ctm);
      x = pt.x;
      y = pt.y;
    }
    return [ox + (x - vbX) * ratio, oy + (y - vbY) * ratio];
  }

  function scaleCtm(v, ctm) {
    if (ctm) {
      const s = Math.sqrt(Math.abs(ctm.a * ctm.d - ctm.b * ctm.c));
      return v * s * ratio;
    }
    return v * ratio;
  }

  const sc = (v) => v * ratio;

  const host = document.createElement('div');
  host.style.cssText = 'position:absolute;left:-99999px;top:-99999px;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none';
  host.appendChild(svg);
  document.body.appendChild(host);

  const idMap = new Map();
  svg.querySelectorAll('[id]').forEach(el => idMap.set(el.id, el));
  const cssClassMap = new Map();
  svg.querySelectorAll('style').forEach(styleEl => {
    const text = styleEl.textContent || '';
    const ruleRe = /([^{]+)\{([^}]*)\}/g;
    let rm;
    while ((rm = ruleRe.exec(text)) !== null) {
      const props = new Map();
      const propRe = /([\w-]+)\s*:\s*([^;]+)/g;
      let pm;
      while ((pm = propRe.exec(rm[2])) !== null) {
        props.set(pm[1].trim(), pm[2].trim());
      }
      const selectors = rm[1].split(',').map(s => s.trim());
      for (const sel of selectors) {
        if (sel.startsWith('.')) {
          const className = sel.slice(1);
          const existing = cssClassMap.get(className);
          if (existing) {
            props.forEach((v, k) => existing.set(k, v));
          } else {
            cssClassMap.set(className, new Map(props));
          }
        }
      }
    }
  });

  function getCssProp(el, prop) {
    if (el.style) {
      const sv = el.style.getPropertyValue ? el.style.getPropertyValue(prop) : el.style[prop];
      if (sv && sv !== '') return sv;
    }
    const styleAttr = el.getAttribute('style');
    if (styleAttr) {
      const escapedProp = prop.replace(/-/g, '\\-');
      const propRe = new RegExp(`(?:^|;|\\s)\\s*${escapedProp}\\s*:\\s*([^;]+)`, 'i');
      const match = styleAttr.match(propRe);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    const attr = el.getAttribute(prop);
    if (attr && attr !== '') return attr;
    const classes = (el.getAttribute('class') || '').split(/\s+/).filter(Boolean);
    for (let i = classes.length - 1; i >= 0; i--) {
      const rules = cssClassMap.get(classes[i]);
      if (rules && rules.has(prop)) return rules.get(prop);
    }
    try {
      const cs = window.getComputedStyle(el);
      const v = cs.getPropertyValue(prop);
      if (v && v !== '' && v !== 'rgba(0, 0, 0, 0)') return v;
    } catch (_) {}
    return null;
  }

  function colorOf(el, prop, fallback) {
    const chain = [el];
    let p = el.parentElement;
    while (p && p.tagName && p.tagName.toLowerCase() !== 'svg') {
      chain.push(p);
      p = p.parentElement;
    }
    for (const e of chain) {
      const v = getCssProp(e, prop);
      if (!v) continue;
      if (v === 'none') return 'none';
      if (v.toLowerCase() !== 'currentcolor' && v !== 'rgba(0, 0, 0, 0)' && v !== 'transparent') {
        return normalizeColor(v);
      }
    }
    return fallback;
  }

  function isNoneProp(el, prop) {
    const chain = [el];
    let p = el.parentElement;
    while (p && p.tagName && p.tagName.toLowerCase() !== 'svg') {
      chain.push(p);
      p = p.parentElement;
    }
    for (const e of chain) {
      const v = getCssProp(e, prop);
      if (v === 'none') return true;
      if (v && v !== '') return false;
    }
    return false;
  }

  function getStrokeWidth(el) {
    const chain = [el];
    let p = el.parentElement;
    while (p && p.tagName && p.tagName.toLowerCase() !== 'svg') {
      chain.push(p);
      p = p.parentElement;
    }
    for (const e of chain) {
      const v = getCssProp(e, 'stroke-width');
      if (v) {
        const n = parseFloat(v);
        if (!isNaN(n)) return n;
      }
    }
    return 0;
  }

  function getFillRule(el) {
    const chain = [el];
    let p = el.parentElement;
    while (p && p.tagName) {
      chain.push(p);
      if (p.tagName.toLowerCase() === 'svg') break;
      p = p.parentElement;
    }
    for (const e of chain) {
      const v = getCssProp(e, 'fill-rule');
      if (v && (v === 'evenodd' || v === 'nonzero')) return v;
    }
    return 'nonzero';
  }

  function isHidden(el) {
    try {
      const cs = window.getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return true;
    } catch (_) {}
    const dispAttr = el.getAttribute('display');
    if (dispAttr === 'none') return true;
    const visAttr = el.getAttribute('visibility');
    if (visAttr === 'hidden') return true;
    return false;
  }

  function numAttr(el, name, def = 0) {
    const v = parseFloat(el.getAttribute(name));
    return isNaN(v) ? def : v;
  }

  function parseTransformAttr(transformStr) {
    if (!transformStr) return null;
    try {
      return new DOMMatrix(transformStr);
    } catch (_) {}
    return null;
  }

  function combineCtm(parentCtm, el) {
    const t = el.getAttribute('transform');
    if (!t) return parentCtm;
    const local = parseTransformAttr(t);
    if (!local) return parentCtm;
    if (!parentCtm) return local;
    return parentCtm.multiply(local);
  }

  const out = [];

  function processElement(el, parentCtm) {
    if (isHidden(el)) return;
    const tag = (el.tagName || '').toLowerCase().replace(/^svg:/, '');

    if (tag === 'use') {
      const href = el.getAttribute('href') || el.getAttribute('xlink:href') || '';
      const refId = href.replace(/^#/, '');
      const refEl = refId ? idMap.get(refId) : null;
      if (!refEl) return;
      let useCTM = combineCtm(parentCtm, el);
      const useX = numAttr(el, 'x', 0);
      const useY = numAttr(el, 'y', 0);
      if (useX || useY) {
        const offset = new DOMMatrix().translate(useX, useY);
        useCTM = useCTM ? useCTM.multiply(offset) : offset;
      }
      const refTag = (refEl.tagName || '').toLowerCase().replace(/^svg:/, '');
      if (refTag === 'symbol' || refTag === 'g') {
        Array.from(refEl.children).forEach(child => processElement(child, useCTM));
      } else {
        processElement(refEl, useCTM);
      }
      return;
    }

    if (tag === 'g' || tag === 'symbol' || tag === 'svg') {
      const childCtm = combineCtm(parentCtm, el);
      Array.from(el.children).forEach(child => processElement(child, childCtm));
      return;
    }

    if (tag === 'defs' || tag === 'clippath' || tag === 'mask' || tag === 'filter' ||
      tag === 'style' || tag === 'script' || tag === 'metadata' || tag === 'title' || tag === 'desc') return;

    const ctm = combineCtm(parentCtm, el);

    const isStrokeShape = (tag === 'line' || tag === 'polyline' || tag === 'path');
    const fill = isNoneProp(el, 'fill') ? 'none' : colorOf(el, 'fill', isStrokeShape ? 'none' : '#000000');
    const stroke = isNoneProp(el, 'stroke') ? 'none' : colorOf(el, 'stroke', 'none');
    const rawStrokeWidth = getStrokeWidth(el);
    const strokeWidth = Math.max(0.5, scaleCtm(rawStrokeWidth, ctm));
    const rawOpacity = getCssProp(el, 'opacity');
    const opacity = rawOpacity ? (parseFloat(rawOpacity) || 1) : 1;
    const fillRule = getFillRule(el);
    
    const base = {
      id: newId(),
      fill,
      stroke,
      strokeWidth,
      opacity,
      fillRule,
      visible: true,
      locked: false
    };

    const pt = (x, y) => applyCtm(x, y, ctm);
    const ptX = (x, y) => pt(x, y)[0];
    const ptY = (x, y) => pt(x, y)[1];

    if (tag === 'rect') {
      const x = numAttr(el, 'x'), y = numAttr(el, 'y');
      const w = numAttr(el, 'width'), h = numAttr(el, 'height');
      if (w <= 0 || h <= 0) return;
      const [tx1, ty1] = pt(x, y);
      const [tx2, ty2] = pt(x + w, y + h);
      out.push({
        ...base, type: 'rect', name: 'Rect',
        x: tx1, y: ty1, width: Math.abs(tx2 - tx1), height: Math.abs(ty2 - ty1)
      });

    } else if (tag === 'circle') {
      const r = numAttr(el, 'r');
      if (r <= 0) return;
      const [cx, cy] = pt(numAttr(el, 'cx'), numAttr(el, 'cy'));
      const scaledR = scaleCtm(r, ctm);
      out.push({ ...base, type: 'ellipse', name: 'Circle', cx, cy, rx: scaledR, ry: scaledR });

    } else if (tag === 'ellipse') {
      const [cx, cy] = pt(numAttr(el, 'cx'), numAttr(el, 'cy'));
      out.push({
        ...base, type: 'ellipse', name: 'Ellipse', cx, cy,
        rx: scaleCtm(numAttr(el, 'rx'), ctm), ry: scaleCtm(numAttr(el, 'ry'), ctm)
      });

    } else if (tag === 'line') {
      out.push({
        ...base, type: 'line', name: 'Line', fill: 'none',
        stroke: stroke === 'none' ? '#000000' : stroke,
        strokeWidth: Math.max(sc(0.5), strokeWidth || sc(1)),
        x1: ptX(numAttr(el, 'x1'), numAttr(el, 'y1')),
        y1: ptY(numAttr(el, 'x1'), numAttr(el, 'y1')),
        x2: ptX(numAttr(el, 'x2'), numAttr(el, 'y2')),
        y2: ptY(numAttr(el, 'x2'), numAttr(el, 'y2'))
      });

    } else if (tag === 'polygon' || tag === 'polyline') {
      const ptsAttr = (el.getAttribute('points') || '').trim();
      const nums = ptsAttr.split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
      const pts = [];
      for (let i = 0; i + 1 < nums.length; i += 2) pts.push(pt(nums[i], nums[i + 1]));
      if (pts.length === 0) return;
      out.push({
        ...base, type: tag === 'polygon' ? 'polygon' : 'path', name: tag, points: pts,
        fill: tag === 'polygon' ? fill : 'none',
        stroke: stroke === 'none' && tag === 'polyline' ? '#000000' : stroke,
        strokeWidth: tag === 'polyline' ? Math.max(sc(0.5), strokeWidth || sc(1)) : strokeWidth
      });

    } else if (tag === 'path') {
      const d = el.getAttribute('d');
      if (!d || !d.trim()) return;
      let transformedD = d;
      if (ctm) {
        transformedD = transformSvgPathWithMatrix(d, ctm, vbX, vbY, ratio, ox, oy);
      } else {
        transformedD = transformSvgPath(d, vbX, vbY, ratio, ox, oy);
      }
      if (!transformedD) return;
      const finalStroke = stroke === 'none' && fill !== 'none' ? 'none' : (stroke === 'none' ? '#000000' : stroke);
      out.push({
        ...base, type: 'svgpath', name: 'Path', d: transformedD,
        fill, stroke: finalStroke,
        strokeWidth: stroke === 'none' && fill !== 'none' ? 0 : Math.max(sc(0.5), strokeWidth || sc(1))
      });

    } else if (tag === 'text') {
      const rawFs = parseFloat(el.getAttribute('font-size')) || (el.style && parseFloat(el.style.fontSize)) || 24;
      const [tx2, ty2] = pt(numAttr(el, 'x'), numAttr(el, 'y'));
      out.push({
        ...base, type: 'text', name: 'Text', x: tx2, y: ty2,
        text: el.textContent || '', fontSize: scaleCtm(rawFs, ctm),
        fontFamily: el.getAttribute('font-family') || (el.style && el.style.fontFamily) || 'sans-serif'
      });
    }
  }

  try {
    Array.from(svg.children).forEach(child => {
      const tag = (child.tagName || '').toLowerCase().replace(/^svg:/, '');
      if (tag === 'defs') return;
      processElement(child, null);
    });
    svg.querySelectorAll('use').forEach(useEl => {
      const parent = useEl.parentElement;
      const parentTag = (parent?.tagName || '').toLowerCase().replace(/^svg:/, '');
      if (parentTag !== 'defs') processElement(useEl, null);
    });
  } finally {
    if (host.parentNode) host.parentNode.removeChild(host);
  }

  const seen = new Set();
  const deduped = out.filter(o => {
    if (seen.has(o.id)) return false;
    seen.add(o.id);
    return true;
  });

  if (deduped.length > 0) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const shape of deduped) {
      const bbox = getBBox(shape);
      minX = Math.min(minX, bbox.x);
      minY = Math.min(minY, bbox.y);
      maxX = Math.max(maxX, bbox.x + bbox.w);
      maxY = Math.max(maxY, bbox.y + bbox.h);
    }
    const contentW = maxX - minX;
    const contentH = maxY - minY;
    const offsetX = (canvasW - contentW) / 2 - minX;
    const offsetY = (canvasH - contentH) / 2 - minY;
    for (let i = 0; i < deduped.length; i++) {
      deduped[i] = translate(deduped[i], offsetX, offsetY);
    }
    deduped.sort((a, b) => {
      const ba = getBBox(a), bb = getBBox(b);
      return (bb.w * bb.h) - (ba.w * ba.h);
    });
  }

  return deduped;
}
