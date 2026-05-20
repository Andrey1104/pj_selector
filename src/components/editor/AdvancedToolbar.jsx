import React, {useState} from 'react';
import {
  AlignLeft, AlignCenter, AlignRight, AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  FlipHorizontal, FlipVertical, RotateCw, RotateCcw, Copy, Clipboard,
  Grid3X3, Magnet, ZoomIn, ZoomOut, Maximize2, Move,
  Trash2, ArrowUp, ArrowDown, Eye, EyeOff, Lock, Unlock,
  Crosshair, Type, Bold, Italic, Underline, ALargeSmall,
  Layers, Split, Box, CheckCircle, Circle, Square, LockKeyhole, UnlockKeyhole,
  Ruler, Palette, MousePointer2, SquareDashedMousePointer, Percent,
  Target, CircleDot, Merge, Scissors, CornerDownRight
} from 'lucide-react';
import {IconButton, ButtonGroup, Separator, TabButton} from './EditorUI';
import {useTranslation} from '@/lib/i18n';

export const SYSTEM_FONTS = [
  {name: 'Arial', family: 'Arial, sans-serif'},
  {name: 'Helvetica', family: 'Helvetica, sans-serif'},
  {name: 'Times New Roman', family: '"Times New Roman", serif'},
  {name: 'Georgia', family: 'Georgia, serif'},
  {name: 'Courier New', family: '"Courier New", monospace'},
  {name: 'Verdana', family: 'Verdana, sans-serif'},
  {name: 'Trebuchet MS', family: '"Trebuchet MS", sans-serif'},
  {name: 'Impact', family: 'Impact, sans-serif'},
  {name: 'Comic Sans MS', family: '"Comic Sans MS", cursive'},
  {name: 'Palatino', family: '"Palatino Linotype", serif'},
];

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
                                  onRotateByAngle,
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

                                  rotationAngle,
                                  setRotationAngle,
                                  scalePercent,
                                  setScalePercent,
                                  onApplyRotation,
                                  onApplyScale,


                                  colorMode,
                                  setColorMode,
                                  onApplyColorToSymbol,

                                  dimensionLines,
                                  onAddDimensionLine,
                                  onUpdateDimensionLine,
                                  onDeleteDimensionLine,
                                  dimensionColor,
                                  setDimensionColor,

                                  selectionMode,
                                  setSelectionMode,
                                  onSelectAll,
                                  onDeselectAll,

                                  snapEnabled,
                                  setSnapEnabled,
                                  snapToCenter,
                                  setSnapToCenter,
                                  snapToCircles,
                                  setSnapToCircles,
                                  showSnapGuides,
                                  setShowSnapGuides,
                                  snapThreshold,
                                  setSnapThreshold,
                                  onSnapToCenter,
                                  onSnapToInnerCircle,
                                  onSnapToOuterCircle,

                                  cornerRadius,
                                  setCornerRadius,
                                  onApplyCornerRadius,
                                  canApplyCornerRadius,

                                  onMergeVectors,
                                  canMergeVectors,
                                  onSplitByCircle,
                                  canSplitByCircle,
                                }) {
  const {t} = useTranslation();
  const [activeTab, setActiveTab] = useState('transform');
  const [localRotation, setLocalRotation] = useState(0);
  const [localScale, setLocalScale] = useState(100);
  const [localDimensionAngle, setLocalDimensionAngle] = useState(0);
  const [localCornerRadius, setLocalCornerRadius] = useState(5);

  const handleRotationInput = (e) => {
    const val = parseFloat(e.target.value) || 0;
    setLocalRotation(val);
  };

  const handleApplyRotation = () => {
    if (onRotateByAngle && localRotation !== 0) {
      onRotateByAngle(localRotation);
      setLocalRotation(0);
    }
  };

  const handleScaleInput = (e) => {
    const val = parseFloat(e.target.value) || 100;
    setLocalScale(val);
  };

  const handleApplyScale = () => {
    if (onApplyScale && localScale !== 100) {
      onApplyScale(localScale / 100);
      setLocalScale(100);
    }
  };

  return (
    <div className="border-b border-zinc-800 bg-zinc-900/50" data-testid="advanced-toolbar">
      <div className="flex items-center border-b border-zinc-800">
        <TabButton
          active={activeTab === 'transform'}
          onClick={() => setActiveTab('transform')}
          testId="toolbar-tab-transform"
        >
          {t('transform')}
        </TabButton>
        <TabButton
          active={activeTab === 'arrange'}
          onClick={() => setActiveTab('arrange')}
          testId="toolbar-tab-arrange"
        >
          {t('arrange')}
        </TabButton>
        <TabButton
          active={activeTab === 'edit'}
          onClick={() => setActiveTab('edit')}
          testId="toolbar-tab-edit"
        >
          {t('edit')}
        </TabButton>
        <TabButton
          active={activeTab === 'view'}
          onClick={() => setActiveTab('view')}
          testId="toolbar-tab-view"
        >
          {t('view')}
        </TabButton>
        <TabButton
          active={activeTab === 'text'}
          onClick={() => setActiveTab('text')}
          testId="toolbar-tab-text"
        >
          {t('textTab')}
        </TabButton>
        <TabButton
          active={activeTab === 'coloring'}
          onClick={() => setActiveTab('coloring')}
          testId="toolbar-tab-coloring"
        >
          {t('coloring')}
        </TabButton>
        <TabButton
          active={activeTab === 'dimensions'}
          onClick={() => setActiveTab('dimensions')}
          testId="toolbar-tab-dimensions"
        >
          {t('dimensions')}
        </TabButton>
        <TabButton
          active={activeTab === 'vectors'}
          onClick={() => setActiveTab('vectors')}
          testId="toolbar-tab-vectors"
        >
          {t('vectors')}
        </TabButton>
        <TabButton
          active={activeTab === 'outlines'}
          onClick={() => setActiveTab('outlines')}
          testId="toolbar-tab-outlines"
        >
          {t('outlines')}
        </TabButton>
        <TabButton
          active={activeTab === 'snap'}
          onClick={() => setActiveTab('snap')}
          testId="toolbar-tab-snap"
        >
          {t('snap') || 'Snap'}
        </TabButton>

        {selectedCount > 0 && (
          <span className="ml-auto mr-3 text-[10px] font-mono text-zinc-500">
            {selectedCount} {t('selected').toLowerCase()}
          </span>
        )}
      </div>

      <div className="p-2 min-h-[52px]">
        {activeTab === 'transform' && (
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{t('align')}</span>
              <div className="flex gap-0.5">
                <ButtonGroup>
                  <IconButton
                    icon={AlignLeft}
                    title={t('alignLeft')}
                    onClick={onAlignLeft}
                    disabled={!hasSelection}
                    testId="align-left"
                  />
                  <IconButton
                    icon={AlignCenter}
                    title={t('alignCenter')}
                    onClick={onAlignCenterH}
                    disabled={!hasSelection}
                    testId="align-center-h"
                  />
                  <IconButton
                    icon={AlignRight}
                    title={t('alignRight')}
                    onClick={onAlignRight}
                    disabled={!hasSelection}
                    testId="align-right"
                  />
                </ButtonGroup>
                <ButtonGroup>
                  <IconButton
                    icon={AlignStartVertical}
                    title={t('alignTop')}
                    onClick={onAlignTop}
                    disabled={!hasSelection}
                    testId="align-top"
                  />
                  <IconButton
                    icon={AlignCenterVertical}
                    title={t('alignCenterV')}
                    onClick={onAlignCenterV}
                    disabled={!hasSelection}
                    testId="align-center-v"
                  />
                  <IconButton
                    icon={AlignEndVertical}
                    title={t('alignBottom')}
                    onClick={onAlignBottom}
                    disabled={!hasSelection}
                    testId="align-bottom"
                  />
                </ButtonGroup>
              </div>
            </div>

            <Separator vertical/>

            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{t('flip')}</span>
              <ButtonGroup>
                <IconButton
                  icon={FlipHorizontal}
                  title={t('flipHorizontal')}
                  onClick={onFlipHorizontal}
                  disabled={!hasSelection}
                  testId="flip-horizontal"
                />
                <IconButton
                  icon={FlipVertical}
                  title={t('flipVertical')}
                  onClick={onFlipVertical}
                  disabled={!hasSelection}
                  testId="flip-vertical"
                />
              </ButtonGroup>
            </div>

            <Separator vertical/>

            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{t('rotate')}</span>
              <div className="flex items-center gap-1">
                <ButtonGroup>
                  <IconButton
                    icon={RotateCcw}
                    title={t('rotateCCW')}
                    onClick={() => onRotateCCW?.(-90)}
                    disabled={!hasSelection}
                    testId="rotate-ccw"
                  />
                  <IconButton
                    icon={RotateCw}
                    title={t('rotateCW')}
                    onClick={() => onRotateCW?.(90)}
                    disabled={!hasSelection}
                    testId="rotate-cw"
                  />
                </ButtonGroup>
              </div>
            </div>

            <Separator vertical/>

            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{t('angle')}</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={localRotation}
                  onChange={handleRotationInput}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyRotation()}
                  className="w-16 bg-zinc-800 border border-zinc-700 px-2 py-1 text-xs font-mono text-white focus:border-amber-500 focus:outline-none"
                  placeholder="0"
                  disabled={!hasSelection}
                  data-testid="rotation-input"
                />
                <span className="text-[9px] font-mono text-zinc-500">°</span>
                <button
                  onClick={handleApplyRotation}
                  disabled={!hasSelection || localRotation === 0}
                  className="px-2 py-1 text-[9px] font-mono uppercase bg-amber-500/20 text-amber-500 border border-amber-500/50 hover:bg-amber-500 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  data-testid="apply-rotation"
                >
                  OK
                </button>
              </div>
            </div>

            <Separator vertical/>

            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{t('scale')}</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={localScale}
                  onChange={handleScaleInput}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyScale()}
                  className="w-16 bg-zinc-800 border border-zinc-700 px-2 py-1 text-xs font-mono text-white focus:border-amber-500 focus:outline-none"
                  placeholder="100"
                  min={1}
                  max={1000}
                  disabled={!hasSelection}
                  data-testid="scale-input"
                />
                <Percent className="w-3 h-3 text-zinc-500"/>
                <button
                  onClick={handleApplyScale}
                  disabled={!hasSelection || localScale === 100}
                  className="px-2 py-1 text-[9px] font-mono uppercase bg-amber-500/20 text-amber-500 border border-amber-500/50 hover:bg-amber-500 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  data-testid="apply-scale"
                >
                  OK
                </button>
              </div>
            </div>

            <Separator vertical/>

            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{t('position')}</span>
              <IconButton
                icon={Crosshair}
                title={t('centerOnCanvas')}
                onClick={onCenterOnCanvas}
                testId="center-on-canvas"
              />
            </div>
          </div>
        )}

        {activeTab === 'arrange' && (
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{t('order')}</span>
              <ButtonGroup>
                <IconButton
                  icon={ArrowUp}
                  title={t('bringForward')}
                  onClick={onBringForward}
                  disabled={!hasSelection}
                  testId="bring-forward"
                />
                <IconButton
                  icon={ArrowDown}
                  title={t('sendBackward')}
                  onClick={onSendBackward}
                  disabled={!hasSelection}
                  testId="send-backward"
                />
              </ButtonGroup>
            </div>

            <Separator vertical/>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{t('visibility')}</span>
              <ButtonGroup>
                <IconButton
                  icon={Eye}
                  title={t('toggleVisibility')}
                  onClick={onToggleVisibility}
                  disabled={!hasSelection}
                  testId="toggle-visibility"
                />
                <IconButton
                  icon={Lock}
                  title={t('toggleLock')}
                  onClick={onToggleLock}
                  disabled={!hasSelection}
                  testId="toggle-lock"
                />
              </ButtonGroup>
            </div>

            <Separator vertical/>

            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{t('multiSelect')}</span>
              <ButtonGroup>
                <IconButton
                  icon={MousePointer2}
                  title={t('select')}
                  onClick={() => setSelectionMode?.('single')}
                  active={selectionMode === 'single'}
                  testId="selection-single"
                />
                <IconButton
                  icon={SquareDashedMousePointer}
                  title={t('marqueeSelect')}
                  onClick={() => setSelectionMode?.('marquee')}
                  active={selectionMode === 'marquee'}
                  testId="selection-marquee"
                />
              </ButtonGroup>
            </div>

            <Separator vertical/>

            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{t('selectAll')}</span>
              <ButtonGroup>
                <button
                  onClick={onSelectAll}
                  className="px-2 py-1 text-[9px] font-mono uppercase text-zinc-400 border border-zinc-700 hover:border-amber-500 hover:text-amber-500 transition-colors"
                  data-testid="select-all-btn"
                >
                  {t('all')}
                </button>
                <button
                  onClick={onDeselectAll}
                  className="px-2 py-1 text-[9px] font-mono uppercase text-zinc-400 border border-zinc-700 hover:border-amber-500 hover:text-amber-500 transition-colors"
                  data-testid="deselect-all-btn"
                >
                  {t('none')}
                </button>
              </ButtonGroup>
            </div>
          </div>
        )}

        {activeTab === 'edit' && (
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{t('clipboard')}</span>
              <ButtonGroup>
                <IconButton
                  icon={Copy}
                  title={`${t('copy')} (Ctrl+C)`}
                  onClick={onCopy}
                  disabled={!hasSelection}
                  testId="copy"
                />
                <IconButton
                  icon={Clipboard}
                  title={`${t('paste')} (Ctrl+V)`}
                  onClick={onPaste}
                  testId="paste"
                />
              </ButtonGroup>
            </div>

            <Separator vertical/>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{t('delete')}</span>
              <IconButton
                icon={Trash2}
                title={`${t('delete')} (Del)`}
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
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{t('grid')}</span>
              <ButtonGroup>
                <IconButton
                  icon={Grid3X3}
                  title={t('toggleGrid')}
                  onClick={() => setShowGrid?.(!showGrid)}
                  active={showGrid}
                  testId="toggle-grid"
                />
                <IconButton
                  icon={Magnet}
                  title={t('snapToGrid')}
                  onClick={() => setSnapToGrid?.(!snapToGrid)}
                  active={snapToGrid}
                  testId="toggle-snap"
                />
              </ButtonGroup>
            </div>
            <Separator vertical/>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{t('gridSize')}</span>
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

            <Separator vertical/>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{t('zoom')}</span>
              <div className="flex items-center gap-1">
                <ButtonGroup>
                  <IconButton
                    icon={ZoomOut}
                    title={t('zoomOut')}
                    onClick={() => setZoom?.(Math.max(25, zoom - 25))}
                    testId="zoom-out"
                  />
                  <IconButton
                    icon={ZoomIn}
                    title={t('zoomIn')}
                    onClick={() => setZoom?.(Math.min(200, zoom + 25))}
                    testId="zoom-in"
                  />
                  <IconButton
                    icon={Maximize2}
                    title={t('resetZoom')}
                    onClick={() => setZoom?.(100)}
                    testId="zoom-reset"
                  />
                </ButtonGroup>
                <span className="text-[10px] font-mono text-zinc-400 w-10 text-right">{zoom}%</span>
              </div>
            </div>

            <Separator vertical/>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{t('wireframe')}</span>
              <IconButton
                icon={Box}
                title={t('toggleWireframe')}
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
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{t('format')}</span>
              <ButtonGroup>
                <IconButton
                  icon={Bold}
                  title={`${t('bold')} (Ctrl+B)`}
                  onClick={() => {
                    if (selectedObject?.type === 'text') {
                      const isBold = selectedObject.fontWeight === 'bold';
                      onUpdateSelected?.({fontWeight: isBold ? 'normal' : 'bold'});
                    }
                  }}
                  active={selectedObject?.fontWeight === 'bold'}
                  disabled={!selectedObject || selectedObject?.type !== 'text'}
                  testId="text-bold"
                />
                <IconButton
                  icon={Italic}
                  title={`${t('italic')} (Ctrl+I)`}
                  onClick={() => {
                    if (selectedObject?.type === 'text') {
                      const isItalic = selectedObject.fontStyle === 'italic';
                      onUpdateSelected?.({fontStyle: isItalic ? 'normal' : 'italic'});
                    }
                  }}
                  active={selectedObject?.fontStyle === 'italic'}
                  disabled={!selectedObject || selectedObject?.type !== 'text'}
                  testId="text-italic"
                />
                <IconButton
                  icon={Underline}
                  title={`${t('underline')} (Ctrl+U)`}
                  onClick={() => {
                    if (selectedObject?.type === 'text') {
                      const isUnderline = selectedObject.textDecoration === 'underline';
                      onUpdateSelected?.({textDecoration: isUnderline ? 'none' : 'underline'});
                    }
                  }}
                  active={selectedObject?.textDecoration === 'underline'}
                  disabled={!selectedObject || selectedObject?.type !== 'text'}
                  testId="text-underline"
                />
              </ButtonGroup>
            </div>

            <Separator vertical/>

            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{t('fontFamily')}</span>
              <select
                value={selectedObject?.fontFamily || 'Arial, sans-serif'}
                onChange={(e) => onUpdateSelected?.({fontFamily: e.target.value})}
                disabled={!selectedObject || selectedObject?.type !== 'text'}
                className="bg-zinc-800 border border-zinc-700 px-2 py-1 text-xs font-mono text-white focus:border-amber-500 focus:outline-none disabled:opacity-50"
                data-testid="font-family-select"
              >
                {SYSTEM_FONTS.map((font) => (
                  <option key={font.name} value={font.family} style={{fontFamily: font.family}}>
                    {font.name}
                  </option>
                ))}
              </select>
            </div>

            <Separator vertical/>

            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{t('size')}</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={8}
                  max={200}
                  value={selectedObject?.fontSize || 24}
                  onChange={(e) => onUpdateSelected?.({fontSize: Number(e.target.value)})}
                  className="w-16 bg-zinc-800 border border-zinc-700 px-2 py-1 text-xs font-mono text-white focus:border-amber-500 focus:outline-none disabled:opacity-50"
                  disabled={!selectedObject || selectedObject?.type !== 'text'}
                  data-testid="text-size-input"
                />
                <span className="text-[10px] font-mono text-zinc-500">px</span>
              </div>
            </div>

            <Separator vertical/>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{t('align')}</span>
              <ButtonGroup>
                <IconButton
                  icon={AlignLeft}
                  title={t('alignLeft')}
                  onClick={() => onUpdateSelected?.({textAnchor: 'start'})}
                  active={selectedObject?.textAnchor === 'start' || !selectedObject?.textAnchor}
                  disabled={!selectedObject || selectedObject?.type !== 'text'}
                  testId="text-align-left"
                />
                <IconButton
                  icon={AlignCenter}
                  title={t('alignCenter')}
                  onClick={() => onUpdateSelected?.({textAnchor: 'middle'})}
                  active={selectedObject?.textAnchor === 'middle'}
                  disabled={!selectedObject || selectedObject?.type !== 'text'}
                  testId="text-align-center"
                />
                <IconButton
                  icon={AlignRight}
                  title={t('alignRight')}
                  onClick={() => onUpdateSelected?.({textAnchor: 'end'})}
                  active={selectedObject?.textAnchor === 'end'}
                  disabled={!selectedObject || selectedObject?.type !== 'text'}
                  testId="text-align-right"
                />
              </ButtonGroup>
            </div>

            {(!selectedObject || selectedObject?.type !== 'text') && (
              <span className="text-[10px] font-mono text-zinc-500 ml-4">
                {t('selectTextObject')}
              </span>
            )}
          </div>
        )}

        {activeTab === 'coloring' && (
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{t('colorMode')}</span>
              <ButtonGroup>
                <button
                  onClick={() => setColorMode?.('fill')}
                  className={`px-2 py-1 text-[9px] font-mono uppercase border transition-colors ${
                    colorMode === 'fill' || !colorMode
                      ? 'border-amber-500 text-amber-500 bg-amber-500/10'
                      : 'border-zinc-700 text-zinc-400 hover:border-amber-500 hover:text-amber-500'
                  }`}
                  data-testid="color-mode-fill"
                >
                  {t('fillAndStroke')}
                </button>
                <button
                  onClick={() => setColorMode?.('stroke')}
                  className={`px-2 py-1 text-[9px] font-mono uppercase border transition-colors ${
                    colorMode === 'stroke'
                      ? 'border-amber-500 text-amber-500 bg-amber-500/10'
                      : 'border-zinc-700 text-zinc-400 hover:border-amber-500 hover:text-amber-500'
                  }`}
                  data-testid="color-mode-stroke"
                >
                  {t('strokeOnly')}
                </button>
              </ButtonGroup>
            </div>

            <Separator vertical/>

            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{t('applyToSymbol')}</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedObject?.fill || '#F59E0B'}
                  onChange={(e) => {
                    if (colorMode === 'stroke') {
                      onUpdateSelected?.({stroke: e.target.value, fill: 'none'});
                    } else {
                      onUpdateSelected?.({fill: e.target.value, stroke: e.target.value});
                    }
                  }}
                  className="w-8 h-8 bg-transparent border border-zinc-700 cursor-pointer"
                  disabled={!hasSelection}
                  data-testid="symbol-color-picker"
                />
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => onApplyColorToSymbol?.('full')}
                    disabled={!hasSelection}
                    className="px-2 py-0.5 text-[9px] font-mono uppercase text-zinc-400 border border-zinc-700 hover:border-amber-500 hover:text-amber-500 disabled:opacity-50 transition-colors"
                    data-testid="apply-color-full"
                  >
                    {t('colorEntireSymbol')}
                  </button>
                  <button
                    onClick={() => onApplyColorToSymbol?.('border')}
                    disabled={!hasSelection}
                    className="px-2 py-0.5 text-[9px] font-mono uppercase text-zinc-400 border border-zinc-700 hover:border-amber-500 hover:text-amber-500 disabled:opacity-50 transition-colors"
                    data-testid="apply-color-border"
                  >
                    {t('colorBorderOnly')}
                  </button>
                </div>
              </div>
            </div>

            {!hasSelection && (
              <span className="text-[10px] font-mono text-zinc-500 ml-4">
                {t('selectVectorToSplit')}
              </span>
            )}
          </div>
        )}

        {activeTab === 'dimensions' && (
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{t('dimensionLines')}</span>
              <IconButton
                icon={Ruler}
                title={t('addDimension')}
                onClick={onAddDimensionLine}
                testId="add-dimension"
              />
            </div>

            <Separator vertical/>

            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{t('dimensionAngle')}</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={localDimensionAngle}
                  onChange={(e) => setLocalDimensionAngle(parseFloat(e.target.value) || 0)}
                  className="w-16 bg-zinc-800 border border-zinc-700 px-2 py-1 text-xs font-mono text-white focus:border-amber-500 focus:outline-none"
                  placeholder="0"
                  data-testid="dimension-angle-input"
                />
                <span className="text-[9px] font-mono text-zinc-500">°</span>
                <button
                  onClick={() => onUpdateDimensionLine?.({angle: localDimensionAngle})}
                  className="px-2 py-1 text-[9px] font-mono uppercase bg-amber-500/20 text-amber-500 border border-amber-500/50 hover:bg-amber-500 hover:text-black transition-colors"
                  data-testid="apply-dimension-angle"
                >
                  OK
                </button>
              </div>
            </div>

            <Separator vertical/>

            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{t('dimensionColor')}</span>
              <input
                type="color"
                value={dimensionColor || '#EF4444'}
                onChange={(e) => setDimensionColor?.(e.target.value)}
                className="w-8 h-8 bg-transparent border border-zinc-700 cursor-pointer"
                data-testid="dimension-color-picker"
              />
            </div>

            <span className="text-[10px] font-mono text-zinc-500 ml-4">
              {t('dragToRotate')} | {t('enterAngle')}
            </span>
          </div>
        )}

        {activeTab === 'vectors' && (
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{t('split')}</span>
              <ButtonGroup>
                <IconButton
                  icon={Split}
                  title={t('splitVector')}
                  onClick={onSplitVector}
                  disabled={!canSplitVector}
                  testId="split-vector"
                />
                <IconButton
                  icon={Scissors}
                  title={t('splitByCircle') || 'Split by Circle'}
                  onClick={onSplitByCircle}
                  disabled={!canSplitByCircle}
                  testId="split-by-circle"
                />
              </ButtonGroup>
            </div>

            <Separator vertical/>

            <div className="flex flex-col gap-1">
              <span
                className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{t('merge') || 'Merge'}</span>
              <IconButton
                icon={Merge}
                title={t('mergeVectors') || 'Merge Vectors'}
                onClick={onMergeVectors}
                disabled={!canMergeVectors}
                testId="merge-vectors"
              />
            </div>

            <Separator vertical/>

            <div className="flex flex-col gap-1">
              <span
                className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{t('cornerRadius') || 'Corners'}</span>
              <div className="flex items-center gap-1">
                <input
                  type="range"
                  min={0}
                  max={50}
                  value={localCornerRadius}
                  onChange={(e) => setLocalCornerRadius(Number(e.target.value))}
                  className="w-20 accent-amber-500"
                  data-testid="corner-radius-slider"
                />
                <span className="text-[10px] font-mono text-zinc-400 w-8">{localCornerRadius}px</span>
                <button
                  onClick={() => onApplyCornerRadius?.(localCornerRadius)}
                  disabled={!canApplyCornerRadius}
                  className="px-2 py-1 text-[9px] font-mono uppercase bg-amber-500/20 text-amber-500 border border-amber-500/50 hover:bg-amber-500 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  data-testid="apply-corner-radius"
                >
                  OK
                </button>
              </div>
            </div>

            <Separator vertical/>

            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{t('view')}</span>
              <IconButton
                icon={Box}
                title={t('toggleWireframe')}
                onClick={() => setWireframeMode?.(!wireframeMode)}
                active={wireframeMode}
                testId="toggle-wireframe-vectors"
              />
            </div>

            <Separator vertical/>

            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{t('sizeLock')}</span>
              <ButtonGroup>
                <IconButton
                  icon={LockKeyhole}
                  title={t('lockAllSizes')}
                  onClick={onLockAllSizes}
                  active={sizesLocked}
                  testId="lock-all-sizes"
                />
                <IconButton
                  icon={UnlockKeyhole}
                  title={t('unlockAllSizes')}
                  onClick={onUnlockAllSizes}
                  disabled={!sizesLocked}
                  testId="unlock-all-sizes"
                />
              </ButtonGroup>
            </div>

            {sizesLocked && (
              <span className="text-[10px] font-mono text-amber-500 ml-4">
                {t('allSizesLocked')}
              </span>
            )}

            {!hasSelection && (
              <span className="text-[10px] font-mono text-zinc-500 ml-4">
                {t('selectVectorToSplit')}
              </span>
            )}
          </div>
        )}

        {activeTab === 'outlines' && (
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{t('verify')}</span>
              <IconButton
                icon={CheckCircle}
                title={t('verifyOutlines')}
                onClick={onVerifyOutlines}
                disabled={!hasSelection}
                testId="verify-outlines"
              />
            </div>

            <Separator vertical/>

            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{t('center')}</span>
              <IconButton
                icon={Circle}
                title={t('generateCenterOutline')}
                onClick={onGenerateCenterOutline}
                disabled={!hasSelection}
                testId="generate-center-outline"
              />
            </div>

            {outlineStatus && (
              <>
                <Separator vertical/>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{t('status')}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono ${outlineStatus.isClosed ? 'text-green-500' : 'text-red-500'}`}>
                      {outlineStatus.isClosed ? t('closed') : t('open')}
                    </span>
                    {outlineStatus.center && (
                      <span className="text-[10px] font-mono text-zinc-400">
                        {t('center')}: ({outlineStatus.center.x.toFixed(1)}, {outlineStatus.center.y.toFixed(1)})
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}

            {!hasSelection && (
              <span className="text-[10px] font-mono text-zinc-500 ml-4">
                {t('selectOutlineToVerify')}
              </span>
            )}
          </div>
        )}

        {activeTab === 'snap' && (
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center gap-1">
            <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider text-center w-full block select-none">
              {t('snap') || 'Snap'}
            </span>
              <IconButton
                icon={Magnet}
                title={t('toggleSnap') || 'Toggle Snap'}
                onClick={() => setSnapEnabled?.(!snapEnabled)}
                active={snapEnabled}
                testId="toggle-snap-enabled"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span
                className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{t('snapTargets') || 'Targets'}</span>
              <ButtonGroup>
                <IconButton
                  icon={Target}
                  title={t('snapToCenter') || 'Snap to Center'}
                  onClick={() => setSnapToCenter?.(!snapToCenter)}
                  active={snapToCenter}
                  testId="snap-to-center"
                />
                <IconButton
                  icon={CircleDot}
                  title={t('snapToCircles') || 'Snap to Circles'}
                  onClick={() => setSnapToCircles?.(!snapToCircles)}
                  active={snapToCircles}
                  testId="snap-to-circles"
                />
                <IconButton
                  icon={Grid3X3}
                  title={t('snapToGrid')}
                  onClick={() => setSnapToGrid?.(!snapToGrid)}
                  active={snapToGrid}
                  testId="snap-to-grid-btn"
                />
              </ButtonGroup>
            </div>

            <Separator vertical/>

            <div className="flex flex-col gap-1">
              <span
                className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{t('guides') || 'Guides'}</span>
              <IconButton
                icon={Eye}
                title={t('showSnapGuides') || 'Show Snap Guides'}
                onClick={() => setShowSnapGuides?.(!showSnapGuides)}
                active={showSnapGuides}
                testId="show-snap-guides"
              />
            </div>

            <Separator vertical/>

            <div className="flex flex-col gap-1">
              <span
                className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{t('threshold') || 'Threshold'}</span>
              <div className="flex items-center gap-1">
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={snapThreshold || 5}
                  onChange={(e) => setSnapThreshold?.(Number(e.target.value))}
                  className="w-20 accent-amber-500"
                  data-testid="snap-threshold-slider"
                />
                <span className="text-[10px] font-mono text-zinc-400 w-8">{snapThreshold || 5}px</span>
              </div>
            </div>

            <Separator vertical/>

            <div className="flex flex-col gap-1">
              <span
                className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{t('quickSnap') || 'Quick Snap'}</span>
              <ButtonGroup>
                <button
                  onClick={onSnapToCenter}
                  disabled={!hasSelection}
                  className="px-2 py-1 text-[9px] font-mono uppercase text-zinc-400 border border-zinc-700 hover:border-amber-500 hover:text-amber-500 disabled:opacity-50 transition-colors"
                  data-testid="quick-snap-center"
                >
                  {t('center') || 'Center'}
                </button>
                <button
                  onClick={onSnapToInnerCircle}
                  disabled={!hasSelection}
                  className="px-2 py-1 text-[9px] font-mono uppercase text-zinc-400 border border-zinc-700 hover:border-amber-500 hover:text-amber-500 disabled:opacity-50 transition-colors"
                  data-testid="quick-snap-inner"
                >
                  {t('inner') || 'Inner'}
                </button>
                <button
                  onClick={onSnapToOuterCircle}
                  disabled={!hasSelection}
                  className="px-2 py-1 text-[9px] font-mono uppercase text-zinc-400 border border-zinc-700 hover:border-amber-500 hover:text-amber-500 disabled:opacity-50 transition-colors"
                  data-testid="quick-snap-outer"
                >
                  {t('outer') || 'Outer'}
                </button>
              </ButtonGroup>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdvancedToolbar;
