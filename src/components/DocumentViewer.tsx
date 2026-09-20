import React, { useRef, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Crosshair } from 'lucide-react';
import { GroundedPoint } from '../types';

interface DocumentViewerProps {
  imageSrc: string;
  fileName: string;
  activePolygon?: GroundedPoint[];
  allPolygons?: { key: string; label: string; poly: GroundedPoint[] }[];
  onSelectField?: (key: string) => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  imageSrc,
  fileName,
  activePolygon,
  allPolygons = [],
  onSelectField,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const panStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });
  const [imgSize, setImgSize] = useState({ w: 1, h: 1 });
  const imgRef = useRef<HTMLImageElement>(null);

  const clampOffset = useCallback(
    (x: number, y: number, s: number) => {
      const maxX = Math.max(0, (imgSize.w * s - (containerRef.current?.clientWidth ?? imgSize.w)) / 2 + 60);
      const maxY = Math.max(0, (imgSize.h * s - (containerRef.current?.clientHeight ?? imgSize.h)) / 2 + 60);
      return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) };
    },
    [imgSize]
  );

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setScale((s) => Math.max(0.3, Math.min(4.5, s + delta)));
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setPanning(true);
    panStart.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!panning) return;
    const nx = panStart.current.ox + (e.clientX - panStart.current.mx);
    const ny = panStart.current.oy + (e.clientY - panStart.current.my);
    setOffset(clampOffset(nx, ny, scale));
  };

  const resetView = () => { setScale(1); setOffset({ x: 0, y: 0 }); };

  const polyToSvg = (poly: GroundedPoint[]) =>
    poly.map((p) => `${p.x * imgSize.w},${p.y * imgSize.h}`).join(' ');

  return (
    <div className="scribble-card bg-white h-full flex flex-col overflow-hidden">
      
      {/* Top Sketch Toolbar */}
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b-[2.5px] border-black bg-neutral-50 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Crosshair size={18} className="text-black shrink-0 stroke-[2.5]" />
          <span className="font-heading font-extrabold text-sm text-black truncate">
            {fileName}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-white border-2 border-black rounded-lg p-1 shadow-[2px_2px_0px_#000] gap-1">
            <button
              onClick={() => setScale((s) => Math.max(0.3, s - 0.2))}
              className="p-1 hover:bg-neutral-100 rounded text-black transition-colors"
              title="Uzaklaştır"
            >
              <ZoomOut size={16} className="stroke-[2.5]" />
            </button>
            <span className="font-heading font-black text-xs px-2 text-black font-mono">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale((s) => Math.min(4.5, s + 0.2))}
              className="p-1 hover:bg-neutral-100 rounded text-black transition-colors"
              title="Yakınlaştır"
            >
              <ZoomIn size={16} className="stroke-[2.5]" />
            </button>
          </div>

          <button
            onClick={resetView}
            className="p-2 border-2 border-black rounded-lg bg-white hover:bg-neutral-100 shadow-[2px_2px_0px_#000] text-black transition-all"
            title="Görünümü Sıfırla"
          >
            <Maximize2 size={16} className="stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Canvas Area with Hand-drawn graph paper texture */}
      <div
        ref={containerRef}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={() => setPanning(false)}
        onMouseLeave={() => setPanning(false)}
        className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing flex items-center justify-center bg-neutral-100/50"
        style={{
          backgroundImage: 'linear-gradient(#0000000a 1px, transparent 1px), linear-gradient(90deg, #0000000a 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        <div
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: 'center',
            position: 'relative',
            lineHeight: 0,
          }}
          className="border-[3px] border-black shadow-[8px_8px_0px_#000] bg-white"
        >
          <img
            ref={imgRef}
            src={imageSrc.startsWith('data:') ? imageSrc : `data:image/png;base64,${imageSrc}`}
            alt={fileName}
            onLoad={(e) => {
              const img = e.currentTarget;
              setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
            }}
            className="block max-w-none select-none pointer-events-none"
            draggable={false}
          />

          {/* SVG coordinate bounding box overlays */}
          {imgSize.w > 1 && (
            <svg
              viewBox={`0 0 ${imgSize.w} ${imgSize.h}`}
              className="absolute inset-0 w-full h-full pointer-events-none"
            >
              {allPolygons.map(({ key, poly }) => (
                <polygon
                  key={key}
                  points={polyToSvg(poly)}
                  fill="rgba(0,0,0,0.06)"
                  stroke="#000000"
                  strokeWidth={2.5}
                  strokeDasharray="4 2"
                />
              ))}
              {activePolygon && activePolygon.length >= 3 && (
                <polygon
                  points={polyToSvg(activePolygon)}
                  fill="rgba(0,0,0,0.18)"
                  stroke="#000000"
                  strokeWidth={3.5}
                />
              )}
            </svg>
          )}
        </div>
      </div>

    </div>
  );
};
