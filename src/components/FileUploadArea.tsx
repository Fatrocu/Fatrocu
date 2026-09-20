import React, { useRef, useState, useCallback, useEffect } from 'react';
import { UploadCloud, FileText, X, ChevronDown } from 'lucide-react';
import { InvoiceConfig } from '../types';
import { Spinner } from './Spinner';

interface FileUploadAreaProps {
  configs: InvoiceConfig[];
  activeConfigId: string;
  onSelectConfig: (id: string) => void;
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
  processingProgress: { current: number; total: number };
}

const ACCEPTED = '.pdf,.png,.jpg,.jpeg,.tiff,.tif,.bmp,.webp';
const ACCEPTED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/tiff', 'image/bmp', 'image/webp', ''];

export const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  configs,
  activeConfigId,
  onSelectConfig,
  onFilesSelected,
  isProcessing,
  processingProgress,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [queue, setQueue] = useState<File[]>([]);

  const addFiles = (files: FileList | File[]) => {
    const valid = Array.from(files).filter(
      (f) => ACCEPTED_TYPES.includes(f.type) || f.name.match(/\.(pdf|png|jpe?g|tiff?|bmp|webp)$/i)
    );
    setQueue((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size));
      return [...prev, ...valid.filter((f) => !existing.has(f.name + f.size))];
    });
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }, []);

  const removeFromQueue = (idx: number) => setQueue((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = () => {
    if (queue.length === 0 || isProcessing) return;
    onFilesSelected(queue);
    setQueue([]);
  };

  const pct = processingProgress.total > 0
    ? Math.round((processingProgress.current / processingProgress.total) * 100)
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Template selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, color: '#666', flexShrink: 0 }}>Şablon:</span>
        <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
          <select
            value={activeConfigId}
            onChange={(e) => onSelectConfig(e.target.value)}
            style={{ width: '100%', appearance: 'none', paddingRight: 28 }}
          >
            {configs.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <ChevronDown
            size={13}
            color="#555"
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          />
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !isProcessing && inputRef.current?.click()}
        style={{
          border: `1px dashed ${dragging ? '#555' : '#222'}`,
          borderRadius: 10,
          padding: '48px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          cursor: isProcessing ? 'not-allowed' : 'pointer',
          background: dragging ? '#141414' : '#0d0d0d',
          transition: 'all 0.15s',
          userSelect: 'none',
        }}
      >
        <UploadCloud size={28} color={dragging ? '#888' : '#333'} />
        <span style={{ color: '#555', fontSize: 12 }}>
          PDF, PNG, JPEG veya TIFF sürükleyin / tıklayın
        </span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED}
          style={{ display: 'none' }}
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {/* Queue */}
      {queue.length > 0 && (
        <div className="card" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 11, color: '#555', marginBottom: 4, fontWeight: 600 }}>
            KUYRUK ({queue.length})
          </div>
          {queue.map((f, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '5px 8px',
                borderRadius: 6,
                background: '#111',
                fontSize: 12,
              }}
            >
              <FileText size={12} color="#555" />
              <span style={{ flex: 1, color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.name}
              </span>
              <span style={{ color: '#444', fontSize: 11, flexShrink: 0 }}>
                {(f.size / 1024).toFixed(0)} KB
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); removeFromQueue(i); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', padding: 2 }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Process / Progress */}
      {isProcessing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: '#555' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Spinner size={12} />
              İşleniyor…
            </span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {processingProgress.current}/{processingProgress.total}
            </span>
          </div>
          <div style={{ height: 3, background: '#1a1a1a', borderRadius: 99, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                background: '#fff',
                borderRadius: 99,
                width: `${pct}%`,
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={queue.length === 0}
          style={{
            padding: '9px 20px',
            borderRadius: 7,
            border: 'none',
            background: queue.length === 0 ? '#1a1a1a' : '#fff',
            color: queue.length === 0 ? '#333' : '#000',
            fontSize: 12,
            fontWeight: 700,
            cursor: queue.length === 0 ? 'not-allowed' : 'pointer',
            transition: 'all 0.12s',
            alignSelf: 'flex-end',
          }}
        >
          {queue.length > 0 ? `${queue.length} Belgeyi İşle →` : 'Belge Seçin'}
        </button>
      )}
    </div>
  );
};
