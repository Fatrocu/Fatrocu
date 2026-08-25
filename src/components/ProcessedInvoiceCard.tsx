import React from 'react';
import { ProcessedInvoice, InvoiceConfig, FileProcessingStatus } from '../types';
import { FileText, CheckCircle2, Clock, AlertCircle, Trash2, Edit3, ArrowRight, Eye } from 'lucide-react';

interface ProcessedInvoiceCardProps {
  invoice: ProcessedInvoice;
  config?: InvoiceConfig;
  onViewDetails: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ProcessedInvoiceCard: React.FC<ProcessedInvoiceCardProps> = ({
  invoice,
  config,
  onViewDetails,
  onDelete,
}) => {
  const faturaNo =
    invoice.extractedData?.faturaNumarasi?.value ||
    invoice.extractedData?.fisNo?.value ||
    '-';

  const faturaTarihi =
    invoice.extractedData?.faturaTarihi?.value ||
    invoice.extractedData?.fisTarihi?.value ||
    '-';

  const unvan =
    invoice.extractedData?.saticiUnvan?.value ||
    invoice.extractedData?.aliciUnvan?.value ||
    'Belirtilmemiş';

  const toplam = invoice.extractedData?.genelToplam?.value || '-';

  const isApproved = invoice.reviewStatus === 'reviewed';

  return (
    <div className="group bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 rounded-2xl p-5 shadow-md hover:shadow-xl transition-all">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left Icon & File Details */}
        <div className="flex items-center gap-3.5 min-w-[240px]">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform shadow-inner">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-100 group-hover:text-indigo-300 transition-colors truncate max-w-xs">
              {invoice.fileName}
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <span className="px-2 py-0.2 rounded bg-slate-900 border border-slate-700/60 font-semibold text-slate-300">
                {config?.name || 'Fatura'}
              </span>
              {invoice.modelUsed && (
                <span className="text-[10px] text-indigo-400 font-medium">
                  &bull; {invoice.modelUsed}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Middle Extracted Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 text-xs">
          <div>
            <span className="text-slate-500 block">Fatura / Fiş No</span>
            <span className="font-bold text-slate-200 truncate block">{faturaNo}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Tarih</span>
            <span className="font-medium text-slate-200 block">{faturaTarihi}</span>
          </div>
          <div className="col-span-1 sm:col-span-1">
            <span className="text-slate-500 block">Satıcı / Ünvan</span>
            <span className="font-medium text-slate-200 truncate block">{unvan}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Toplam Tutar</span>
            <span className="font-black text-emerald-400 block">{toplam}</span>
          </div>
        </div>

        {/* Right Status Badge & Actions */}
        <div className="flex items-center gap-2.5">
          {isApproved ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Onaylandı
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-950/60 border border-amber-700/50 text-amber-300 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5" />
              Kontrol Bekliyor
            </span>
          )}

          <button
            onClick={() => onViewDetails(invoice.id)}
            className="flex items-center gap-1 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all"
            title="Detaylı İncele ve Düzenle"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>İncele</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(invoice.id);
            }}
            className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
            title="Faturayı Sil"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
