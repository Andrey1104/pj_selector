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

// Mirror SVG path horizontally around a center X coordinate
export function mirrorSvgPathHorizontal(d, centerX) {
  const commands = parsePath(d);
  const mirrored = commands.map(c => {
    const newCmd = { ...c };
    if (newCmd.x !== undefined) newCmd.x = centerX + (centerX - newCmd.x);
    if (newCmd.x1 !== undefined) newCmd.x1 = centerX + (centerX - newCmd.x1);
    if (newCmd.x2 !== undefined) newCmd.x2 = centerX + (centerX - newCmd.x2);
    // For arc commands, flip the sweep flag
    if (c.cmd === 'A' && newCmd.sweep !== undefined) {
      newCmd.sweep = newCmd.sweep === 0 ? 1 : 0;
    }
    return newCmd;
  });
  return serializePath(mirrored);
}

// Mirror SVG path vertically around a center Y coordinate
export function mirrorSvgPathVertical(d, centerY) {
  const commands = parsePath(d);
  const mirrored = commands.map(c => {
    const newCmd = { ...c };
    if (newCmd.y !== undefined) newCmd.y = centerY + (centerY - newCmd.y);
    if (newCmd.y1 !== undefined) newCmd.y1 = centerY + (centerY - newCmd.y1);
    if (newCmd.y2 !== undefined) newCmd.y2 = centerY + (centerY - newCmd.y2);
    // For arc commands, flip the sweep flag
    if (c.cmd === 'A' && newCmd.sweep !== undefined) {
      newCmd.sweep = newCmd.sweep === 0 ? 1 : 0;
    }
    return newCmd;
  });
  return serializePath(mirrored);
}

// Split a compound path into separate subpaths
export function splitPathIntoSubpaths(d) {
  if (!d || typeof d !== 'string') return [];
  
  // Split on M commands while keeping the M
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

// Verify if a path is closed (has Z command)
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

// Calculate the center point of a path
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

// Generate an inset (inner) path for rectangles
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

// Generate an inset path by offsetting all coordinates toward center
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
