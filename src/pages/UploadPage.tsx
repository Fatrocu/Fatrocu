import React from 'react';
import { FileUploadArea } from '../components/FileUploadArea';
import { ProcessedInvoiceCard } from '../components/ProcessedInvoiceCard';
import { InvoiceConfig, ProcessedInvoice } from '../types';
import { Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

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
  const recent = recentInvoices.slice(0, 6);
  const pendingCount = recentInvoices.filter((i) => i.reviewStatus !== 'reviewed').length;

  return (
    <div className="fade-in max-w-5xl mx-auto flex flex-col gap-10 pb-16">
      
      {/* Hero Intro with Scribble Art flair */}
      <div className="scribble-card p-8 bg-white relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Floating background doodle sticker */}
        <div className="absolute -right-6 -bottom-6 w-32 h-32 border-4 border-black/5 rounded-full pointer-events-none rotate-12" />

        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 scribble-badge bg-black text-white text-xs font-scribble px-3 py-1 mb-1">
            <Zap size={14} className="stroke-[3]" />
            <span>%100 Yerel Yapay Zeka Pipeline</span>
          </div>

          <h1 className="font-heading font-black text-3xl md:text-4xl text-black tracking-tight leading-tight">
            Fatura Belgelerinizi <br className="hidden sm:inline" />
            <span className="underline decoration-[3.5px] underline-offset-4 decoration-black">
              Yerel &amp; Güvenle
            </span> Çözümleyin.
          </h1>

          <p className="font-scribble text-base text-neutral-600 font-semibold leading-relaxed pt-1">
            DeepSeek-OCR ile görseli metne dökün, Gemma 4 ile fatura no, tarih, VKN ve KDV oranlarını hatasız ayıklayın.
          </p>
        </div>

        {/* Action badge / Quick jump */}
        {pendingCount > 0 && (
          <div className="bg-neutral-50 border-[2.5px] border-black p-5 rounded-2xl shadow-[4px_4px_0px_#000] flex flex-col gap-3 shrink-0 text-center">
            <div className="font-heading font-extrabold text-2xl text-black">
              {pendingCount}
            </div>
            <div className="font-scribble text-xs font-bold text-neutral-600 -mt-2">
              Bekleyen İnceleme
            </div>
            <button
              onClick={onNavigateToReview}
              className="scribble-btn scribble-btn-primary text-xs py-2 px-4 shadow-[2px_2px_0px_#000] flex items-center justify-center gap-1.5"
            >
              <span>İncelemeye Git</span>
              <ArrowRight size={14} className="stroke-[3]" />
            </button>
          </div>
        )}
      </div>

      {/* Main Drag & Drop / Upload Component */}
      <FileUploadArea
        configs={configs}
        activeConfigId={activeConfigId}
        onSelectConfig={onSelectConfig}
        onFilesSelected={onFilesSelected}
        isProcessing={isProcessing}
        processingProgress={processingProgress}
      />

      {/* Recent Activity List */}
      {recent.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b-[2.5px] border-black">
            <div className="flex items-center gap-2">
              <span className="font-heading font-black text-lg uppercase tracking-wider text-black">
                Son Eklenen Belgeler
              </span>
              <span className="scribble-tag text-xs font-scribble bg-black text-white px-2 py-0.5 rounded">
                arşiv geçmişi
              </span>
            </div>
            <button
              onClick={onNavigateToReview}
              className="font-heading font-bold text-xs text-black hover:underline flex items-center gap-1"
            >
              <span>Tümünü Gör</span>
              <ArrowRight size={14} className="stroke-[2.5]" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {recent.map((inv) => (
              <ProcessedInvoiceCard
                key={inv.id}
                invoice={inv}
                config={configs.find((c) => c.id === inv.configId)}
                onViewDetails={onViewDetails}
                onDeleteInvoice={onDeleteInvoice}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
