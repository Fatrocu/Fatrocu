import React from 'react';
import { FileUploadArea } from '../components/FileUploadArea';
import { ProgressBar } from '../components/ProgressBar';
import { ProcessedInvoiceCard } from '../components/ProcessedInvoiceCard';
import { InvoiceConfig, ProcessedInvoice } from '../types';
import { ArrowRight, Sparkles, CheckCircle } from 'lucide-react';

interface UploadPageProps {
  configs: InvoiceConfig[];
  activeConfigId: string;
  onSelectConfig: (id: string) => void;
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
  processingProgress: { current: number; total: number };
  recentInvoices: ProcessedInvoice[];
  onViewDetails: (id: string) => void;
  onDeleteInvoice: (id: string) => void;
  onNavigateToReview: () => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({
  configs,
  activeConfigId,
  onSelectConfig,
  onFilesSelected,
  isProcessing,
  processingProgress,
  recentInvoices,
  onViewDetails,
  onDeleteInvoice,
  onNavigateToReview,
}) => {
  const configMap = new Map(configs.map((c) => [c.id, c]));
  const pendingInvoices = recentInvoices.filter((i) => i.reviewStatus === 'pending');

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Intro */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-gradient-to-r from-slate-800/80 to-indigo-950/40 p-6 rounded-3xl border border-slate-700 shadow-xl">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <span>Fatura &amp; Fiş İşleme</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" /> NaviDC-OCR VLM
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            PDF veya görsel faturalarınızı yükleyin. NaviDC-OCR yapay zekası verileri yerel olarak
            çıkarsın ve onayınıza sunsun.
          </p>
        </div>

        {pendingInvoices.length > 0 && (
          <button
            onClick={onNavigateToReview}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all group"
          >
            <span>Kontrol Ekranına Geç ({pendingInvoices.length} Bekleyen)</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </div>

      {/* Progress Bar (Visible during processing) */}
      {isProcessing && (
        <ProgressBar
          current={processingProgress.current}
          total={processingProgress.total}
          label="NaviDC-OCR Belgeleri İşliyor..."
        />
      )}

      {/* Upload Drop Area */}
      <FileUploadArea
        configs={configs}
        activeConfigId={activeConfigId}
        onSelectConfig={onSelectConfig}
        onFilesSelected={onFilesSelected}
        isProcessing={isProcessing}
      />

      {/* Recently Uploaded / Queued Items */}
      {recentInvoices.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-200">
              Son Eklenen Faturalar ({recentInvoices.length})
            </h3>
          </div>

          <div className="space-y-3">
            {recentInvoices.slice(0, 5).map((invoice) => (
              <ProcessedInvoiceCard
                key={invoice.id}
                invoice={invoice}
                config={configMap.get(invoice.configId)}
                onViewDetails={onViewDetails}
                onDelete={onDeleteInvoice}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
