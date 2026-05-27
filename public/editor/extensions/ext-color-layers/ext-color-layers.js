/**
 * ext-color-layers.js
 * Separates SVG into layers by base colors with ability to save by colors
 */

const name = 'color-layers';

const extColorLayers = {
  name,
  async init() {
    const svgEditor = this;
    const { svgCanvas } = svgEditor;
    const { $id, $click, NS } = svgCanvas;
    
    let colorLayersPanel = null;
    let isVisible = false;
    
    // Helper to normalize color to hex
    const normalizeColor = (color) => {
      if (!color || color === 'none' || color === 'transparent') return null;
      
      // Handle rgb/rgba
      if (color.startsWith('rgb')) {
        const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
          const r = parseInt(match[1]).toString(16).padStart(2, '0');
          const g = parseInt(match[2]).toString(16).padStart(2, '0');
          const b = parseInt(match[3]).toString(16).padStart(2, '0');
          return `#${r}${g}${b}`.toLowerCase();
        }
      }
      
      // Handle hex shorthand
      if (color.match(/^#[0-9a-f]{3}$/i)) {
        return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`.toLowerCase();
      }
      
      // Handle named colors
      const namedColors = {
        'black': '#000000', 'white': '#ffffff', 'red': '#ff0000',
        'green': '#008000', 'blue': '#0000ff', 'yellow': '#ffff00',
        'cyan': '#00ffff', 'magenta': '#ff00ff', 'orange': '#ffa500',
        'purple': '#800080', 'pink': '#ffc0cb', 'gray': '#808080',
        'grey': '#808080', 'lime': '#00ff00', 'navy': '#000080',
        'teal': '#008080', 'maroon': '#800000', 'olive': '#808000'
      };
      
      if (namedColors[color.toLowerCase()]) {
        return namedColors[color.toLowerCase()];
      }
      
      return color.toLowerCase();
    };
    
    // Get all colors used in SVG
    const getColorsFromSVG = () => {
      const colors = new Map(); // color -> { elements: [], type: 'fill'|'stroke' }
      const svgContent = svgCanvas.getSvgContent();
      if (!svgContent) return colors;
      
      const elements = svgContent.querySelectorAll('*');
      elements.forEach(elem => {
        // Check fill
        const fill = elem.getAttribute('fill') || getComputedStyle(elem).fill;
        const normalizedFill = normalizeColor(fill);
        if (normalizedFill && normalizedFill !== '#000000') {
          if (!colors.has(normalizedFill)) {
            colors.set(normalizedFill, { elements: [], type: 'fill' });
          }
          colors.get(normalizedFill).elements.push({ elem, type: 'fill' });
        }
        
        // Check stroke
        const stroke = elem.getAttribute('stroke') || getComputedStyle(elem).stroke;
        const normalizedStroke = normalizeColor(stroke);
        if (normalizedStroke) {
          if (!colors.has(normalizedStroke)) {
            colors.set(normalizedStroke, { elements: [], type: 'stroke' });
          }
          colors.get(normalizedStroke).elements.push({ elem, type: 'stroke' });
        }
      });
      
      return colors;
    };
    
    // Create SVG with only specific colors
    const createSVGForColors = (selectedColors) => {
      const svgContent = svgCanvas.getSvgContent();
      if (!svgContent) return null;
      
      // Clone the SVG
      const clonedSvg = svgContent.cloneNode(true);
      const svgRoot = svgCanvas.getSvgRoot();
      
      // Get viewBox and dimensions
      const viewBox = svgRoot.getAttribute('viewBox') || `0 0 ${svgRoot.getAttribute('width') || 640} ${svgRoot.getAttribute('height') || 480}`;
      const width = svgRoot.getAttribute('width') || '640';
      const height = svgRoot.getAttribute('height') || '480';
      
      // Create new SVG
      const newSvg = document.createElementNS(NS.SVG, 'svg');
      newSvg.setAttribute('xmlns', NS.SVG);
      newSvg.setAttribute('viewBox', viewBox);
      newSvg.setAttribute('width', width);
      newSvg.setAttribute('height', height);
      
      // Filter elements by color
      const processElement = (elem) => {
        const fill = normalizeColor(elem.getAttribute('fill'));
        const stroke = normalizeColor(elem.getAttribute('stroke'));
        
        const hasFill = fill && selectedColors.includes(fill);
        const hasStroke = stroke && selectedColors.includes(stroke);
        
        if (hasFill || hasStroke) {
          const clone = elem.cloneNode(true);
          // Remove colors that are not selected
          if (fill && !selectedColors.includes(fill)) {
            clone.setAttribute('fill', 'none');
          }
          if (stroke && !selectedColors.includes(stroke)) {
            clone.setAttribute('stroke', 'none');
          }
          return clone;
        }
        return null;
      };
      
      // Process all elements
      const elements = clonedSvg.querySelectorAll('*');
      elements.forEach(elem => {
        const processed = processElement(elem);
        if (processed) {
          newSvg.appendChild(processed);
        }
      });
      
      return newSvg;
    };
    
    // Export SVG by colors
    const exportByColor = (color, colorName) => {
      const svg = createSVGForColors([color]);
      if (!svg) return;
      
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `layer_${colorName.replace('#', '')}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
    
    // Create the color layers panel
    const createColorLayersPanel = () => {
      if (colorLayersPanel) {
        colorLayersPanel.remove();
      }
      
      colorLayersPanel = document.createElement('div');
      colorLayersPanel.id = 'color-layers-panel';
      colorLayersPanel.style.cssText = `
        position: fixed;
        right: 20px;
        top: 100px;
        width: 320px;
        max-height: 500px;
        background: #1a1a2e;
        border: 1px solid #3a3a5a;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #fff;
        overflow: hidden;
      `;
      
      // Header
      const header = document.createElement('div');
      header.style.cssText = `
        padding: 12px 16px;
        background: #2d2d44;
        border-bottom: 1px solid #3a3a5a;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: move;
      `;
      header.innerHTML = `
        <span style="font-weight: 600; font-size: 14px;">Color Layers</span>
        <button id="close-color-layers" style="
          background: none;
          border: none;
          color: #888;
          cursor: pointer;
          font-size: 18px;
          padding: 0;
          line-height: 1;
        ">&times;</button>
      `;
      colorLayersPanel.appendChild(header);
      
      // Color list container
      const colorList = document.createElement('div');
      colorList.id = 'color-list';
      colorList.style.cssText = `
        max-height: 350px;
        overflow-y: auto;
        padding: 8px;
      `;
      colorLayersPanel.appendChild(colorList);
      
      // Footer with export all button
      const footer = document.createElement('div');
      footer.style.cssText = `
        padding: 12px 16px;
        border-top: 1px solid #3a3a5a;
        display: flex;
        gap: 8px;
      `;
      footer.innerHTML = `
        <button id="refresh-colors" style="
          flex: 1;
          background: #3a3a5a;
          border: none;
          color: #fff;
          padding: 10px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
        ">Refresh Colors</button>
        <button id="export-all-colors" style="
          flex: 1;
          background: #4a6cf7;
          border: none;
          color: #fff;
          padding: 10px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
        ">Export All Layers</button>
      `;
      colorLayersPanel.appendChild(footer);
      
      document.body.appendChild(colorLayersPanel);
      
      // Event listeners
      colorLayersPanel.querySelector('#close-color-layers').addEventListener('click', hidePanel);
      colorLayersPanel.querySelector('#refresh-colors').addEventListener('click', refreshColorList);
      colorLayersPanel.querySelector('#export-all-colors').addEventListener('click', exportAllColors);
      
      // Make draggable
      makeDraggable(colorLayersPanel, header);
      
      // Populate initial colors
      refreshColorList();
    };
    
    // Refresh color list
    const refreshColorList = () => {
      const colorList = document.getElementById('color-list');
      if (!colorList) return;
      
      colorList.innerHTML = '';
      const colors = getColorsFromSVG();
      
      if (colors.size === 0) {
        colorList.innerHTML = `
          <div style="padding: 20px; text-align: center; color: #888;">
            No colors found in the current SVG.
          </div>
        `;
        return;
      }
      
      colors.forEach((data, color) => {
        const colorItem = document.createElement('div');
        colorItem.style.cssText = `
          display: flex;
          align-items: center;
          padding: 10px 12px;
          margin-bottom: 6px;
          background: #2d2d44;
          border-radius: 6px;
          gap: 12px;
        `;
        
        colorItem.innerHTML = `
          <div style="
            width: 36px;
            height: 36px;
            background: ${color};
            border-radius: 6px;
            border: 2px solid #4a4a6a;
            flex-shrink: 0;
          "></div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 500; font-size: 13px; margin-bottom: 2px;">${color.toUpperCase()}</div>
            <div style="font-size: 11px; color: #888;">${data.elements.length} element(s)</div>
          </div>
          <div style="display: flex; gap: 6px;">
            <button class="select-color-btn" data-color="${color}" style="
              background: #3a3a5a;
              border: none;
              color: #fff;
              padding: 6px 10px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 11px;
            ">Select</button>
            <button class="export-color-btn" data-color="${color}" style="
              background: #4a6cf7;
              border: none;
              color: #fff;
              padding: 6px 10px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 11px;
            ">Export</button>
          </div>
        `;
        
        colorList.appendChild(colorItem);
      });
      
      // Add event listeners for buttons
      colorList.querySelectorAll('.select-color-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const color = e.target.dataset.color;
          selectElementsByColor(color);
        });
      });
      
      colorList.querySelectorAll('.export-color-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const color = e.target.dataset.color;
          exportByColor(color, color);
        });
      });
    };
    
    // Select elements by color
    const selectElementsByColor = (color) => {
      const colors = getColorsFromSVG();
      const colorData = colors.get(color);
      if (!colorData) return;
      
      svgCanvas.clearSelection();
      const elemsToSelect = colorData.elements.map(item => item.elem).filter(e => e);
      if (elemsToSelect.length > 0) {
        svgCanvas.addToSelection(elemsToSelect);
      }
    };
    
    // Export all colors as separate files
    const exportAllColors = () => {
      const colors = getColorsFromSVG();
      colors.forEach((data, color) => {
        exportByColor(color, color);
      });
    };
    
    // Make panel draggable
    const makeDraggable = (element, handle) => {
      let isDragging = false;
      let offsetX, offsetY;
      
      handle.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'BUTTON') return;
        isDragging = true;
        offsetX = e.clientX - element.offsetLeft;
        offsetY = e.clientY - element.offsetTop;
      });
      
      document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        element.style.left = (e.clientX - offsetX) + 'px';
        element.style.top = (e.clientY - offsetY) + 'px';
        element.style.right = 'auto';
      });
      
      document.addEventListener('mouseup', () => {
        isDragging = false;
      });
    };
    
    // Show/hide panel
    const showPanel = () => {
      if (!colorLayersPanel) {
        createColorLayersPanel();
      } else {
        colorLayersPanel.style.display = 'block';
        refreshColorList();
      }
      isVisible = true;
      const btn = $id('color_layers_btn');
      if (btn) btn.pressed = true;
    };
    
    const hidePanel = () => {
      if (colorLayersPanel) {
        colorLayersPanel.style.display = 'none';
      }
      isVisible = false;
      const btn = $id('color_layers_btn');
      if (btn) btn.pressed = false;
    };
    
    const togglePanel = () => {
      if (isVisible) {
        hidePanel();
      } else {
        showPanel();
      }
    };
    
    return {
      name: 'Color Layers',
      callback() {
        // Add button to tools
        const buttonTemplate = document.createElement('template');
        buttonTemplate.innerHTML = `
          <se-button id="color_layers_btn" title="Color Layers - Separate SVG by colors" src="color_layers.svg"></se-button>
        `;
        const editorPanel = $id('editor_panel');
        if (editorPanel) {
          editorPanel.append(buttonTemplate.content.cloneNode(true));
          $click($id('color_layers_btn'), togglePanel);
        }
      }
    };
  }
};

export default extColorLayers;
