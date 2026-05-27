/**
 * ext-crosshair.js
 * Adds vertical and horizontal dashed crosshair lines that follow the mouse cursor
 */

const name = 'crosshair';

const extCrosshair = {
  name,
  async init() {
    const svgEditor = this;
    const { svgCanvas } = svgEditor;
    const { $id, NS } = svgCanvas;
    
    const svgdoc = $id('svgcanvas').ownerDocument;
    const canvasContainer = $id('svgcanvas');
    let showCrosshair = true;
    
    // Create crosshair SVG group
    const crosshairGroup = svgdoc.createElementNS(NS.SVG, 'svg');
    crosshairGroup.setAttribute('id', 'crosshairGuides');
    crosshairGroup.setAttribute('width', '100%');
    crosshairGroup.setAttribute('height', '100%');
    crosshairGroup.setAttribute('x', '0');
    crosshairGroup.setAttribute('y', '0');
    crosshairGroup.setAttribute('overflow', 'visible');
    crosshairGroup.style.position = 'absolute';
    crosshairGroup.style.top = '0';
    crosshairGroup.style.left = '0';
    crosshairGroup.style.pointerEvents = 'none';
    crosshairGroup.style.zIndex = '1000';
    crosshairGroup.style.display = 'block';
    
    // Create vertical line
    const verticalLine = svgdoc.createElementNS(NS.SVG, 'line');
    verticalLine.setAttribute('id', 'crosshair-vertical');
    verticalLine.setAttribute('x1', '0');
    verticalLine.setAttribute('y1', '0');
    verticalLine.setAttribute('x2', '0');
    verticalLine.setAttribute('y2', '100%');
    verticalLine.setAttribute('stroke', '#ff5722');
    verticalLine.setAttribute('stroke-width', '1');
    verticalLine.setAttribute('stroke-dasharray', '5,5');
    verticalLine.setAttribute('opacity', '0.8');
    verticalLine.style.pointerEvents = 'none';
    
    // Create horizontal line
    const horizontalLine = svgdoc.createElementNS(NS.SVG, 'line');
    horizontalLine.setAttribute('id', 'crosshair-horizontal');
    horizontalLine.setAttribute('x1', '0');
    horizontalLine.setAttribute('y1', '0');
    horizontalLine.setAttribute('x2', '100%');
    horizontalLine.setAttribute('y2', '0');
    horizontalLine.setAttribute('stroke', '#ff5722');
    horizontalLine.setAttribute('stroke-width', '1');
    horizontalLine.setAttribute('stroke-dasharray', '5,5');
    horizontalLine.setAttribute('opacity', '0.8');
    horizontalLine.style.pointerEvents = 'none';
    
    crosshairGroup.appendChild(verticalLine);
    crosshairGroup.appendChild(horizontalLine);
    
    // Add to canvas container
    const workarea = $id('workarea') || canvasContainer.parentElement;
    if (workarea) {
      workarea.style.position = 'relative';
      workarea.appendChild(crosshairGroup);
    }
    
    // Mouse move handler
    const updateCrosshair = (e) => {
      if (!showCrosshair) return;
      
      const workarea = $id('workarea');
      if (!workarea) return;
      
      const rect = workarea.getBoundingClientRect();
      const x = e.clientX - rect.left + workarea.scrollLeft;
      const y = e.clientY - rect.top + workarea.scrollTop;
      
      // Update vertical line position
      verticalLine.setAttribute('x1', x);
      verticalLine.setAttribute('x2', x);
      verticalLine.setAttribute('y1', '0');
      verticalLine.setAttribute('y2', rect.height + workarea.scrollHeight);
      
      // Update horizontal line position
      horizontalLine.setAttribute('x1', '0');
      horizontalLine.setAttribute('x2', rect.width + workarea.scrollWidth);
      horizontalLine.setAttribute('y1', y);
      horizontalLine.setAttribute('y2', y);
    };
    
    // Hide crosshair when mouse leaves
    const hideCrosshair = () => {
      verticalLine.setAttribute('opacity', '0');
      horizontalLine.setAttribute('opacity', '0');
    };
    
    // Show crosshair when mouse enters
    const showCrosshairLines = () => {
      if (showCrosshair) {
        verticalLine.setAttribute('opacity', '0.8');
        horizontalLine.setAttribute('opacity', '0.8');
      }
    };
    
    // Toggle function
    const toggleCrosshair = () => {
      showCrosshair = !showCrosshair;
      crosshairGroup.style.display = showCrosshair ? 'block' : 'none';
      const btn = $id('view_crosshair');
      if (btn) {
        btn.pressed = showCrosshair;
      }
    };
    
    // Add event listeners
    const workArea = $id('workarea');
    if (workArea) {
      workArea.addEventListener('mousemove', updateCrosshair);
      workArea.addEventListener('mouseleave', hideCrosshair);
      workArea.addEventListener('mouseenter', showCrosshairLines);
    }
    
    return {
      name: 'Crosshair Guides',
      callback() {
        // Add toggle button to editor panel
        const buttonTemplate = document.createElement('template');
        buttonTemplate.innerHTML = `
          <se-button id="view_crosshair" title="Toggle Crosshair Guides" src="crosshair.svg" pressed="true"></se-button>
        `;
        const editorPanel = $id('editor_panel');
        if (editorPanel) {
          editorPanel.append(buttonTemplate.content.cloneNode(true));
          const btn = $id('view_crosshair');
          if (btn) {
            btn.addEventListener('click', toggleCrosshair);
          }
        }
      },
      mouseMove(opts) {
        // Extension can also receive mouse move events through svgcanvas
        if (showCrosshair && crosshairGroup) {
          const zoom = svgCanvas.getZoom();
          const x = opts.mouse_x;
          const y = opts.mouse_y;
          
          // Get workarea for scroll offsets
          const workarea = $id('workarea');
          if (workarea) {
            const scrollLeft = workarea.scrollLeft;
            const scrollTop = workarea.scrollTop;
            
            verticalLine.setAttribute('x1', x + scrollLeft);
            verticalLine.setAttribute('x2', x + scrollLeft);
            horizontalLine.setAttribute('y1', y + scrollTop);
            horizontalLine.setAttribute('y2', y + scrollTop);
          }
        }
      }
    };
  }
};

export default extCrosshair;
