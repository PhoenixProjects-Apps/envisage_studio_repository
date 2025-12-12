import React, { useState, useRef, useEffect } from 'react';
import { LayoutItem, GeneratedAsset } from '../types';
import { 
    Move, Trash2, type LucideIcon, Download, Plus, Type, RotateCw, Layers, 
    Undo, Redo, Magnet, Upload, Crop, Scissors, Square, MousePointer2,
    Circle, Minus, Save
} from 'lucide-react';
import html2canvas from 'html2canvas';

interface LayoutEditorProps {
  assets: GeneratedAsset[];
  onAssetCreated?: (asset: GeneratedAsset) => void;
}

const LayoutEditor: React.FC<LayoutEditorProps> = ({ assets, onAssetCreated }) => {
  // Main Canvas State
  const [items, setItems] = useState<LayoutItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
  // History State
  const [history, setHistory] = useState<LayoutItem[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Interaction State
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [snappingEnabled, setSnappingEnabled] = useState(true);
  const [snapGuides, setSnapGuides] = useState<{ type: 'x' | 'y', pos: number }[]>([]);

  // Crop State
  const [cropModeItem, setCropModeItem] = useState<string | null>(null);
  const [cropToolType, setCropToolType] = useState<'rect' | 'lasso'>('rect');
  const [cropRect, setCropRect] = useState({ t: 0, r: 0, b: 0, l: 0 }); // Insets %
  const [lassoPoints, setLassoPoints] = useState<{x: number, y: number}[]>([]);

  // Local Assets (Imports)
  const [importedAssets, setImportedAssets] = useState<GeneratedAsset[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const selectedItem = items.find(i => i.id === selectedItemId);
  const allAssets = [...importedAssets, ...assets];

  // --- History Management ---
  const recordHistory = (newItems: LayoutItem[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newItems);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setItems(history[historyIndex - 1]);
      setCropModeItem(null); // Exit crop mode on undo
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setItems(history[historyIndex + 1]);
      setCropModeItem(null);
    }
  };

  const updateItems = (newItems: LayoutItem[], record = true) => {
    setItems(newItems);
    if (record) recordHistory(newItems);
  };

  // --- Item Management ---
  const addToCanvas = (asset: GeneratedAsset) => {
    const newItem: LayoutItem = {
      id: Math.random().toString(36).substr(2, 9),
      type: asset.type === 'text' ? 'text' : 'image',
      content: asset.content,
      x: 50,
      y: 50,
      width: asset.type === 'image' ? 300 : 200,
      height: asset.type === 'image' ? 300 : 100,
      zIndex: items.length + 1,
      rotation: 0,
      borderRadius: 0,
      style: {}
    };
    const newItems = [...items, newItem];
    updateItems(newItems);
    setSelectedItemId(newItem.id);
  };

  const addText = () => {
    const newItem: LayoutItem = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'text',
        content: 'Double click to edit',
        x: 100,
        y: 100,
        width: 200,
        height: 60,
        zIndex: items.length + 1,
        rotation: 0,
        borderRadius: 0,
        style: {}
    }
    const newItems = [...items, newItem];
    updateItems(newItems);
    setSelectedItemId(newItem.id);
  }

  const addShape = (shapeType: 'rectangle' | 'circle' | 'line') => {
      const newItem: LayoutItem = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'shape',
        shapeType: shapeType,
        content: '',
        x: 150,
        y: 150,
        width: shapeType === 'line' ? 200 : 100,
        height: shapeType === 'line' ? 4 : 100,
        zIndex: items.length + 1,
        rotation: 0,
        borderRadius: shapeType === 'circle' ? 50 : 0,
        color: '#4f46e5', // Default Indigo
        style: {}
      };
      const newItems = [...items, newItem];
      updateItems(newItems);
      setSelectedItemId(newItem.id);
  }

  const handleDelete = () => {
    if (selectedItemId) {
      const newItems = items.filter(i => i.id !== selectedItemId);
      updateItems(newItems);
      setSelectedItemId(null);
    }
  };

  const handlePropertyChange = (prop: keyof LayoutItem, value: any) => {
    if (selectedItemId) {
        const newItems = items.map(item => 
            item.id === selectedItemId ? { ...item, [prop]: value } : item
        );
        updateItems(newItems, true); // Record history for property changes
    }
  };

  // --- Import ---
  const handleImportClick = () => fileInputRef.current?.click();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (typeof ev.target?.result === 'string') {
          const newAsset: GeneratedAsset = {
            id: `imported-${Date.now()}`,
            type: 'image',
            content: ev.target.result,
            createdAt: Date.now(),
            metadata: { prompt: 'Imported Image' }
          };
          setImportedAssets([newAsset, ...importedAssets]);
          addToCanvas(newAsset);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Export & Save ---
  const getCanvasImage = async (): Promise<string | null> => {
      if (canvasRef.current) {
          // Temporarily hide guides and tools if any are visible inside canvas
          // (Current impl renders guides inside canvasRef)
          const canvas = await html2canvas(canvasRef.current, {
              backgroundColor: '#09090b', // Keep background color
              scale: 2 // High res
          });
          return canvas.toDataURL('image/png');
      }
      return null;
  }

  const handleExport = async () => {
      const dataUrl = await getCanvasImage();
      if (dataUrl) {
          const link = document.createElement('a');
          link.download = `envisage-layout-${Date.now()}.png`;
          link.href = dataUrl;
          link.click();
      }
  };

  const handleSaveToProject = async () => {
      const dataUrl = await getCanvasImage();
      if (dataUrl && onAssetCreated) {
          const newAsset: GeneratedAsset = {
              id: `layout-${Date.now()}`,
              type: 'image',
              content: dataUrl,
              createdAt: Date.now(),
              metadata: { prompt: 'Saved Layout' }
          };
          onAssetCreated(newAsset);
          alert("Layout saved to project assets!");
      }
  };

  // --- Snapping & Dragging ---
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    if (cropModeItem) return; // Disable dragging during crop
    e.stopPropagation();
    const item = items.find((i) => i.id === id);
    if (item) {
      setSelectedItemId(id);
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - item.x,
        y: e.clientY - item.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && selectedItemId && !cropModeItem) {
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;
      
      const guides: { type: 'x' | 'y', pos: number }[] = [];

      if (snappingEnabled && canvasRef.current) {
        const SNAP_THRESHOLD = 10;
        const rect = canvasRef.current.getBoundingClientRect();
        
        // Snap X
        if (Math.abs(newX) < SNAP_THRESHOLD) { newX = 0; guides.push({type: 'x', pos: 0}); }
        
        // Snap Y
        if (Math.abs(newY) < SNAP_THRESHOLD) { newY = 0; guides.push({type: 'y', pos: 0}); }

        // Snap to other items
        const currentItem = items.find(i => i.id === selectedItemId);
        if (currentItem) {
            items.forEach(other => {
                if (other.id === selectedItemId) return;
                
                // Left-Left
                if (Math.abs(newX - other.x) < SNAP_THRESHOLD) { 
                    newX = other.x; 
                    guides.push({type: 'x', pos: other.x});
                }
                // Top-Top
                if (Math.abs(newY - other.y) < SNAP_THRESHOLD) { 
                    newY = other.y; 
                    guides.push({type: 'y', pos: other.y});
                }
            });
        }
      }

      setSnapGuides(guides);

      setItems((prev) =>
        prev.map((item) =>
          item.id === selectedItemId
            ? { ...item, x: newX, y: newY }
            : item
        )
      );
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
        setIsDragging(false);
        setSnapGuides([]);
        recordHistory(items); // Commit drag to history
    }
  };

  // --- Crop Logic ---
  const startCrop = () => {
    if (selectedItemId) {
        setCropModeItem(selectedItemId);
        setCropToolType('rect');
        setCropRect({ t: 0, r: 0, b: 0, l: 0 });
        setLassoPoints([]);
    }
  };

  const applyCrop = () => {
    if (cropModeItem) {
        let clipPath = '';
        if (cropToolType === 'rect') {
            clipPath = `inset(${cropRect.t}% ${cropRect.r}% ${cropRect.b}% ${cropRect.l}%)`;
        } else if (cropToolType === 'lasso' && lassoPoints.length > 2) {
            const pointsStr = lassoPoints.map(p => `${p.x}% ${p.y}%`).join(', ');
            clipPath = `polygon(${pointsStr})`;
        }

        if (clipPath) {
            const newItems = items.map(item => 
                item.id === cropModeItem 
                ? { ...item, style: { ...item.style, clipPath } } 
                : item
            );
            updateItems(newItems);
        }
        setCropModeItem(null);
    }
  };

  const handleCropClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (cropModeItem && cropToolType === 'lasso') {
          // Calculate click position as percentage of element
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          setLassoPoints([...lassoPoints, { x, y }]);
      }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedItemId(null);
      setCropModeItem(null);
    }
  };

  // --- Rendering ---
  return (
    <div className="flex h-full" onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}>
      {/* Sidebar of Available Assets */}
      <div className="w-64 bg-zinc-900 border-r border-zinc-800 p-4 overflow-y-auto shrink-0">
        <h3 className="text-zinc-400 font-semibold mb-4 text-sm uppercase tracking-wider">Asset Library</h3>
        <div className="space-y-3">
           <div className="flex gap-2">
                <button onClick={handleImportClick} className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm text-zinc-300 flex items-center justify-center gap-2">
                    <Upload size={16}/> Import
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
           </div>
           
           <button onClick={addText} className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm text-zinc-300 flex items-center justify-center gap-2">
            <Type size={16}/> Add Text Box
          </button>
          
          <div className="grid grid-cols-3 gap-2">
              <button onClick={() => addShape('rectangle')} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 flex justify-center" title="Rectangle"><Square size={16}/></button>
              <button onClick={() => addShape('circle')} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 flex justify-center" title="Circle"><Circle size={16}/></button>
              <button onClick={() => addShape('line')} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 flex justify-center" title="Line"><Minus size={16}/></button>
          </div>

          {allAssets.length === 0 && (
            <p className="text-zinc-600 text-sm italic">Generate or import assets to begin.</p>
          )}

          {allAssets.map((asset) => (
            <div
              key={asset.id}
              className="group relative rounded-lg border border-zinc-700 overflow-hidden cursor-pointer hover:border-indigo-500 transition-colors bg-zinc-800"
              onClick={() => addToCanvas(asset)}
            >
              {asset.type === 'image' && (
                <img src={asset.content} alt="Asset" className="w-full h-24 object-cover" />
              )}
               {asset.type === 'video' && (
                <div className="w-full h-24 bg-zinc-950 flex items-center justify-center text-zinc-500 text-xs">
                    VIDEO (Preview Only)
                </div>
              )}
              {asset.type === 'text' && (
                <div className="p-2 text-xs text-zinc-300 h-24 overflow-hidden">
                  {asset.content}
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Plus className="text-white" size={24} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 bg-zinc-950 relative overflow-hidden flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="h-12 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between px-4 shrink-0">
             <div className="flex items-center gap-2">
                <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30">
                    <Undo size={18} />
                </button>
                <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30">
                    <Redo size={18} />
                </button>
                <div className="w-px h-4 bg-zinc-700 mx-2"></div>
                <button 
                    onClick={() => setSnappingEnabled(!snappingEnabled)}
                    className={`p-1.5 rounded ${snappingEnabled ? 'bg-indigo-600/20 text-indigo-400' : 'text-zinc-400 hover:text-white'}`}
                    title="Toggle Snapping"
                >
                    <Magnet size={18} />
                </button>
             </div>
             
             <div className="flex items-center gap-2">
                {selectedItemId && !cropModeItem && selectedItem?.type === 'image' && (
                     <button onClick={startCrop} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded text-sm">
                        <Crop size={14} /> Crop
                    </button>
                )}
                {selectedItemId && (
                    <button onClick={handleDelete} className="p-1.5 text-red-400 hover:bg-red-900/30 rounded">
                        <Trash2 size={18} />
                    </button>
                )}
                <div className="w-px h-4 bg-zinc-700 mx-2"></div>
                {onAssetCreated && (
                    <button onClick={handleSaveToProject} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded text-sm">
                        <Save size={16} /> Save to Project
                    </button>
                )}
                <button onClick={handleExport} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-sm">
                    <Download size={16} /> Export
                </button>
             </div>
        </div>

        {/* Canvas */}
        <div 
            ref={canvasRef}
            className="flex-1 relative cursor-default overflow-hidden"
            onClick={handleCanvasClick}
            style={{ 
                backgroundImage: 'radial-gradient(#27272a 1px, transparent 1px)', 
                backgroundSize: '20px 20px' 
            }}
        >
          {/* Snap Guides */}
          {snapGuides.map((guide, i) => (
              <div 
                key={i} 
                className={`absolute bg-indigo-500 z-50 ${guide.type === 'x' ? 'w-px h-full top-0' : 'h-px w-full left-0'}`}
                style={guide.type === 'x' ? { left: guide.pos } : { top: guide.pos }}
              />
          ))}

          {items.map((item) => {
            const isCroppingThis = cropModeItem === item.id;
            
            return (
            <div
              key={item.id}
              style={{
                position: 'absolute',
                left: item.x,
                top: item.y,
                width: item.width,
                height: item.height,
                zIndex: item.zIndex,
                transform: `rotate(${item.rotation}deg)`,
                cursor: isDragging && selectedItemId === item.id ? 'grabbing' : isCroppingThis ? 'crosshair' : 'grab',
                ...(isCroppingThis ? {} : item.style) // Apply clip-path if NOT cropping (to show full image during crop)
              }}
              className={`group ${selectedItemId === item.id && !isCroppingThis ? 'ring-2 ring-indigo-500' : ''}`}
              onMouseDown={(e) => handleMouseDown(e, item.id)}
            >
              {item.type === 'image' && (
                <div className="w-full h-full relative" onClick={isCroppingThis ? handleCropClick : undefined}>
                    <img 
                        src={item.content} 
                        alt="Canvas Item" 
                        className="w-full h-full object-cover pointer-events-none select-none shadow-lg" 
                        style={{ 
                            borderRadius: `${item.borderRadius}px`,
                            ...(isCroppingThis && item.style?.clipPath ? { opacity: 0.5 } : {})
                        }}
                    />
                    
                    {isCroppingThis && (
                        <div className="absolute inset-0 z-50">
                            {/* Toolbar for Crop */}
                            <div className="absolute -top-12 left-0 bg-zinc-800 rounded flex items-center p-1 shadow-xl border border-zinc-700 gap-1 pointer-events-auto" onMouseDown={e => e.stopPropagation()}>
                                <button onClick={() => setCropToolType('rect')} className={`p-1 rounded ${cropToolType === 'rect' ? 'bg-indigo-600' : 'hover:bg-zinc-700'}`}><Square size={16}/></button>
                                <button onClick={() => setCropToolType('lasso')} className={`p-1 rounded ${cropToolType === 'lasso' ? 'bg-indigo-600' : 'hover:bg-zinc-700'}`}><Scissors size={16}/></button>
                                <div className="w-px h-4 bg-zinc-600 mx-1"></div>
                                <button onClick={applyCrop} className="px-2 py-0.5 bg-green-600 rounded text-xs text-white font-medium">Apply</button>
                                <button onClick={() => setCropModeItem(null)} className="px-2 py-0.5 bg-red-600 rounded text-xs text-white font-medium">Cancel</button>
                            </div>

                            {/* Rect Crop UI */}
                            {cropToolType === 'rect' && (
                                <div 
                                    className="absolute inset-0 border-2 border-indigo-500 bg-indigo-500/10"
                                    style={{
                                        top: `${cropRect.t}%`, right: `${cropRect.r}%`, bottom: `${cropRect.b}%`, left: `${cropRect.l}%`
                                    }}
                                >
                                </div>
                            )}

                            {/* Lasso Crop UI */}
                            {cropToolType === 'lasso' && (
                                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                    <polygon 
                                        points={lassoPoints.map(p => `${p.x}%,${p.y}%`).join(' ')} 
                                        fill="rgba(79, 70, 229, 0.3)" 
                                        stroke="#6366f1" 
                                        strokeWidth="2"
                                    />
                                    {lassoPoints.map((p, i) => (
                                        <circle key={i} cx={`${p.x}%`} cy={`${p.y}%`} r="3" fill="white" stroke="#6366f1" />
                                    ))}
                                </svg>
                            )}
                        </div>
                    )}
                </div>
              )}
              {item.type === 'text' && (
                <div 
                    className="w-full h-full bg-transparent text-white p-2 border border-dashed border-zinc-600 hover:border-zinc-400 overflow-hidden"
                    style={{ borderRadius: `${item.borderRadius}px` }}
                >
                  {item.content}
                </div>
              )}
              {item.type === 'shape' && (
                  <div 
                    className="w-full h-full"
                    style={{ 
                        backgroundColor: item.color, 
                        borderRadius: `${item.borderRadius}%` // For shapes we use % often for circle, but logic can vary
                    }} 
                  />
              )}
            </div>
          )})}
        </div>
      </div>

      {/* Right Property Panel */}
      <div className="w-64 bg-zinc-900 border-l border-zinc-800 p-4 shrink-0 overflow-y-auto">
         <h3 className="text-zinc-400 font-semibold mb-4 text-sm uppercase tracking-wider">Properties</h3>
         {selectedItem ? (
            <div className="space-y-4">
                {/* Position */}
                <div>
                    <label className="text-xs text-zinc-500 font-medium mb-1 block">Position</label>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-zinc-950 rounded border border-zinc-800 flex items-center px-2">
                            <span className="text-zinc-500 text-xs w-4">X</span>
                            <input 
                                type="number" 
                                value={Math.round(selectedItem.x)} 
                                onChange={(e) => handlePropertyChange('x', Number(e.target.value))}
                                className="w-full bg-transparent border-none text-white text-sm py-1 focus:ring-0"
                            />
                        </div>
                        <div className="bg-zinc-950 rounded border border-zinc-800 flex items-center px-2">
                            <span className="text-zinc-500 text-xs w-4">Y</span>
                             <input 
                                type="number" 
                                value={Math.round(selectedItem.y)} 
                                onChange={(e) => handlePropertyChange('y', Number(e.target.value))}
                                className="w-full bg-transparent border-none text-white text-sm py-1 focus:ring-0"
                            />
                        </div>
                    </div>
                </div>

                {/* Dimensions */}
                <div>
                    <label className="text-xs text-zinc-500 font-medium mb-1 block">Dimensions</label>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-zinc-950 rounded border border-zinc-800 flex items-center px-2">
                            <span className="text-zinc-500 text-xs w-4">W</span>
                             <input 
                                type="number" 
                                value={Math.round(selectedItem.width)} 
                                onChange={(e) => handlePropertyChange('width', Number(e.target.value))}
                                className="w-full bg-transparent border-none text-white text-sm py-1 focus:ring-0"
                            />
                        </div>
                        <div className="bg-zinc-950 rounded border border-zinc-800 flex items-center px-2">
                            <span className="text-zinc-500 text-xs w-4">H</span>
                             <input 
                                type="number" 
                                value={Math.round(selectedItem.height)} 
                                onChange={(e) => handlePropertyChange('height', Number(e.target.value))}
                                className="w-full bg-transparent border-none text-white text-sm py-1 focus:ring-0"
                            />
                        </div>
                    </div>
                </div>

                {/* Rotation & Z-Index */}
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-xs text-zinc-500 font-medium mb-1 block">Rotation</label>
                        <div className="bg-zinc-950 rounded border border-zinc-800 flex items-center px-2">
                             <RotateCw size={12} className="text-zinc-500 mr-2" />
                             <input 
                                type="number" 
                                value={selectedItem.rotation} 
                                onChange={(e) => handlePropertyChange('rotation', Number(e.target.value))}
                                className="w-full bg-transparent border-none text-white text-sm py-1 focus:ring-0"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-zinc-500 font-medium mb-1 block">Layer</label>
                        <div className="bg-zinc-950 rounded border border-zinc-800 flex items-center px-2">
                             <Layers size={12} className="text-zinc-500 mr-2" />
                             <input 
                                type="number" 
                                value={selectedItem.zIndex} 
                                onChange={(e) => handlePropertyChange('zIndex', Number(e.target.value))}
                                className="w-full bg-transparent border-none text-white text-sm py-1 focus:ring-0"
                            />
                        </div>
                    </div>
                </div>

                 {/* Styling: Corner Radius & Color */}
                 <div>
                    <label className="text-xs text-zinc-500 font-medium mb-1 block">Style</label>
                     <div className="space-y-2">
                        {/* Radius */}
                        <div className="bg-zinc-950 rounded border border-zinc-800 flex items-center px-2">
                             <span className="text-zinc-500 text-[10px] w-8">Radius</span>
                             <input 
                                type="range" 
                                min="0" max="100"
                                value={selectedItem.borderRadius || 0} 
                                onChange={(e) => handlePropertyChange('borderRadius', Number(e.target.value))}
                                className="flex-1 mr-2"
                            />
                            <span className="text-xs w-6 text-right">{selectedItem.borderRadius || 0}</span>
                        </div>
                        
                        {/* Shape Color */}
                        {selectedItem.type === 'shape' && (
                             <div className="bg-zinc-950 rounded border border-zinc-800 flex items-center px-2 py-1">
                                <span className="text-zinc-500 text-[10px] w-8">Color</span>
                                <input 
                                    type="color"
                                    value={selectedItem.color || '#ffffff'}
                                    onChange={(e) => handlePropertyChange('color', e.target.value)}
                                    className="w-full h-6 bg-transparent border-none cursor-pointer"
                                />
                             </div>
                        )}
                     </div>
                 </div>


                {/* Crop Fine Tuning */}
                {cropModeItem === selectedItem.id && cropToolType === 'rect' && (
                    <div className="p-3 bg-indigo-900/20 border border-indigo-500/50 rounded">
                        <h4 className="text-xs font-bold text-indigo-400 mb-2">Crop Adjustments</h4>
                        <div className="space-y-2">
                            {['t', 'r', 'b', 'l'].map((side) => (
                                <div key={side} className="flex items-center text-xs">
                                    <span className="w-4 uppercase text-zinc-500">{side}</span>
                                    <input 
                                        type="range" min="0" max="50" 
                                        value={(cropRect as any)[side]} 
                                        onChange={(e) => setCropRect({...cropRect, [side]: Number(e.target.value)})}
                                        className="flex-1"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Content Edit for Text */}
                 {selectedItem.type === 'text' && (
                    <div>
                        <label className="text-xs text-zinc-500 font-medium mb-1 block">Text Content</label>
                        <textarea
                            value={selectedItem.content}
                            onChange={(e) => handlePropertyChange('content', e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white text-sm focus:outline-none focus:border-indigo-500 min-h-[80px]"
                        />
                    </div>
                )}
            </div>
         ) : (
            <div className="flex flex-col items-center justify-center h-40 text-zinc-600">
                <p className="text-sm">Select an element to edit properties</p>
            </div>
         )}
      </div>
    </div>
  );
};

export default LayoutEditor;