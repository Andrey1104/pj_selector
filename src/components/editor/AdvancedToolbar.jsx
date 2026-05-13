import React, { useState } from 'react';
import {
  AlignLeft, AlignCenter, AlignRight, AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  FlipHorizontal, FlipVertical, RotateCw, RotateCcw, Copy, Clipboard,
  Grid3X3, Magnet, ZoomIn, ZoomOut, Maximize2, Move,
  Trash2, ArrowUp, ArrowDown, Eye, EyeOff, Lock, Unlock,
  Crosshair, Type, Bold, Italic, Underline, ALargeSmall,
  Layers, Split, Box, CheckCircle, Circle, Square, LockKeyhole, UnlockKeyhole
} from 'lucide-react';
import { IconButton, ButtonGroup, Separator, TabButton } from './EditorUI';

export function AdvancedToolbar({
  hasSelection,
  selectedCount,

  onAlignLeft,
  onAlignCenterH,
  onAlignRight,
  onAlignTop,
  onAlignCenterV,
  onAlignBottom,
  onFlipHorizontal,
  onFlipVertical,
  onRotateCW,
  onRotateCCW,
  onCenterOnCanvas,

  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,

  onCopy,
  onPaste,
  onDuplicate,
  onDelete,

  showGrid,
  setShowGrid,
  snapToGrid,
  setSnapToGrid,
  gridSize,
  setGridSize,
  zoom,
  setZoom,

  onToggleVisibility,
  onToggleLock,

  selectedObject,
  onUpdateSelected,

  // New props for wireframe, split vectors, outline verification, and size lock
  wireframeMode,
  setWireframeMode,
  onSplitVector,
  canSplitVector,
  onVerifyOutlines,
  outlineStatus,
  onGenerateCenterOutline,
  sizesLocked,
  onLockAllSizes,
  onUnlockAllSizes,
}) {
  const [activeTab, setActiveTab] = useState('transform');

  return (
    <div className="border-b border-zinc-800 bg-zinc-900/50" data-testid="advanced-toolbar">
      <div className="flex items-center border-b border-zinc-800">
        <TabButton 
          active={activeTab === 'transform'} 
          onClick={() => setActiveTab('transform')}
          testId="toolbar-tab-transform"
        >
          Transform
        </TabButton>
        <TabButton 
          active={activeTab === 'arrange'} 
          onClick={() => setActiveTab('arrange')}
          testId="toolbar-tab-arrange"
        >
          Arrange
        </TabButton>
        <TabButton 
          active={activeTab === 'edit'} 
          onClick={() => setActiveTab('edit')}
          testId="toolbar-tab-edit"
        >
          Edit
        </TabButton>
        <TabButton 
          active={activeTab === 'view'} 
          onClick={() => setActiveTab('view')}
          testId="toolbar-tab-view"
        >
          View
        </TabButton>
        <TabButton 
          active={activeTab === 'text'} 
          onClick={() => setActiveTab('text')}
          testId="toolbar-tab-text"
        >
          Text
        </TabButton>
        <TabButton 
          active={activeTab === 'vectors'} 
          onClick={() => setActiveTab('vectors')}
          testId="toolbar-tab-vectors"
        >
          Vectors
        </TabButton>
        <TabButton 
          active={activeTab === 'outlines'} 
          onClick={() => setActiveTab('outlines')}
          testId="toolbar-tab-outlines"
        >
          Outlines
        </TabButton>

        {selectedCount > 0 && (
          <span className="ml-auto mr-3 text-[10px] font-mono text-zinc-500">
            {selectedCount} selected
          </span>
        )}
      </div>

      <div className="p-2 min-h-[52px]">
        {activeTab === 'transform' && (
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">Align</span>
              <div className="flex gap-0.5">
                <ButtonGroup>
                  <IconButton 
                    icon={AlignLeft} 
                    title="Align Left" 
                    onClick={onAlignLeft}
                    disabled={!hasSelection}
                    testId="align-left"
                  />
                  <IconButton 
                    icon={AlignCenter} 
                    title="Align Center (H)" 
                    onClick={onAlignCenterH}
                    disabled={!hasSelection}
                    testId="align-center-h"
                  />
                  <IconButton 
                    icon={AlignRight} 
                    title="Align Right" 
                    onClick={onAlignRight}
                    disabled={!hasSelection}
                    testId="align-right"
                  />
                </ButtonGroup>
                <ButtonGroup>
                  <IconButton 
                    icon={AlignStartVertical} 
                    title="Align Top" 
                    onClick={onAlignTop}
                    disabled={!hasSelection}
                    testId="align-top"
                  />
                  <IconButton 
                    icon={AlignCenterVertical} 
                    title="Align Center (V)" 
                    onClick={onAlignCenterV}
                    disabled={!hasSelection}
                    testId="align-center-v"
                  />
                  <IconButton 
                    icon={AlignEndVertical} 
                    title="Align Bottom" 
                    onClick={onAlignBottom}
                    disabled={!hasSelection}
                    testId="align-bottom"
                  />
                </ButtonGroup>
              </div>
            </div>

            <Separator vertical />

            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">Flip</span>
              <ButtonGroup>
                <IconButton 
                  icon={FlipHorizontal} 
                  title="Flip Horizontal" 
                  onClick={onFlipHorizontal}
                  disabled={!hasSelection}
                  testId="flip-horizontal"
                />
                <IconButton 
                  icon={FlipVertical} 
                  title="Flip Vertical" 
                  onClick={onFlipVertical}
                  disabled={!hasSelection}
                  testId="flip-vertical"
                />
              </ButtonGroup>
            </div>

            <Separator vertical />

            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">Rotate</span>
              <ButtonGroup>
                <IconButton 
                  icon={RotateCcw} 
                  title="Rotate -90 deg" 
                  onClick={() => onRotateCCW?.(-90)}
                  disabled={!hasSelection}
                  testId="rotate-ccw"
                />
                <IconButton 
                  icon={RotateCw} 
                  title="Rotate +90 deg" 
                  onClick={() => onRotateCW?.(90)}
                  disabled={!hasSelection}
                  testId="rotate-cw"
                />
              </ButtonGroup>
            </div>

            <Separator vertical />

            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">Position</span>
              <IconButton 
                icon={Crosshair} 
                title="Center on Canvas (Ctrl+Shift+C)" 
                onClick={onCenterOnCanvas}
                testId="center-on-canvas"
              />
            </div>
          </div>
        )}

        {activeTab === 'arrange' && (
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">Order</span>
              <ButtonGroup>
                <IconButton 
                  icon={ArrowUp} 
                  title="Bring Forward" 
                  onClick={onBringForward}
                  disabled={!hasSelection}
                  testId="bring-forward"
                />
                <IconButton 
                  icon={ArrowDown} 
                  title="Send Backward" 
                  onClick={onSendBackward}
                  disabled={!hasSelection}
                  testId="send-backward"
                />
              </ButtonGroup>
            </div>

            <Separator vertical />
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">Visibility</span>
              <ButtonGroup>
                <IconButton 
                  icon={Eye} 
                  title="Toggle Visibility" 
                  onClick={onToggleVisibility}
                  disabled={!hasSelection}
                  testId="toggle-visibility"
                />
                <IconButton 
                  icon={Lock} 
                  title="Toggle Lock" 
                  onClick={onToggleLock}
                  disabled={!hasSelection}
                  testId="toggle-lock"
                />
              </ButtonGroup>
            </div>
          </div>
        )}

        {activeTab === 'edit' && (
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">Clipboard</span>
              <ButtonGroup>
                <IconButton 
                  icon={Copy} 
                  title="Copy (Ctrl+C)" 
                  onClick={onCopy}
                  disabled={!hasSelection}
                  testId="copy"
                />
                <IconButton 
                  icon={Clipboard} 
                  title="Paste (Ctrl+V)" 
                  onClick={onPaste}
                  testId="paste"
                />
              </ButtonGroup>
            </div>

            <Separator vertical />
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">Delete</span>
              <IconButton 
                icon={Trash2} 
                title="Delete (Del)" 
                onClick={onDelete}
                disabled={!hasSelection}
                danger
                testId="delete"
              />
            </div>
          </div>
        )}

        {activeTab === 'view' && (
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">Grid</span>
              <ButtonGroup>
                <IconButton 
                  icon={Grid3X3} 
                  title="Toggle Grid" 
                  onClick={() => setShowGrid?.(!showGrid)}
                  active={showGrid}
                  testId="toggle-grid"
                />
                <IconButton 
                  icon={Magnet} 
                  title="Snap to Grid" 
                  onClick={() => setSnapToGrid?.(!snapToGrid)}
                  active={snapToGrid}
                  testId="toggle-snap"
                />
              </ButtonGroup>
            </div>
            <Separator vertical />
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">Grid Size</span>
              <div className="flex items-center gap-1">
                <input
                  type="range"
                  min={5}
                  max={40}
                  value={gridSize}
                  onChange={(e) => setGridSize?.(Number(e.target.value))}
                  className="w-20 accent-amber-500"
                  data-testid="grid-size-slider"
                />
                <span className="text-[10px] font-mono text-zinc-400 w-8">{gridSize}mm</span>
              </div>
            </div>

            <Separator vertical />
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">Zoom</span>
              <div className="flex items-center gap-1">
                <ButtonGroup>
                  <IconButton 
                    icon={ZoomOut} 
                    title="Zoom Out" 
                    onClick={() => setZoom?.(Math.max(25, zoom - 25))}
                    testId="zoom-out"
                  />
                  <IconButton 
                    icon={ZoomIn} 
                    title="Zoom In" 
                    onClick={() => setZoom?.(Math.min(200, zoom + 25))}
                    testId="zoom-in"
                  />
                  <IconButton 
                    icon={Maximize2} 
                    title="Reset Zoom" 
                    onClick={() => setZoom?.(100)}
                    testId="zoom-reset"
                  />
                </ButtonGroup>
            <span className="text-[10px] font-mono text-zinc-400 w-10 text-right">{zoom}%</span>
            </div>
          </div>

            <Separator vertical />
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">Wireframe</span>
              <IconButton 
                icon={Box} 
                title="Toggle Wireframe Mode" 
                onClick={() => setWireframeMode?.(!wireframeMode)}
                active={wireframeMode}
                testId="toggle-wireframe"
              />
            </div>
          </div>
        )}

        {activeTab === 'text' && (
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">Format</span>
              <ButtonGroup>
                <IconButton 
                  icon={Bold} 
                  title="Bold" 
                  onClick={() => {
                    if (selectedObject?.type === 'text') {
                      const isBold = selectedObject.fontWeight === 'bold';
                      onUpdateSelected?.({ fontWeight: isBold ? 'normal' : 'bold' });
                    }
                  }}
                  active={selectedObject?.fontWeight === 'bold'}
                  disabled={!selectedObject || selectedObject?.type !== 'text'}
                  testId="text-bold"
                />
                <IconButton 
                  icon={Italic} 
                  title="Italic" 
                  onClick={() => {
                    if (selectedObject?.type === 'text') {
                      const isItalic = selectedObject.fontStyle === 'italic';
                      onUpdateSelected?.({ fontStyle: isItalic ? 'normal' : 'italic' });
                    }
                  }}
                  active={selectedObject?.fontStyle === 'italic'}
                  disabled={!selectedObject || selectedObject?.type !== 'text'}
                  testId="text-italic"
                />
                <IconButton 
                  icon={Underline} 
                  title="Underline" 
                  onClick={() => {
                    if (selectedObject?.type === 'text') {
                      const isUnderline = selectedObject.textDecoration === 'underline';
                      onUpdateSelected?.({ textDecoration: isUnderline ? 'none' : 'underline' });
                    }
                  }}
                  active={selectedObject?.textDecoration === 'underline'}
                  disabled={!selectedObject || selectedObject?.type !== 'text'}
                  testId="text-underline"
                />
              </ButtonGroup>
            </div>

            <Separator vertical />

            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">Size</span>
              <div className="flex items-center gap-1">
                <input
                  type="range"
                  min={8}
                  max={200}
                  value={selectedObject?.fontSize || 24}
                  onChange={(e) => onUpdateSelected?.({ fontSize: Number(e.target.value) })}
                  className="w-24 accent-amber-500"
                  disabled={!selectedObject || selectedObject?.type !== 'text'}
                  data-testid="text-size-slider"
                />
                <span className="text-[10px] font-mono text-zinc-400 w-10">{selectedObject?.fontSize || 24}px</span>
              </div>
            </div>

            <Separator vertical />
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">Align</span>
              <ButtonGroup>
                <IconButton 
                  icon={AlignLeft} 
                  title="Align Left" 
                  onClick={() => onUpdateSelected?.({ textAnchor: 'start' })}
                  active={selectedObject?.textAnchor === 'start' || !selectedObject?.textAnchor}
                  disabled={!selectedObject || selectedObject?.type !== 'text'}
                  testId="text-align-left"
                />
                <IconButton 
                  icon={AlignCenter} 
                  title="Align Center" 
                  onClick={() => onUpdateSelected?.({ textAnchor: 'middle' })}
                  active={selectedObject?.textAnchor === 'middle'}
                  disabled={!selectedObject || selectedObject?.type !== 'text'}
                  testId="text-align-center"
                />
                <IconButton 
                  icon={AlignRight} 
                  title="Align Right" 
                  onClick={() => onUpdateSelected?.({ textAnchor: 'end' })}
                  active={selectedObject?.textAnchor === 'end'}
                  disabled={!selectedObject || selectedObject?.type !== 'text'}
                  testId="text-align-right"
                />
              </ButtonGroup>
            </div>

            {(!selectedObject || selectedObject?.type !== 'text') && (
              <span className="text-[10px] font-mono text-zinc-500 ml-4">
                Select a text object to edit
              </span>
            )}
          </div>
        )}

        {activeTab === 'vectors' && (
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">Split</span>
              <IconButton 
                icon={Split} 
                title="Split Vector into Subpaths" 
                onClick={onSplitVector}
                disabled={!canSplitVector}
                testId="split-vector"
              />
            </div>

            <Separator vertical />

            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">View</span>
              <IconButton 
                icon={Box} 
                title="Toggle Wireframe Mode" 
                onClick={() => setWireframeMode?.(!wireframeMode)}
                active={wireframeMode}
                testId="toggle-wireframe-vectors"
              />
            </div>

            <Separator vertical />

            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">Size Lock</span>
              <ButtonGroup>
                <IconButton 
                  icon={LockKeyhole} 
                  title="Lock All Sizes" 
                  onClick={onLockAllSizes}
                  active={sizesLocked}
                  testId="lock-all-sizes"
                />
                <IconButton 
                  icon={UnlockKeyhole} 
                  title="Unlock All Sizes" 
                  onClick={onUnlockAllSizes}
                  disabled={!sizesLocked}
                  testId="unlock-all-sizes"
                />
              </ButtonGroup>
            </div>

            {sizesLocked && (
              <span className="text-[10px] font-mono text-amber-500 ml-4">
                All sizes are locked
              </span>
            )}

            {!hasSelection && (
              <span className="text-[10px] font-mono text-zinc-500 ml-4">
                Select a vector path to split
              </span>
            )}
          </div>
        )}

        {activeTab === 'outlines' && (
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">Verify</span>
              <IconButton 
                icon={CheckCircle} 
                title="Verify Outlines" 
                onClick={onVerifyOutlines}
                disabled={!hasSelection}
                testId="verify-outlines"
              />
            </div>

            <Separator vertical />

            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">Center</span>
              <IconButton 
                icon={Circle} 
                title="Generate Center Outline" 
                onClick={onGenerateCenterOutline}
                disabled={!hasSelection}
                testId="generate-center-outline"
              />
            </div>

            {outlineStatus && (
              <>
                <Separator vertical />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">Status</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono ${outlineStatus.isClosed ? 'text-green-500' : 'text-red-500'}`}>
                      {outlineStatus.isClosed ? 'Closed' : 'Open'}
                    </span>
                    {outlineStatus.center && (
                      <span className="text-[10px] font-mono text-zinc-400">
                        Center: ({outlineStatus.center.x.toFixed(1)}, {outlineStatus.center.y.toFixed(1)})
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}

            {!hasSelection && (
              <span className="text-[10px] font-mono text-zinc-500 ml-4">
                Select an outline to verify
              </span>
            )}
          </div>
        )}
        </div>
    </div>
  );
}

export default AdvancedToolbar;
