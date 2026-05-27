/**
 * ext-size-control.js
 * Control element size in millimeters with slider, input field, and preset buttons
 * Supports proportional resizing for multiple selected elements
 */

const name = 'size-control';

// Conversion factor: 1 inch = 25.4mm, SVG default is 96 DPI
const PX_TO_MM = 25.4 / 96;
const MM_TO_PX = 96 / 25.4;

const extSizeControl = {
  name,
  async init() {
    const svgEditor = this;
    const { svgCanvas } = svgEditor;
    const { $id, $click } = svgCanvas;
    
    let sizePanel = null;
    let isVisible = false;
    let currentElements = [];
    
    // Helper to convert px to mm
    const pxToMm = (px) => px * PX_TO_MM;
    
    // Helper to convert mm to px
    const mmToPx = (mm) => mm * MM_TO_PX;
    
    // Get element dimensions
    const getElementDimensions = (elem) => {
      if (!elem) return null;
      try {
        const bbox = elem.getBBox();
        return {
          width: bbox.width,
          height: bbox.height,
          widthMm: pxToMm(bbox.width),
          heightMm: pxToMm(bbox.height),
          x: bbox.x,
          y: bbox.y,
          element: elem
        };
      } catch (e) {
        return null;
      }
    };
    
    // Get the largest dimension among selected elements
    const getLargestDimension = (elements) => {
      let maxSize = 0;
      let largestElem = null;
      let largestDim = null;
      
      elements.forEach(elem => {
        const dim = getElementDimensions(elem);
        if (dim) {
          const maxDim = Math.max(dim.widthMm, dim.heightMm);
          if (maxDim > maxSize) {
            maxSize = maxDim;
            largestElem = elem;
            largestDim = dim;
          }
        }
      });
      
      return { maxSize, largestElem, largestDim };
    };
    
    // Resize element to specific size in mm
    const resizeElement = (elem, targetSizeMm) => {
      const dim = getElementDimensions(elem);
      if (!dim) return;
      
      const currentMaxMm = Math.max(dim.widthMm, dim.heightMm);
      if (currentMaxMm === 0) return;
      
      const scale = targetSizeMm / currentMaxMm;
      
      // Calculate new dimensions
      const newWidth = dim.width * scale;
      const newHeight = dim.height * scale;
      
      // Create resize operation
      svgCanvas.undoMgr.beginUndoableChange('transform', [elem]);
      
      // Get current transform
      const transform = elem.getAttribute('transform') || '';
      
      // Calculate center point for scaling
      const cx = dim.x + dim.width / 2;
      const cy = dim.y + dim.height / 2;
      
      // Apply scale transform
      const newTransform = `${transform} translate(${cx}, ${cy}) scale(${scale}) translate(${-cx}, ${-cy})`.trim();
      elem.setAttribute('transform', newTransform);
      
      const batchCmd = svgCanvas.undoMgr.finishUndoableChange();
      if (!batchCmd.isEmpty()) {
        svgCanvas.undoMgr.addCommandToHistory(batchCmd);
      }
    };
    
    // Resize all selected elements proportionally
    const resizeProportionally = (targetSizeMm) => {
      const selectedElements = svgCanvas.getSelectedElements().filter(e => e);
      if (selectedElements.length === 0) return;
      
      if (selectedElements.length === 1) {
        // Single element - resize directly
        resizeElement(selectedElements[0], targetSizeMm);
      } else {
        // Multiple elements - resize proportionally relative to largest
        const { maxSize, largestElem } = getLargestDimension(selectedElements);
        if (!largestElem || maxSize === 0) return;
        
        const scale = targetSizeMm / maxSize;
        
        selectedElements.forEach(elem => {
          const dim = getElementDimensions(elem);
          if (dim) {
            const elemMaxMm = Math.max(dim.widthMm, dim.heightMm);
            const newSize = elemMaxMm * scale;
            resizeElement(elem, newSize);
          }
        });
      }
      
      // Trigger update
      svgCanvas.call('changed', selectedElements);
      updatePanelInfo();
    };
    
    // Create size control panel
    const createSizePanel = () => {
      if (sizePanel) {
        sizePanel.remove();
      }
      
      sizePanel = document.createElement('div');
      sizePanel.id = 'size-control-panel';
      sizePanel.style.cssText = `
        position: fixed;
        right: 20px;
        top: 100px;
        width: 300px;
        background: #1a1a2e;
        border: 1px solid #3a3a5a;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #fff;
        overflow: hidden;
      `;
      
      sizePanel.innerHTML = `
        <div id="size-panel-header" style="
          padding: 12px 16px;
          background: #2d2d44;
          border-bottom: 1px solid #3a3a5a;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: move;
        ">
          <span style="font-weight: 600; font-size: 14px;">Size Control (mm)</span>
          <button id="close-size-panel" style="
            background: none;
            border: none;
            color: #888;
            cursor: pointer;
            font-size: 18px;
            padding: 0;
            line-height: 1;
          ">&times;</button>
        </div>
        
        <div style="padding: 16px;">
          <!-- Element info -->
          <div id="element-info" style="
            margin-bottom: 16px;
            padding: 12px;
            background: #2d2d44;
            border-radius: 6px;
            font-size: 12px;
          ">
            <div style="color: #888; margin-bottom: 4px;">Selected Elements</div>
            <div id="element-count" style="font-weight: 500;">No elements selected</div>
            <div id="element-dimensions" style="margin-top: 8px; color: #aaa;"></div>
          </div>
          
          <!-- Size slider -->
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-size: 13px; font-weight: 500;">
              Target Size (largest dimension)
            </label>
            <div style="display: flex; align-items: center; gap: 12px;">
              <input type="range" id="size-slider" min="1" max="100" value="26" style="
                flex: 1;
                height: 6px;
                background: #3a3a5a;
                border-radius: 3px;
                outline: none;
                -webkit-appearance: none;
              ">
              <div style="display: flex; align-items: center; gap: 4px;">
                <input type="number" id="size-input" value="26" min="0.1" max="500" step="0.1" style="
                  width: 60px;
                  background: #2d2d44;
                  border: 1px solid #3a3a5a;
                  color: #fff;
                  padding: 6px 8px;
                  border-radius: 4px;
                  font-size: 13px;
                  text-align: center;
                ">
                <span style="color: #888; font-size: 12px;">mm</span>
              </div>
            </div>
          </div>
          
          <!-- Preset buttons -->
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-size: 13px; font-weight: 500;">
              Preset Sizes
            </label>
            <div style="display: flex; gap: 8px;">
              <button id="preset-26mm" style="
                flex: 1;
                background: #4a6cf7;
                border: none;
                color: #fff;
                padding: 12px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                transition: background 0.2s;
              ">26 mm</button>
              <button id="preset-46mm" style="
                flex: 1;
                background: #6c4af7;
                border: none;
                color: #fff;
                padding: 12px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                transition: background 0.2s;
              ">46 mm</button>
            </div>
          </div>
          
          <!-- Apply button -->
          <button id="apply-size" style="
            width: 100%;
            background: #28a745;
            border: none;
            color: #fff;
            padding: 12px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: background 0.2s;
          ">Apply Size</button>
          
          <!-- Info text -->
          <div style="
            margin-top: 12px;
            padding: 10px;
            background: #2d2d44;
            border-radius: 6px;
            font-size: 11px;
            color: #888;
            line-height: 1.5;
          ">
            <strong style="color: #aaa;">Tips:</strong><br>
            - When multiple elements are selected, they will be resized proportionally<br>
            - The largest element becomes the target size, smaller elements scale accordingly
          </div>
        </div>
      `;
      
      document.body.appendChild(sizePanel);
      
      // Add event listeners
      const closeBtn = sizePanel.querySelector('#close-size-panel');
      const slider = sizePanel.querySelector('#size-slider');
      const input = sizePanel.querySelector('#size-input');
      const preset26 = sizePanel.querySelector('#preset-26mm');
      const preset46 = sizePanel.querySelector('#preset-46mm');
      const applyBtn = sizePanel.querySelector('#apply-size');
      const header = sizePanel.querySelector('#size-panel-header');
      
      closeBtn.addEventListener('click', hidePanel);
      
      // Sync slider and input
      slider.addEventListener('input', (e) => {
        input.value = e.target.value;
      });
      
      input.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val) && val >= 0.1 && val <= 500) {
          slider.value = Math.min(100, Math.max(1, val));
        }
      });
      
      // Preset buttons
      preset26.addEventListener('click', () => {
        slider.value = 26;
        input.value = 26;
        resizeProportionally(26);
      });
      
      preset46.addEventListener('click', () => {
        slider.value = 46;
        input.value = 46;
        resizeProportionally(46);
      });
      
      // Apply button
      applyBtn.addEventListener('click', () => {
        const size = parseFloat(input.value);
        if (!isNaN(size) && size > 0) {
          resizeProportionally(size);
        }
      });
      
      // Also apply on Enter key in input
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const size = parseFloat(input.value);
          if (!isNaN(size) && size > 0) {
            resizeProportionally(size);
          }
        }
      });
      
      // Style slider thumb
      const styleSheet = document.createElement('style');
      styleSheet.textContent = `
        #size-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          background: #4a6cf7;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        #size-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          background: #4a6cf7;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        #preset-26mm:hover { background: #3a5cd7; }
        #preset-46mm:hover { background: #5c3ad7; }
        #apply-size:hover { background: #218838; }
        #size-input:focus {
          outline: none;
          border-color: #4a6cf7;
        }
      `;
      document.head.appendChild(styleSheet);
      
      // Make draggable
      makeDraggable(sizePanel, header);
      
      // Update panel info
      updatePanelInfo();
    };
    
    // Update panel with current selection info
    const updatePanelInfo = () => {
      if (!sizePanel || !isVisible) return;
      
      const elementCount = sizePanel.querySelector('#element-count');
      const elementDimensions = sizePanel.querySelector('#element-dimensions');
      const slider = sizePanel.querySelector('#size-slider');
      const input = sizePanel.querySelector('#size-input');
      
      const selectedElements = svgCanvas.getSelectedElements().filter(e => e);
      
      if (selectedElements.length === 0) {
        elementCount.textContent = 'No elements selected';
        elementDimensions.innerHTML = '';
        return;
      }
      
      elementCount.textContent = `${selectedElements.length} element(s) selected`;
      
      if (selectedElements.length === 1) {
        const dim = getElementDimensions(selectedElements[0]);
        if (dim) {
          elementDimensions.innerHTML = `
            Width: ${dim.widthMm.toFixed(2)} mm<br>
            Height: ${dim.heightMm.toFixed(2)} mm<br>
            Max: ${Math.max(dim.widthMm, dim.heightMm).toFixed(2)} mm
          `;
          // Update slider to current max dimension
          const maxMm = Math.max(dim.widthMm, dim.heightMm);
          slider.value = Math.min(100, Math.max(1, maxMm));
          input.value = maxMm.toFixed(1);
        }
      } else {
        const { maxSize, largestElem, largestDim } = getLargestDimension(selectedElements);
        if (largestDim) {
          elementDimensions.innerHTML = `
            Largest element: ${maxSize.toFixed(2)} mm<br>
            (${largestDim.widthMm.toFixed(2)} x ${largestDim.heightMm.toFixed(2)} mm)
          `;
          slider.value = Math.min(100, Math.max(1, maxSize));
          input.value = maxSize.toFixed(1);
        }
      }
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
      if (!sizePanel) {
        createSizePanel();
      } else {
        sizePanel.style.display = 'block';
      }
      isVisible = true;
      updatePanelInfo();
      const btn = $id('size_control_btn');
      if (btn) btn.pressed = true;
    };
    
    const hidePanel = () => {
      if (sizePanel) {
        sizePanel.style.display = 'none';
      }
      isVisible = false;
      const btn = $id('size_control_btn');
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
      name: 'Size Control',
      callback() {
        // Add button to tools
        const buttonTemplate = document.createElement('template');
        buttonTemplate.innerHTML = `
          <se-button id="size_control_btn" title="Size Control - Resize elements in mm" src="size_control.svg"></se-button>
        `;
        const editorPanel = $id('editor_panel');
        if (editorPanel) {
          editorPanel.append(buttonTemplate.content.cloneNode(true));
          $click($id('size_control_btn'), togglePanel);
        }
      },
      
      // Update panel when selection changes
      selectedChanged(opts) {
        updatePanelInfo();
      },
      
      // Update after element changes
      elementChanged(opts) {
        updatePanelInfo();
      }
    };
  }
};

export default extSizeControl;
