/**
 * ext-dimensions.js
 * Displays element dimensions in millimeters near selected elements
 */

const name = 'dimensions';

// Conversion factor: 1 inch = 25.4mm, SVG default is 96 DPI
const PX_TO_MM = 25.4 / 96;

const extDimensions = {
  name,
  async init() {
    const svgEditor = this;
    const { svgCanvas } = svgEditor;
    const { $id, NS } = svgCanvas;
    
    const svgdoc = $id('svgcanvas').ownerDocument;
    let showDimensions = true;
    let dimensionLabels = [];
    
    // Create container for dimension labels
    const dimensionContainer = document.createElement('div');
    dimensionContainer.id = 'dimension-labels-container';
    dimensionContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 999;
    `;
    
    // Helper function to convert px to mm
    const pxToMm = (px) => {
      return (px * PX_TO_MM).toFixed(2);
    };
    
    // Helper to get element bounding box in canvas coordinates
    const getElementBBox = (elem) => {
      if (!elem) return null;
      try {
        const bbox = elem.getBBox();
        return bbox;
      } catch (e) {
        return null;
      }
    };
    
    // Create dimension label element
    const createDimensionLabel = (text, x, y, type = 'width') => {
      const label = document.createElement('div');
      label.className = 'dimension-label';
      label.style.cssText = `
        position: absolute;
        background: #1a1a2e;
        color: #fff;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-weight: 500;
        white-space: nowrap;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        pointer-events: none;
        z-index: 1001;
        border: 1px solid #4a4a6a;
      `;
      label.textContent = text;
      label.style.left = x + 'px';
      label.style.top = y + 'px';
      label.dataset.type = type;
      return label;
    };
    
    // Clear all dimension labels
    const clearDimensionLabels = () => {
      dimensionLabels.forEach(label => {
        if (label.parentNode) {
          label.parentNode.removeChild(label);
        }
      });
      dimensionLabels = [];
    };
    
    // Update dimension display for selected elements
    const updateDimensions = () => {
      clearDimensionLabels();
      
      if (!showDimensions) return;
      
      const selectedElements = svgCanvas.getSelectedElements();
      if (!selectedElements || selectedElements.length === 0) return;
      
      const zoom = svgCanvas.getZoom();
      const workarea = $id('workarea');
      if (!workarea) return;
      
      const svgRoot = svgCanvas.getSvgRoot();
      if (!svgRoot) return;
      
      // Get canvas offset
      const canvasContainer = $id('svgcanvas');
      if (!canvasContainer) return;
      
      const canvasRect = canvasContainer.getBoundingClientRect();
      const workareaRect = workarea.getBoundingClientRect();
      
      selectedElements.forEach((elem, index) => {
        if (!elem) return;
        
        const bbox = getElementBBox(elem);
        if (!bbox) return;
        
        // Get dimensions in mm
        const widthMm = pxToMm(bbox.width);
        const heightMm = pxToMm(bbox.height);
        
        // Calculate position relative to workarea
        const scrollLeft = workarea.scrollLeft;
        const scrollTop = workarea.scrollTop;
        
        // Transform coordinates with zoom
        const x = bbox.x * zoom;
        const y = bbox.y * zoom;
        const width = bbox.width * zoom;
        const height = bbox.height * zoom;
        
        // Get the content container offset
        const contentOffset = {
          x: canvasRect.left - workareaRect.left + scrollLeft,
          y: canvasRect.top - workareaRect.top + scrollTop
        };
        
        // Width label (below the element)
        const widthLabel = createDimensionLabel(
          `${widthMm} mm`,
          x + contentOffset.x + width / 2 - 25,
          y + contentOffset.y + height + 8,
          'width'
        );
        dimensionContainer.appendChild(widthLabel);
        dimensionLabels.push(widthLabel);
        
        // Height label (to the right of the element)
        const heightLabel = createDimensionLabel(
          `${heightMm} mm`,
          x + contentOffset.x + width + 8,
          y + contentOffset.y + height / 2 - 10,
          'height'
        );
        dimensionContainer.appendChild(heightLabel);
        dimensionLabels.push(heightLabel);
        
        // Combined label (at top-right corner) for multiple elements
        if (selectedElements.filter(e => e).length > 1) {
          const combinedLabel = createDimensionLabel(
            `#${index + 1}: ${widthMm} x ${heightMm} mm`,
            x + contentOffset.x + width + 8,
            y + contentOffset.y - 25,
            'combined'
          );
          combinedLabel.style.background = '#2d2d44';
          dimensionContainer.appendChild(combinedLabel);
          dimensionLabels.push(combinedLabel);
        }
      });
    };
    
    // Toggle dimensions display
    const toggleDimensions = () => {
      showDimensions = !showDimensions;
      if (!showDimensions) {
        clearDimensionLabels();
      } else {
        updateDimensions();
      }
      const btn = $id('view_dimensions');
      if (btn) {
        btn.pressed = showDimensions;
      }
    };
    
    return {
      name: 'Dimension Display',
      callback() {
        // Add dimension container to workarea
        const workarea = $id('workarea');
        if (workarea) {
          workarea.style.position = 'relative';
          workarea.appendChild(dimensionContainer);
        }
        
        // Add toggle button
        const buttonTemplate = document.createElement('template');
        buttonTemplate.innerHTML = `
          <se-button id="view_dimensions" title="Toggle Dimension Labels (mm)" src="dimensions.svg" pressed="true"></se-button>
        `;
        const editorPanel = $id('editor_panel');
        if (editorPanel) {
          editorPanel.append(buttonTemplate.content.cloneNode(true));
          const btn = $id('view_dimensions');
          if (btn) {
            btn.addEventListener('click', toggleDimensions);
          }
        }
      },
      
      // Called when selection changes
      selectedChanged(opts) {
        updateDimensions();
      },
      
      // Called when elements are transformed
      elementTransition(opts) {
        updateDimensions();
      },
      
      // Called when element is changed
      elementChanged(opts) {
        updateDimensions();
      },
      
      // Called when zoom changes
      zoomChanged(zoom) {
        updateDimensions();
      },
      
      // Called on mouse up to update after resize/move
      mouseUp(opts) {
        setTimeout(updateDimensions, 50);
      },
      
      // Called when workarea is resized
      workareaResized() {
        updateDimensions();
      }
    };
  }
};

export default extDimensions;
