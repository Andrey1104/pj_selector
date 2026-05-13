import { simplifyPath } from './utils';

export function extractPathCoordinates(d) {
  const coords = [];
  const regex = /([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g;
  let match;
  let currentX = 0, currentY = 0;

  while ((match = regex.exec(d)) !== null) {
    const cmd = match[1];
    const args = match[2].trim().split(/[\s,]+/).filter(s => s).map(Number);
    const isRelative = cmd === cmd.toLowerCase();
    const cmdUpper = cmd.toUpperCase();

    switch (cmdUpper) {
      case 'M':
      case 'L':
      case 'T':
        for (let i = 0; i < args.length; i += 2) {
          if (isRelative) {
            currentX += args[i];
            currentY += args[i + 1];
          } else {
            currentX = args[i];
            currentY = args[i + 1];
          }
          coords.push([currentX, currentY]);
        }
        break;
      case 'H':
        for (let i = 0; i < args.length; i++) {
          currentX = isRelative ? currentX + args[i] : args[i];
          coords.push([currentX, currentY]);
        }
        break;
      case 'V':
        for (let i = 0; i < args.length; i++) {
          currentY = isRelative ? currentY + args[i] : args[i];
          coords.push([currentX, currentY]);
        }
        break;
      case 'C':
        for (let i = 0; i < args.length; i += 6) {
          if (isRelative) {
            coords.push([currentX + args[i], currentY + args[i + 1]]);
            coords.push([currentX + args[i + 2], currentY + args[i + 3]]);
            currentX += args[i + 4];
            currentY += args[i + 5];
          } else {
            coords.push([args[i], args[i + 1]]);
            coords.push([args[i + 2], args[i + 3]]);
            currentX = args[i + 4];
            currentY = args[i + 5];
          }
          coords.push([currentX, currentY]);
        }
        break;
      case 'S':
      case 'Q':
        for (let i = 0; i < args.length; i += 4) {
          if (isRelative) {
            coords.push([currentX + args[i], currentY + args[i + 1]]);
            currentX += args[i + 2];
            currentY += args[i + 3];
          } else {
            coords.push([args[i], args[i + 1]]);
            currentX = args[i + 2];
            currentY = args[i + 3];
          }
          coords.push([currentX, currentY]);
        }
        break;
      case 'A':
        for (let i = 0; i < args.length; i += 7) {
          if (isRelative) {
            currentX += args[i + 5];
            currentY += args[i + 6];
          } else {
            currentX = args[i + 5];
            currentY = args[i + 6];
          }
          coords.push([currentX, currentY]);
        }
        break;
    }
  }
  return coords;
}

export function translateSvgPath(d, dx, dy) {
  const regex = /([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g;
  let result = '';
  let match;

  while ((match = regex.exec(d)) !== null) {
    const cmd = match[1];
    const args = match[2].trim().split(/[\s,]+/).filter(s => s).map(Number);
    const isRelative = cmd === cmd.toLowerCase();
    const cmdUpper = cmd.toUpperCase();

    if (isRelative || cmdUpper === 'Z') {
      result += cmd + args.join(' ');
      continue;
    }

    let newArgs = [];
    switch (cmdUpper) {
      case 'M':
      case 'L':
      case 'T':
        for (let i = 0; i < args.length; i += 2) {
          newArgs.push((args[i] + dx), (args[i + 1] + dy));
        }
        break;
      case 'H':
        for (let i = 0; i < args.length; i++) {
          newArgs.push((args[i] + dx));
        }
        break;
      case 'V':
        for (let i = 0; i < args.length; i++) {
          newArgs.push((args[i] + dy));
        }
        break;
      case 'C':
        for (let i = 0; i < args.length; i += 6) {
          newArgs.push(
            (args[i] + dx), (args[i + 1] + dy),
            (args[i + 2] + dx), (args[i + 3] + dy),
            (args[i + 4] + dx), (args[i + 5] + dy)
          );
        }
        break;
      case 'S':
      case 'Q':
        for (let i = 0; i < args.length; i += 4) {
          newArgs.push(
            (args[i] + dx), (args[i + 1] + dy),
            (args[i + 2] + dx), (args[i + 3] + dy)
          );
        }
        break;
      case 'A':
        for (let i = 0; i < args.length; i += 7) {
          newArgs.push(
            args[i], args[i + 1], args[i + 2], args[i + 3], args[i + 4],
            (args[i + 5] + dx), (args[i + 6] + dy)
          );
        }
        break;
      default:
        newArgs = args;
    }
    result += cmd + newArgs.join(' ');
  }
  return result;
}

export function scaleSvgPath(d, oldBox, newBox) {
  const sx = newBox.w / Math.max(0.001, oldBox.w);
  const sy = newBox.h / Math.max(0.001, oldBox.h);
  const tx = (x) => newBox.x + (x - oldBox.x) * sx;
  const ty = (y) => newBox.y + (y - oldBox.y) * sy;

  const regex = /([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g;
  let result = '';
  let match;

  while ((match = regex.exec(d)) !== null) {
    const cmd = match[1];
    const args = match[2].trim().split(/[\s,]+/).filter(s => s).map(Number);
    const isRelative = cmd === cmd.toLowerCase();
    const cmdUpper = cmd.toUpperCase();

    if (cmdUpper === 'Z') {
      result += cmd;
      continue;
    }

    let newArgs = [];
    switch (cmdUpper) {
      case 'M':
      case 'L':
      case 'T':
        for (let i = 0; i < args.length; i += 2) {
          if (isRelative) {
            newArgs.push((args[i] * sx), (args[i + 1] * sy));
          } else {
            newArgs.push(tx(args[i]), ty(args[i + 1]));
          }
        }
        break;
      case 'H':
        for (let i = 0; i < args.length; i++) {
          newArgs.push((isRelative ? args[i] * sx : tx(args[i])));
        }
        break;
      case 'V':
        for (let i = 0; i < args.length; i++) {
          newArgs.push((isRelative ? args[i] * sy : ty(args[i])));
        }
        break;
      case 'C':
        for (let i = 0; i < args.length; i += 6) {
          if (isRelative) {
            newArgs.push(
              (args[i] * sx), (args[i + 1] * sy),
              (args[i + 2] * sx), (args[i + 3] * sy),
              (args[i + 4] * sx), (args[i + 5] * sy)
            );
          } else {
            newArgs.push(
              tx(args[i]), ty(args[i + 1]),
              tx(args[i + 2]), ty(args[i + 3]),
              tx(args[i + 4]), ty(args[i + 5])
            );
          }
        }
        break;
      case 'S':
      case 'Q':
        for (let i = 0; i < args.length; i += 4) {
          if (isRelative) {
            newArgs.push(
              (args[i] * sx), (args[i + 1] * sy),
              (args[i + 2] * sx), (args[i + 3] * sy)
            );
          } else {
            newArgs.push(
              tx(args[i]), ty(args[i + 1]),
              tx(args[i + 2]), ty(args[i + 3])
            );
          }
        }
        break;
      case 'A':
        for (let i = 0; i < args.length; i += 7) {
          newArgs.push(
            (args[i] * sx), (args[i + 1] * sy),
            args[i + 2], args[i + 3], args[i + 4],
            (isRelative ? args[i + 5] * sx : tx(args[i + 5])),
            (isRelative ? args[i + 6] * sy : ty(args[i + 6]))
          );
        }
        break;
      default:
        newArgs = args;
    }
    result += cmd + newArgs.join(' ');
  }
  return result;
}

export function parsePath(d) {
  const commands = [];
  const re = /([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g;
  let match;
  let currentX = 0, currentY = 0;

  while ((match = re.exec(d)) !== null) {
    const cmd = match[1];
    const params = match[2].trim().split(/[,\s]+/).map(Number).filter(n => !isNaN(n));
    const cmdUpper = cmd.toUpperCase();
    const isRelative = cmd === cmd.toLowerCase();

    if (cmdUpper === 'Z') {
      commands.push({ cmd });
      continue;
    }

    if (cmdUpper === 'M' || cmdUpper === 'L' || cmdUpper === 'T') {
      for (let i = 0; i < params.length; i += 2) {
        const x = isRelative ? currentX + params[i] : params[i];
        const y = isRelative ? currentY + params[i + 1] : params[i + 1];
        commands.push({ cmd: cmdUpper, x, y });
        currentX = x;
        currentY = y;
      }
    } else if (cmdUpper === 'H') {
      for (let i = 0; i < params.length; i++) {
        const x = isRelative ? currentX + params[i] : params[i];
        commands.push({ cmd: 'L', x, y: currentY });
        currentX = x;
      }
    } else if (cmdUpper === 'V') {
      for (let i = 0; i < params.length; i++) {
        const y = isRelative ? currentY + params[i] : params[i];
        commands.push({ cmd: 'L', x: currentX, y });
        currentY = y;
      }
    } else if (cmdUpper === 'C') {
      for (let i = 0; i < params.length; i += 6) {
        const x1 = isRelative ? currentX + params[i] : params[i];
        const y1 = isRelative ? currentY + params[i + 1] : params[i + 1];
        const x2 = isRelative ? currentX + params[i + 2] : params[i + 2];
        const y2 = isRelative ? currentY + params[i + 3] : params[i + 3];
        const x = isRelative ? currentX + params[i + 4] : params[i + 4];
        const y = isRelative ? currentY + params[i + 5] : params[i + 5];
        commands.push({ cmd: 'C', x1, y1, x2, y2, x, y });
        currentX = x;
        currentY = y;
      }
    } else if (cmdUpper === 'S') {
      for (let i = 0; i < params.length; i += 4) {
        const x2 = isRelative ? currentX + params[i] : params[i];
        const y2 = isRelative ? currentY + params[i + 1] : params[i + 1];
        const x = isRelative ? currentX + params[i + 2] : params[i + 2];
        const y = isRelative ? currentY + params[i + 3] : params[i + 3];
        commands.push({ cmd: 'S', x2, y2, x, y });
        currentX = x;
        currentY = y;
      }
    } else if (cmdUpper === 'Q') {
      for (let i = 0; i < params.length; i += 4) {
        const x1 = isRelative ? currentX + params[i] : params[i];
        const y1 = isRelative ? currentY + params[i + 1] : params[i + 1];
        const x = isRelative ? currentX + params[i + 2] : params[i + 2];
        const y = isRelative ? currentY + params[i + 3] : params[i + 3];
        commands.push({ cmd: 'Q', x1, y1, x, y });
        currentX = x;
        currentY = y;
      }
    } else if (cmdUpper === 'A') {
      for (let i = 0; i < params.length; i += 7) {
        const rx = params[i];
        const ry = params[i + 1];
        const rotation = params[i + 2];
        const largeArc = params[i + 3];
        const sweep = params[i + 4];
        const x = isRelative ? currentX + params[i + 5] : params[i + 5];
        const y = isRelative ? currentY + params[i + 6] : params[i + 6];
        commands.push({ cmd: 'A', rx, ry, rotation, largeArc, sweep, x, y });
        currentX = x;
        currentY = y;
      }
    }
  }
  return commands;
}

export function serializePath(commands) {
  let d = '';
  for (const c of commands) {
    const cmdUpper = c.cmd.toUpperCase();
    if (cmdUpper === 'Z') {
      d += 'Z ';
    } else if (cmdUpper === 'M' || cmdUpper === 'L' || cmdUpper === 'T') {
      d += c.cmd + ' ' + c.x.toFixed(2) + ' ' + c.y.toFixed(2) + ' ';
    } else if (cmdUpper === 'C') {
      d += 'C ' + c.x1.toFixed(2) + ' ' + c.y1.toFixed(2) + ' ' + c.x2.toFixed(2) + ' ' + c.y2.toFixed(2) + ' ' + c.x.toFixed(2) + ' ' + c.y.toFixed(2) + ' ';
    } else if (cmdUpper === 'S') {
      d += 'S ' + c.x2.toFixed(2) + ' ' + c.y2.toFixed(2) + ' ' + c.x.toFixed(2) + ' ' + c.y.toFixed(2) + ' ';
    } else if (cmdUpper === 'Q') {
      d += 'Q ' + c.x1.toFixed(2) + ' ' + c.y1.toFixed(2) + ' ' + c.x.toFixed(2) + ' ' + c.y.toFixed(2) + ' ';
    } else if (cmdUpper === 'A') {
      d += 'A ' + c.rx.toFixed(2) + ' ' + c.ry.toFixed(2) + ' ' + c.rotation + ' ' + c.largeArc + ' ' + c.sweep + ' ' + c.x.toFixed(2) + ' ' + c.y.toFixed(2) + ' ';
    }
  }
  return d.trim();
}

export function pointsToSvgPath(points, canvasW, canvasH, srcW, srcH) {
  if (points.length < 2) return '';
  
  const scaleX = canvasW / srcW;
  const scaleY = canvasH / srcH;
  
  let d = `M ${(points[0][0] * scaleX).toFixed(2)} ${(points[0][1] * scaleY).toFixed(2)}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${(points[i][0] * scaleX).toFixed(2)} ${(points[i][1] * scaleY).toFixed(2)}`;
  }
  d += ' Z';
  return d;
}

export function approximatePathToPoints(pathEl, baseSamples = 500) {
  try {
    const total = pathEl.getTotalLength();
    if (!total || !isFinite(total)) return [];

    const samples = Math.max(baseSamples, Math.min(2000, Math.ceil(total / 2)));
    const step = total / samples;
    const out = [];

    for (let i = 0; i <= samples; i++) {
      const p = pathEl.getPointAtLength(Math.min(total, i * step));
      out.push([p.x, p.y]);
    }

    return simplifyPath(out, 0.5);
  } catch (_) {
    return [];
  }
}

export function mirrorSvgPathHorizontal(d, centerX) {
  const commands = parsePath(d);
  const mirrored = commands.map(c => {
    const newCmd = { ...c };
    if (newCmd.x !== undefined) newCmd.x = centerX + (centerX - newCmd.x);
    if (newCmd.x1 !== undefined) newCmd.x1 = centerX + (centerX - newCmd.x1);
    if (newCmd.x2 !== undefined) newCmd.x2 = centerX + (centerX - newCmd.x2);
    if (c.cmd === 'A' && newCmd.sweep !== undefined) {
      newCmd.sweep = newCmd.sweep === 0 ? 1 : 0;
    }
    return newCmd;
  });
  return serializePath(mirrored);
}

export function mirrorSvgPathVertical(d, centerY) {
  const commands = parsePath(d);
  const mirrored = commands.map(c => {
    const newCmd = { ...c };
    if (newCmd.y !== undefined) newCmd.y = centerY + (centerY - newCmd.y);
    if (newCmd.y1 !== undefined) newCmd.y1 = centerY + (centerY - newCmd.y1);
    if (newCmd.y2 !== undefined) newCmd.y2 = centerY + (centerY - newCmd.y2);
    if (c.cmd === 'A' && newCmd.sweep !== undefined) {
      newCmd.sweep = newCmd.sweep === 0 ? 1 : 0;
    }
    return newCmd;
  });
  return serializePath(mirrored);
}

export function splitPathIntoSubpaths(d) {
  if (!d || typeof d !== 'string') return [];

  const subpaths = [];
  const regex = /M[^M]*/gi;
  let match;
  
  while ((match = regex.exec(d)) !== null) {
    const subpath = match[0].trim();
    if (subpath) {
      subpaths.push(subpath);
    }
  }
  
  return subpaths;
}

export function verifyPathClosed(d) {
  if (!d || typeof d !== 'string') return { isClosed: false, hasPath: false };
  
  const hasPath = d.trim().length > 0;
  const commands = parsePath(d);
  const hasZ = commands.some(c => c.cmd.toUpperCase() === 'Z');
  
  return {
    isClosed: hasZ,
    hasPath,
    commandCount: commands.length,
  };
}

export function getPathCenter(d) {
  const coords = extractPathCoordinates(d);
  if (coords.length === 0) return null;
  
  let sumX = 0, sumY = 0;
  for (const [x, y] of coords) {
    sumX += x;
    sumY += y;
  }
  
  return {
    x: sumX / coords.length,
    y: sumY / coords.length,
  };
}

export function generateInsetRect(x, y, width, height, insetAmount) {
  const newX = x + insetAmount;
  const newY = y + insetAmount;
  const newWidth = Math.max(1, width - 2 * insetAmount);
  const newHeight = Math.max(1, height - 2 * insetAmount);
  
  return {
    x: newX,
    y: newY,
    width: newWidth,
    height: newHeight,
  };
}

export function generateInsetPath(d, insetAmount) {
  const coords = extractPathCoordinates(d);
  if (coords.length < 3) return d;
  
  const center = getPathCenter(d);
  if (!center) return d;
  
  const commands = parsePath(d);
  const insetCommands = commands.map(c => {
    const newCmd = { ...c };
    
    if (newCmd.x !== undefined && newCmd.y !== undefined) {
      const dx = center.x - newCmd.x;
      const dy = center.y - newCmd.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        const ratio = Math.min(insetAmount / dist, 0.9);
        newCmd.x = newCmd.x + dx * ratio;
        newCmd.y = newCmd.y + dy * ratio;
      }
    }
    
    if (newCmd.x1 !== undefined && newCmd.y1 !== undefined) {
      const dx = center.x - newCmd.x1;
      const dy = center.y - newCmd.y1;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        const ratio = Math.min(insetAmount / dist, 0.9);
        newCmd.x1 = newCmd.x1 + dx * ratio;
        newCmd.y1 = newCmd.y1 + dy * ratio;
      }
    }
    
    if (newCmd.x2 !== undefined && newCmd.y2 !== undefined) {
      const dx = center.x - newCmd.x2;
      const dy = center.y - newCmd.y2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        const ratio = Math.min(insetAmount / dist, 0.9);
        newCmd.x2 = newCmd.x2 + dx * ratio;
        newCmd.y2 = newCmd.y2 + dy * ratio;
      }
    }
    
    return newCmd;
  });
  
  return serializePath(insetCommands);
}

export function roundPolygonCorners(points, radius) {
  if (!points || points.length < 3 || radius <= 0) {
    if (!points || points.length === 0) return '';
    return 'M ' + points.map(p => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' L ') + ' Z';
  }

  const n = points.length;
  let d = '';

  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];

    const v1 = [prev[0] - curr[0], prev[1] - curr[1]];
    const v2 = [next[0] - curr[0], next[1] - curr[1]];

    const len1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
    const len2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]);

    if (len1 === 0 || len2 === 0) continue;

    const u1 = [v1[0] / len1, v1[1] / len1];
    const u2 = [v2[0] / len2, v2[1] / len2];

    const maxRadius = Math.min(len1 / 2, len2 / 2, radius);

    const p1 = [curr[0] + u1[0] * maxRadius, curr[1] + u1[1] * maxRadius];
    const p2 = [curr[0] + u2[0] * maxRadius, curr[1] + u2[1] * maxRadius];

    if (i === 0) {
      d += `M ${p1[0].toFixed(2)},${p1[1].toFixed(2)} `;
    } else {
      d += `L ${p1[0].toFixed(2)},${p1[1].toFixed(2)} `;
    }

    d += `Q ${curr[0].toFixed(2)},${curr[1].toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)} `;
  }

  d += 'Z';
  return d;
}

