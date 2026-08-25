import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Layers } from 'lucide-react';
import { GroundedPoint } from '../types';

interface DocumentViewerProps {
  imageSrc: string;
  fileName: string;
  activePolygon?: GroundedPoint[];
  allPolygons?: Array<{ key: string; label: string; poly: GroundedPoint[] }>;
  onSelectField?: (key: string) => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  imageSrc,
  fileName,
  activePolygon,
  allPolygons = [],
  onSelectField,
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showAllPolygons, setShowAllPolygons] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const pointsToSvgPolygon = (points: GroundedPoint[]) => {
    return points.map((p) => `${p.x * 100}%,${p.y * 100}%`).join(' ');
  };

  return (
    <div className="relative flex flex-col h-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner select-none">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800 backdrop-blur-sm z-10">
        <span className="text-xs font-semibold text-slate-300 truncate max-w-xs">
          {fileName}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowAllPolygons(!showAllPolygons)}
            className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
              showAllPolygons
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Tüm kutuları göster / gizle"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Kutular</span>
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Uzaklaştır"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono text-slate-400 px-1">
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Yakınlaştır"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors ml-1"
            title="Sıfırla"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Image & Polygon Canvas */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative flex-1 overflow-hidden flex items-center justify-center p-4 cursor-${
          isDragging ? 'grabbing' : 'grab'
        }`}
      >
        <div
          className="relative transition-transform duration-75 origin-center shadow-2xl rounded-lg overflow-hidden bg-white"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          }}
        >
          <img
            src={imageSrc}
            alt={fileName}
            className="max-h-[75vh] w-auto object-contain block pointer-events-none"
            draggable={false}
          />

          {/* SVG Overlay for Bounding Polygons */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Render all detected field boxes */}
            {showAllPolygons &&
              allPolygons.map((item, idx) => {
                if (!item.poly || item.poly.length < 3) return null;
                const isCurrentActive =
                  activePolygon &&
                  JSON.stringify(activePolygon) === JSON.stringify(item.poly);
                if (isCurrentActive) return null; // rendered separately with highlight

                return (
                  <polygon
                    key={idx}
                    points={pointsToSvgPolygon(item.poly)}
                    fill="rgba(99, 102, 241, 0.15)"
                    stroke="#818cf8"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                    className="pointer-events-auto cursor-pointer transition-all hover:fill-indigo-500/30"
                    onClick={() => onSelectField && onSelectField(item.key)}
                  >
                    <title>{item.label}</title>
                  </polygon>
                );
              })}

            {/* Render currently focused field box (Active Highlight) */}
            {activePolygon && activePolygon.length >= 3 && (
              <polygon
                points={pointsToSvgPolygon(activePolygon)}
                fill="rgba(234, 179, 8, 0.35)"
                stroke="#eab308"
                strokeWidth="2.5"
                className="animate-pulse pointer-events-none shadow-lg"
              />
            )}
          </svg>
        </div>
      </div>
    </div>
  );
};
