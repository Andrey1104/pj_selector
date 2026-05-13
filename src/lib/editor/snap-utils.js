/**
 * Snap utilities for SVG Editor
 * Provides snapping to center, circle edges, and grid
 */

/**
 * Calculate all snap points based on canvas and glass configuration
 */
export function calculateSnapPoints(canvasMm, glassConfig, gridSize = 10) {
  const center = canvasMm / 2;
  const innerRadiusMm = glassConfig.inner / 2;
  const outerRadiusMm = glassConfig.outer / 2;
  
  return {
    center: { x: center, y: center },
    innerRadius: innerRadiusMm,
    outerRadius: outerRadiusMm,
    gridSize,
    canvasMm,
  };
}

/**
 * Generate grid lines for snapping
 */
export function generateGridLines(canvasMm, gridSize) {
  const lines = [];
  for (let i = 0; i <= canvasMm; i += gridSize) {
    lines.push({ type: 'vertical', position: i });
    lines.push({ type: 'horizontal', position: i });
  }
  return lines;
}

/**
 * Find the nearest snap point for a given position
 * Returns snap target and guide lines to display
 */
export function findSnapTarget(x, y, objectBBox, snapPoints, threshold = 3, pxPerMm = 1) {
  const thresholdMm = threshold / pxPerMm;
  const result = {
    snappedX: x,
    snappedY: y,
    guides: [],
    snapped: false,
    snapType: null,
  };

  const { center, innerRadius, outerRadius, gridSize, canvasMm } = snapPoints;
  
  // Object dimensions in mm
  const objCenterX = x;
  const objCenterY = y;
  const objWidth = objectBBox ? objectBBox.w / pxPerMm : 0;
  const objHeight = objectBBox ? objectBBox.h / pxPerMm : 0;

  // 1. Check snap to center
  const distToCenter = Math.sqrt(
    Math.pow(objCenterX - center.x, 2) + Math.pow(objCenterY - center.y, 2)
  );
  
  if (distToCenter < thresholdMm) {
    result.snappedX = center.x;
    result.snappedY = center.y;
    result.snapped = true;
    result.snapType = 'center';
    result.guides.push({
      type: 'crosshair',
      x: center.x,
      y: center.y,
    });
    return result;
  }

  // 2. Check snap to inner circle edge (symbol boundary)
  const distFromCenter = Math.sqrt(
    Math.pow(objCenterX - center.x, 2) + Math.pow(objCenterY - center.y, 2)
  );
  
  // Check if object edge could snap to inner circle
  if (objectBBox) {
    const objRadius = Math.max(objWidth, objHeight) / 2;
    const desiredDist = innerRadius - objRadius; // Distance from center where object edge touches inner circle
    
    if (Math.abs(distFromCenter - desiredDist) < thresholdMm && desiredDist > 0) {
      const angle = Math.atan2(objCenterY - center.y, objCenterX - center.x);
      result.snappedX = center.x + desiredDist * Math.cos(angle);
      result.snappedY = center.y + desiredDist * Math.sin(angle);
      result.snapped = true;
      result.snapType = 'innerCircle';
      result.guides.push({
        type: 'circle',
        cx: center.x,
        cy: center.y,
        r: innerRadius,
        label: 'inner',
      });
      return result;
    }
  }

  // 3. Check snap to outer circle edge (glass boundary)
  if (objectBBox) {
    const objRadius = Math.max(objWidth, objHeight) / 2;
    const desiredDist = outerRadius - objRadius;
    
    if (Math.abs(distFromCenter - desiredDist) < thresholdMm && desiredDist > 0) {
      const angle = Math.atan2(objCenterY - center.y, objCenterX - center.x);
      result.snappedX = center.x + desiredDist * Math.cos(angle);
      result.snappedY = center.y + desiredDist * Math.sin(angle);
      result.snapped = true;
      result.snapType = 'outerCircle';
      result.guides.push({
        type: 'circle',
        cx: center.x,
        cy: center.y,
        r: outerRadius,
        label: 'outer',
      });
      return result;
    }
  }

  // 4. Check snap to grid lines
  const nearestGridX = Math.round(objCenterX / gridSize) * gridSize;
  const nearestGridY = Math.round(objCenterY / gridSize) * gridSize;
  
  const snapToGridX = Math.abs(objCenterX - nearestGridX) < thresholdMm;
  const snapToGridY = Math.abs(objCenterY - nearestGridY) < thresholdMm;
  
  if (snapToGridX || snapToGridY) {
    if (snapToGridX) {
      result.snappedX = nearestGridX;
      result.guides.push({
        type: 'verticalLine',
        x: nearestGridX,
        y1: 0,
        y2: canvasMm,
      });
    }
    if (snapToGridY) {
      result.snappedY = nearestGridY;
      result.guides.push({
        type: 'horizontalLine',
        x1: 0,
        x2: canvasMm,
        y: nearestGridY,
      });
    }
    if (snapToGridX || snapToGridY) {
      result.snapped = true;
      result.snapType = 'grid';
    }
  }

  // 5. Check snap to center lines (horizontal and vertical through center)
  if (Math.abs(objCenterX - center.x) < thresholdMm) {
    result.snappedX = center.x;
    result.snapped = true;
    result.snapType = result.snapType || 'centerLine';
    result.guides.push({
      type: 'verticalLine',
      x: center.x,
      y1: 0,
      y2: canvasMm,
      isCenterLine: true,
    });
  }
  
  if (Math.abs(objCenterY - center.y) < thresholdMm) {
    result.snappedY = center.y;
    result.snapped = true;
    result.snapType = result.snapType || 'centerLine';
    result.guides.push({
      type: 'horizontalLine',
      x1: 0,
      x2: canvasMm,
      y: center.y,
      isCenterLine: true,
    });
  }

  return result;
}