export function roundRectCorners(x, y, width, height, radius) {
  if (radius <= 0) {
    return `M ${x},${y} L ${x + width},${y} L ${x + width},${y + height} L ${x},${y + height} Z`;
  }

  const r = Math.min(radius, width / 2, height / 2);

  return `M ${x + r},${y} ` +
    `L ${x + width - r},${y} ` +
    `Q ${x + width},${y} ${x + width},${y + r} ` +
    `L ${x + width},${y + height - r} ` +
    `Q ${x + width},${y + height} ${x + width - r},${y + height} ` +
    `L ${x + r},${y + height} ` +
    `Q ${x},${y + height} ${x},${y + height - r} ` +
    `L ${x},${y + r} ` +
    `Q ${x},${y} ${x + r},${y} Z`;
}

export function roundPathCorners(d, radius) {
  if (!d || radius <= 0) return d;

  const commands = parsePath(d);
  if (commands.length < 3) return d;

  const points = [];
  let isClosed = false;

  for (const cmd of commands) {
    if (cmd.cmd === 'M' || cmd.cmd === 'L') {
      points.push([cmd.x, cmd.y]);
    } else if (cmd.cmd === 'Z') {
      isClosed = true;
    }
  }

  if (points.length < 3) return d;

  if (isClosed && points.length > 1) {
    const first = points[0];
    const last = points[points.length - 1];
    if (Math.abs(first[0] - last[0]) < 0.01 && Math.abs(first[1] - last[1]) < 0.01) {
      points.pop();
    }
  }

  let roundedPath = roundPolygonCorners(points, radius);

  if (!isClosed) {
    roundedPath = roundedPath.replace(/Z\s*$/, '');
  }

  return roundedPath;
}

