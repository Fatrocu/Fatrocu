import React, { useRef, useState, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Move } from 'lucide-react';
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
      const maxX = Math.max(0, (imgSize.w * s - (containerRef.current?.clientWidth ?? imgSize.w)) / 2 + 40);
      const maxY = Math.max(0, (imgSize.h * s - (containerRef.current?.clientHeight ?? imgSize.h)) / 2 + 40);
      return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) };
    },
    [imgSize]
  );

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((s) => Math.max(0.3, Math.min(4, s + delta)));
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#090909', borderRadius: 10, border: '1px solid #1a1a1a', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderBottom: '1px solid #1a1a1a', flexShrink: 0 }}>
        <span style={{ flex: 1, fontSize: 11, color: '#444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {fileName}
        </span>
        {[
          { Icon: ZoomOut,    action: () => setScale((s) => Math.max(0.3, s - 0.15)), title: 'Uzaklaştır' },
          { Icon: ZoomIn,     action: () => setScale((s) => Math.min(4, s + 0.15)),   title: 'Yakınlaştır' },
          { Icon: Maximize2,  action: resetView,                                        title: 'Sıfırla' },
        ].map(({ Icon, action, title }) => (
          <button
            key={title}
            onClick={action}
            title={title}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 4, borderRadius: 4, display: 'flex' }}
          >
            <Icon size={13} />
          </button>
        ))}
        <span style={{ fontSize: 10, color: '#333', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
          {Math.round(scale * 100)}%
        </span>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={() => setPanning(false)}
        onMouseLeave={() => setPanning(false)}
        style={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
          cursor: panning ? 'grabbing' : 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: 'center', position: 'relative', lineHeight: 0 }}>
          <img
            ref={imgRef}
            src={imageSrc.startsWith('data:') ? imageSrc : `data:image/png;base64,${imageSrc}`}
            alt={fileName}
            onLoad={(e) => {
              const img = e.currentTarget;
              setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
            }}
            style={{ display: 'block', maxWidth: '100%', userSelect: 'none', pointerEvents: 'none' }}
            draggable={false}
          />

          {/* SVG overlays */}
          {imgSize.w > 1 && (
            <svg
              viewBox={`0 0 ${imgSize.w} ${imgSize.h}`}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
            >
              {allPolygons.map(({ key, poly }) => (
                <polygon
                  key={key}
                  points={polyToSvg(poly)}
                  fill="rgba(255,255,255,0.04)"
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth={1.5}
                />
              ))}
              {activePolygon && activePolygon.length >= 3 && (
                <polygon
                  points={polyToSvg(activePolygon)}
                  fill="rgba(255,255,255,0.12)"
                  stroke="#fff"
                  strokeWidth={2}
                />
              )}
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};