/**
 * Snap object to exact center of canvas
 */
export function snapToCenter(objectBBox, canvasMm, pxPerMm) {
  const center = canvasMm / 2;
  const objWidthMm = objectBBox.w / pxPerMm;
  const objHeightMm = objectBBox.h / pxPerMm;
  
  return {
    x: (center - objWidthMm / 2) * pxPerMm,
    y: (center - objHeightMm / 2) * pxPerMm,
    centerX: center * pxPerMm,
    centerY: center * pxPerMm,
  };
}

/**
 * Snap object to inner circle edge (align object edge to symbol boundary)
 */
export function snapToInnerCircle(objectBBox, canvasMm, innerRadius, angle, pxPerMm) {
  const center = canvasMm / 2;
  const objWidthMm = objectBBox.w / pxPerMm;
  const objHeightMm = objectBBox.h / pxPerMm;
  const objRadius = Math.max(objWidthMm, objHeightMm) / 2;
  
  // Position object center so its edge touches the inner circle
  const distFromCenter = innerRadius - objRadius;
  
  if (distFromCenter <= 0) {
    // Object is too large, center it instead
    return snapToCenter(objectBBox, canvasMm, pxPerMm);
  }
  
  const centerX = center + distFromCenter * Math.cos(angle);
  const centerY = center + distFromCenter * Math.sin(angle);
  
  return {
    x: (centerX - objWidthMm / 2) * pxPerMm,
    y: (centerY - objHeightMm / 2) * pxPerMm,
    centerX: centerX * pxPerMm,
    centerY: centerY * pxPerMm,
  };
}

/**
 * Snap object to outer circle edge (align object edge to glass boundary)
 */
export function snapToOuterCircle(objectBBox, canvasMm, outerRadius, angle, pxPerMm) {
  const center = canvasMm / 2;
  const objWidthMm = objectBBox.w / pxPerMm;
  const objHeightMm = objectBBox.h / pxPerMm;
  const objRadius = Math.max(objWidthMm, objHeightMm) / 2;
  
  const distFromCenter = outerRadius - objRadius;
  
  if (distFromCenter <= 0) {
    return snapToCenter(objectBBox, canvasMm, pxPerMm);
  }
  
  const centerX = center + distFromCenter * Math.cos(angle);
  const centerY = center + distFromCenter * Math.sin(angle);
  
  return {
    x: (centerX - objWidthMm / 2) * pxPerMm,
    y: (centerY - objHeightMm / 2) * pxPerMm,
    centerX: centerX * pxPerMm,
    centerY: centerY * pxPerMm,
  };
}

/**
 * Calculate snap alignment positions for an object
 * Returns all possible snap positions the user can choose from
 */
export function getSnapAlignmentOptions(objectBBox, canvasMm, glassConfig, pxPerMm) {
  const center = canvasMm / 2;
  const innerRadiusMm = glassConfig.inner / 2;
  const outerRadiusMm = glassConfig.outer / 2;
  
  const options = [];
  
  // Center snap
  options.push({
    id: 'center',
    label: 'Center',
    ...snapToCenter(objectBBox, canvasMm, pxPerMm),
  });
  
  // Cardinal direction snaps to inner circle
  const cardinalAngles = [
    { angle: -Math.PI / 2, label: 'Top' },
    { angle: Math.PI / 2, label: 'Bottom' },
    { angle: Math.PI, label: 'Left' },
    { angle: 0, label: 'Right' },
  ];
  
  cardinalAngles.forEach(({ angle, label }) => {
    options.push({
      id: `inner-${label.toLowerCase()}`,
      label: `Inner ${label}`,
      ...snapToInnerCircle(objectBBox, canvasMm, innerRadiusMm, angle, pxPerMm),
    });
  });
  
  cardinalAngles.forEach(({ angle, label }) => {
    options.push({
      id: `outer-${label.toLowerCase()}`,
      label: `Outer ${label}`,
      ...snapToOuterCircle(objectBBox, canvasMm, outerRadiusMm, angle, pxPerMm),
    });
  });
  
  return options;
}
