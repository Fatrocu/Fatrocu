import React, { useRef, useState, useCallback } from 'react';
import { UploadCloud, FileText, X, ChevronDown, Sparkles, Scissors, Layers, CheckCircle } from 'lucide-react';
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
    <div className="flex flex-col gap-6">
      
      {/* Template selector card with scribble aesthetics */}
      <div className="scribble-card p-5 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg border-2 border-black flex items-center justify-center bg-neutral-100 shadow-[2px_2px_0px_#000]">
            <Layers size={20} className="text-black stroke-[2.5]" />
          </div>
          <div>
            <span className="font-heading font-bold text-base text-black block">
              Fatura Tipi / Şablon
            </span>
            <span className="font-scribble text-xs text-neutral-500 font-bold block">
              Veri çıkarma kurallarını seç
            </span>
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <select
            value={activeConfigId}
            onChange={(e) => onSelectConfig(e.target.value)}
            className="w-full font-heading font-semibold text-sm appearance-none pr-10 bg-white border-[2.5px] border-black rounded-xl p-3 shadow-[3px_3px_0px_#000] cursor-pointer"
          >
            {configs.map((c) => (
              <option key={c.id} value={c.id} className="text-black font-semibold">
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={18}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-black stroke-[3]"
          />
        </div>
      </div>

      {/* Large Doodle Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !isProcessing && inputRef.current?.click()}
        className={`relative border-[3px] border-dashed rounded-2xl p-12 md:p-16 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all select-none bg-white ${
          dragging
            ? 'border-black bg-neutral-100 shadow-[8px_8px_0px_#000] scale-[0.99]'
            : 'border-black shadow-[6px_6px_0px_#000] hover:shadow-[9px_9px_0px_#000] hover:-translate-y-0.5'
        }`}
      >
        {/* Handcrafted Tape decoration at top */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white border-2 border-black px-4 py-1 text-xs font-scribble font-black shadow-[2px_2px_0px_#000] rotate-[-1deg]">
          [ TARA VEYA BIRAK ]
        </div>

        {/* Big sketch icon */}
        <div className="w-20 h-20 rounded-2xl border-[2.5px] border-black bg-neutral-50 flex items-center justify-center shadow-[4px_4px_0px_#000] mb-2">
          <UploadCloud size={44} className="text-black stroke-[2]" />
        </div>

        <div className="text-center space-y-1">
          <h3 className="font-heading font-extrabold text-xl text-black">
            Fatura Belgelerini Buraya Sürükleyin
          </h3>
          <p className="font-scribble text-sm text-neutral-600 font-semibold">
            PDF, PNG, JPG, JPEG, TIFF dosyaları desteklenir
          </p>
        </div>

        <div className="mt-2 flex items-center gap-3">
          <span className="scribble-btn scribble-btn-secondary text-xs py-2 px-4 shadow-[2px_2px_0px_#000]">
            Dosya Seçmek İçin Tıkla
          </span>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {/* Queue Area with Notebook design */}
      {queue.length > 0 && (
        <div className="scribble-card p-6 bg-white flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-black">
            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold text-base uppercase tracking-wider text-black">
                Yüklenecek Belgeler
              </span>
              <span className="scribble-tag text-xs font-scribble font-bold bg-black text-white px-2 py-0.5 rounded">
                {queue.length} dosya
              </span>
            </div>
            <button
              onClick={() => setQueue([])}
              className="text-xs font-bold text-neutral-500 hover:text-black hover:underline"
            >
              Hepsini Temizle
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
            {queue.map((f, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 p-3.5 rounded-xl border-2 border-black bg-neutral-50 shadow-[3px_3px_0px_#000]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText size={18} className="text-black shrink-0 stroke-[2.5]" />
                  <div className="truncate">
                    <span className="font-heading font-bold text-xs text-black block truncate">
                      {f.name}
                    </span>
                    <span className="font-scribble text-[11px] text-neutral-500 font-semibold block">
                      {(f.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFromQueue(i); }}
                  className="w-7 h-7 rounded-lg border-2 border-black bg-white hover:bg-black hover:text-white flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#000] transition-colors"
                >
                  <X size={14} className="stroke-[3]" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Process & Progress Area */}
      {isProcessing ? (
        <div className="scribble-card p-6 bg-white flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Spinner size={22} />
              <div>
                <span className="font-heading font-extrabold text-base text-black block">
                  Belgeler İşleniyor...
                </span>
                <span className="font-scribble text-xs text-neutral-500 font-bold">
                  DeepSeek-OCR metin taraması ve Gemma 4 alan tespiti
                </span>
              </div>
            </div>
            <span className="font-heading font-black text-xl text-black border-2 border-black px-3 py-1 rounded-lg bg-neutral-100 shadow-[2px_2px_0px_#000]">
              {processingProgress.current} / {processingProgress.total}
            </span>
          </div>

          <div className="h-5 bg-neutral-100 border-[2.5px] border-black rounded-xl overflow-hidden shadow-[2px_2px_0px_#000] p-0.5">
            <div
              className="h-full bg-black rounded-lg transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={queue.length === 0}
            className={`scribble-btn px-8 py-4 text-base ${
              queue.length === 0
                ? 'opacity-40 cursor-not-allowed bg-neutral-200 text-neutral-500 border-neutral-400 shadow-none'
                : 'scribble-btn-primary'
            }`}
          >
            <Sparkles size={20} className="stroke-[2.5]" />
            <span>
              {queue.length > 0 ? `${queue.length} Belgeyi Çözümle ve İşle →` : 'İşlenecek Belge Seçin'}
            </span>
          </button>
        </div>
      )}

    </div>
  );
};
