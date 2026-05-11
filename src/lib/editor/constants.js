export const TYPES = ['rect', 'ellipse', 'line', 'polygon', 'path', 'svgpath', 'text', 'image', 'rectset'];
export const CANVAS_MM = 80;
export const CANVAS_W = 640;
export const CANVAS_H = 640;
export const HISTORY_LIMIT = 50;
export const PX_PER_MM = CANVAS_W / CANVAS_MM;
export const DEFAULT_COLORS = ['#EF4444', '#F59E0B', '#FACC15', '#10B981', '#3B82F6', '#8B5CF6', '#FFFFFF', '#000000'];
export const TOOLS = [
  { id: 'select', label: 'Select (V)', key: 'v', testId: 'tool-select' },
  { id: 'brush', label: 'Brush (B)', key: 'b', testId: 'tool-brush' },
  { id: 'rect', label: 'Rectangle (R)', key: 'r', testId: 'tool-rect' },
  { id: 'square', label: 'Square (S)', key: 's', testId: 'tool-square' },
  { id: 'ellipse', label: 'Ellipse (E)', key: 'e', testId: 'tool-ellipse' },
  { id: 'circle', label: 'Circle (C)', key: 'c', testId: 'tool-circle' },
  { id: 'line', label: 'Line (L)', key: 'l', testId: 'tool-line' },
  { id: 'polygon', label: 'Polygon (P)', key: 'p', testId: 'tool-polygon' },
  { id: 'triangle', label: 'Triangle (G)', key: 'g', testId: 'tool-triangle' },
  { id: 'octagon', label: 'Octagon (O)', key: 'o', testId: 'tool-octagon' },
  { id: 'text', label: 'Text (T)', key: 't', testId: 'tool-text' },
];

