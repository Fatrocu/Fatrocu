import React, { useState, useRef } from 'react';
import { UploadCloud, File, X, CheckCircle, AlertCircle, FileSpreadsheet, Cpu } from 'lucide-react';
import { InvoiceConfig } from '../types';

interface FileUploadAreaProps {
  configs: InvoiceConfig[];
  activeConfigId: string;
  onSelectConfig: (id: string) => void;
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

export const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  configs,
  activeConfigId,
  onSelectConfig,
  onFilesSelected,
  isProcessing,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isProcessing) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isProcessing) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter(
        (f) =>
          f.type.startsWith('image/') ||
          f.type === 'application/pdf' ||
          f.name.endsWith('.pdf') ||
          f.name.endsWith('.xml')
      );
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartProcessing = () => {
    if (selectedFiles.length > 0) {
      onFilesSelected(selectedFiles);
      setSelectedFiles([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Template Selector Bar */}
      <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 shadow-md">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
          1. Fatura Şablonu Seçin
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {configs.map((config) => {
            const isSelected = config.id === activeConfigId;
            return (
              <button
                key={config.id}
                onClick={() => onSelectConfig(config.id)}
                className={`flex flex-col p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 ring-2 ring-indigo-500/40 shadow-md'
                    : 'bg-slate-900/60 border-slate-700/60 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-sm text-white">{config.name}</span>
                  {isSelected && <CheckCircle className="w-4 h-4 text-indigo-400" />}
                </div>
                <span className="text-xs text-slate-400 mt-1">
                  {config.fields.length} Alan &bull; {config.lineItemFields?.length || 0} Satır Kalemi
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Drag and Drop Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
            : 'border-slate-700 bg-slate-800/40 hover:border-indigo-500/60 hover:bg-slate-800/80'
        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf,.pdf,.xml"
          onChange={handleFileChange}
          className="hidden"
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-200">
              Faturaları buraya sürükleyip bırakın veya seçmek için tıklayın
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              PDF, PNG, JPG, JPEG veya XML formatlarını destekler &bull; Toplu yükleme yapılabilir
            </p>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2.5 py-1 rounded-md bg-slate-800 text-[11px] font-semibold text-slate-400 border border-slate-700">
              PDF
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-800 text-[11px] font-semibold text-slate-400 border border-slate-700">
              PNG / JPG
            </span>
            <span className="px-2.5 py-1 rounded-md bg-indigo-950/60 text-[11px] font-semibold text-indigo-300 border border-indigo-700/40 flex items-center gap-1">
              <Cpu className="w-3 h-3" /> NaviDC-OCR
            </span>
          </div>
        </div>
      </div>

      {/* Selected Files Queue Preview */}
      {selectedFiles.length > 0 && (
        <div className="bg-slate-800/90 rounded-2xl p-5 border border-slate-700 shadow-lg space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-bold text-slate-200">
              İşlenecek Belgeler ({selectedFiles.length})
            </h4>
            <button
              onClick={() => setSelectedFiles([])}
              className="text-xs text-red-400 hover:text-red-300 font-semibold"
            >
              Tümünü Temizle
            </button>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 text-xs text-slate-300"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <File className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="font-medium truncate">{file.name}</span>
                  <span className="text-slate-500 text-[10px]">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-red-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleStartProcessing}
            disabled={isProcessing}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
          >
            <Cpu className="w-4 h-4" />
            <span>NaviDC-OCR ile İşlemeyi Başlat ({selectedFiles.length} Belge)</span>
          </button>
        </div>
      )}
    </div>
  );
};