export function applyCornerRounding(obj, radius) {
  if (!obj || radius <= 0) return obj;

  const result = { ...obj };

  switch (obj.type) {
    case 'rect':
      result.type = 'svgpath';
      result.d = roundRectCorners(obj.x, obj.y, obj.width, obj.height, radius);
      result.cornerRadius = radius;
      delete result.x;
      delete result.y;
      delete result.width;
      delete result.height;
      break;

    case 'polygon':
      if (obj.points && obj.points.length >= 3) {
        result.type = 'svgpath';
        result.d = roundPolygonCorners(obj.points, radius);
        result.cornerRadius = radius;
        result.originalPoints = obj.points;
        delete result.points;
      }
      break;

    case 'svgpath':
    case 'path':
      if (obj.d) {
        result.d = roundPathCorners(obj.d, radius);
        result.cornerRadius = radius;
      }
      break;

    default:
      break;
  }

  return result;
}

export function mergeVectorsPreserveOuter(path1D, path2D, centerX, centerY, innerRadius) {
  const coords1 = extractPathCoordinates(path1D);
  const coords2 = extractPathCoordinates(path2D);

  const filterOuterPoints = (coords) => {
    return coords.filter(([x, y]) => {
      const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      return dist >= innerRadius;
    });
  };
  
  const outer1 = filterOuterPoints(coords1);
  const outer2 = filterOuterPoints(coords2);
  const allOuter = [...outer1, ...outer2];
  if (allOuter.length < 2) return path1D;

  const sortedPoints = allOuter.sort((a, b) => {
    const angleA = Math.atan2(a[1] - centerY, a[0] - centerX);
    const angleB = Math.atan2(b[1] - centerY, b[0] - centerX);
    return angleA - angleB;
  });

  let d = `M ${sortedPoints[0][0].toFixed(2)},${sortedPoints[0][1].toFixed(2)}`;
  for (let i = 1; i < sortedPoints.length; i++) {
    d += ` L ${sortedPoints[i][0].toFixed(2)},${sortedPoints[i][1].toFixed(2)}`;
  }
  d += ' Z';
  
  return d;
}

