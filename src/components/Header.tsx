import React from 'react';
import { ModelStatusBadge } from './ModelStatusBadge';
import { ModelStatus } from '../types';
import { FileText, CheckCircle2, Upload, Settings, RefreshCw, FileSpreadsheet } from 'lucide-react';

interface HeaderProps {
  currentPage: 'upload' | 'review' | 'settings' | 'approved';
  setCurrentPage: (page: 'upload' | 'review' | 'settings' | 'approved') => void;
  pendingCount: number;
  approvedCount: number;
  modelStatus: ModelStatus | null;
  onRefreshModel: () => void;
  onExportExcel: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  setCurrentPage,
  pendingCount,
  approvedCount,
  modelStatus,
  onRefreshModel,
  onExportExcel,
}) => {
  return (
    <header className="bg-slate-800/90 backdrop-blur-md border-b border-slate-700/80 sticky top-0 z-40 px-6 py-3.5 transition-all shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-md shadow-indigo-500/20 ring-1 ring-white/20">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white">
                Fatrocu <span className="text-indigo-400 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30">v3.0 Rust</span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              NaviDC-OCR Yerel VLM Fatura İşleme
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 bg-slate-900/60 p-1.5 rounded-xl border border-slate-700/60 shadow-inner">
          <button
            onClick={() => setCurrentPage('upload')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              currentPage === 'upload'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Yükle</span>
          </button>

          <button
            onClick={() => setCurrentPage('review')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              currentPage === 'review'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Kontrol Et</span>
            {pendingCount > 0 && (
              <span className="ml-1 px-2 py-0.2 text-xs font-bold rounded-full bg-amber-500 text-slate-950 shadow-sm animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentPage('approved')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              currentPage === 'approved'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Onaylananlar</span>
            {approvedCount > 0 && (
              <span className="ml-1 px-2 py-0.2 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {approvedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentPage('settings')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              currentPage === 'settings'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Ayarlar</span>
          </button>
        </nav>

        {/* Right Status & Quick Export */}
        <div className="flex items-center gap-3">
          <ModelStatusBadge status={modelStatus} onRefresh={onRefreshModel} />
          
          {approvedCount > 0 && (
            <button
              onClick={onExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md shadow-emerald-600/20 transition-all"
              title="Onaylanmış tüm faturaları Excel'e aktar"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel İndir</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