export function splitByCircleBoundary(pathD, centerX, centerY, radius) {
  const commands = parsePath(pathD);
  const innerCommands = [];
  const outerCommands = [];
  
  let lastPoint = null;
  let innerPath = [];
  let outerPath = [];
  
  const isInside = (x, y) => {
    const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
    return dist < radius;
  };

  const findIntersection = (x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const fx = x1 - centerX;
    const fy = y1 - centerY;
    
    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - radius * radius;
    
    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return null;
    
    const sqrtD = Math.sqrt(discriminant);
    const t1 = (-b - sqrtD) / (2 * a);
    const t2 = (-b + sqrtD) / (2 * a);

    for (const t of [t1, t2]) {
      if (t >= 0 && t <= 1) {
        return [x1 + t * dx, y1 + t * dy];
      }
    }
    return null;
  };
  
  for (const cmd of commands) {
    if (cmd.cmd === 'Z') {
      if (innerPath.length > 0) {
        innerCommands.push([...innerPath, { cmd: 'Z' }]);
        innerPath = [];
      }
      if (outerPath.length > 0) {
        outerCommands.push([...outerPath, { cmd: 'Z' }]);
        outerPath = [];
      }
      continue;
    }
    
    if (cmd.cmd === 'M' || cmd.cmd === 'L') {
      const currInside = isInside(cmd.x, cmd.y);
      
      if (lastPoint) {
        const lastInside = isInside(lastPoint[0], lastPoint[1]);
        if (lastInside !== currInside) {
          const intersection = findIntersection(lastPoint[0], lastPoint[1], cmd.x, cmd.y);
          if (intersection) {
            const [ix, iy] = intersection;
            
            if (lastInside) {
              innerPath.push({ cmd: 'L', x: ix, y: iy });
              if (outerPath.length === 0) {
                outerPath.push({ cmd: 'M', x: ix, y: iy });
              } else {
                outerPath.push({ cmd: 'L', x: ix, y: iy });
              }
            } else {
              outerPath.push({ cmd: 'L', x: ix, y: iy });
              if (innerPath.length === 0) {
                innerPath.push({ cmd: 'M', x: ix, y: iy });
              } else {
                innerPath.push({ cmd: 'L', x: ix, y: iy });
              }
            }
          }
        }
      }

      if (currInside) {
        if (innerPath.length === 0) {
          innerPath.push({ cmd: 'M', x: cmd.x, y: cmd.y });
        } else {
          innerPath.push({ cmd: 'L', x: cmd.x, y: cmd.y });
        }
      } else {
        if (outerPath.length === 0) {
          outerPath.push({ cmd: 'M', x: cmd.x, y: cmd.y });
        } else {
          outerPath.push({ cmd: 'L', x: cmd.x, y: cmd.y });
        }
      }
      
      lastPoint = [cmd.x, cmd.y];
    } else {
      const endX = cmd.x;
      const endY = cmd.y;
      const currInside = isInside(endX, endY);
      
      if (currInside) {
        if (innerPath.length === 0) {
          innerPath.push({ cmd: 'M', x: endX, y: endY });
        } else {
          innerPath.push({ ...cmd });
        }
      } else {
        if (outerPath.length === 0) {
          outerPath.push({ cmd: 'M', x: endX, y: endY });
        } else {
          outerPath.push({ ...cmd });
        }
      }
      
      lastPoint = [endX, endY];
    }
  }
  if (innerPath.length > 0) innerCommands.push(innerPath);
  if (outerPath.length > 0) outerCommands.push(outerPath);
  
  return {
    inner: innerCommands.map(cmds => serializePath(cmds)).filter(p => p.length > 0),
    outer: outerCommands.map(cmds => serializePath(cmds)).filter(p => p.length > 0),
  };
}
