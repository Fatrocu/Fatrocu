import React from 'react';
import { FileText, AlertCircle, CheckCircle2, Clock, Trash2, Eye, ArrowUpRight } from 'lucide-react';
import { ProcessedInvoice, InvoiceConfig, FileProcessingStatus } from '../types';

interface ProcessedInvoiceCardProps {
  invoice: ProcessedInvoice;
  config?: InvoiceConfig;
  onViewDetails: (id: string) => void;
  onDeleteInvoice: (id: string) => void;
}

const STATUS_META: Record<string, { label: string; Icon: React.ElementType; tagClass: string }> = {
  [FileProcessingStatus.SUCCESS]: { label: 'Hazır', Icon: CheckCircle2, tagClass: 'bg-white text-black' },
  [FileProcessingStatus.ERROR]: { label: 'Hata!', Icon: AlertCircle, tagClass: 'bg-black text-white' },
  [FileProcessingStatus.PROCESSING]: { label: 'İşleniyor', Icon: Clock, tagClass: 'bg-neutral-200 text-black' },
  reviewed: { label: 'Onaylandı', Icon: CheckCircle2, tagClass: 'bg-white text-black font-extrabold' },
  pending: { label: 'İnceleme Bekliyor', Icon: Clock, tagClass: 'bg-neutral-100 text-black' },
};

export const ProcessedInvoiceCard: React.FC<ProcessedInvoiceCardProps> = ({
  invoice,
  config,
  onViewDetails,
  onDeleteInvoice,
}) => {
  const key = invoice.reviewStatus === 'reviewed' ? 'reviewed'
    : invoice.reviewStatus === 'pending' ? 'pending'
    : invoice.status;
  const meta = STATUS_META[key] ?? STATUS_META[FileProcessingStatus.PROCESSING];
  const { label, Icon, tagClass } = meta;

  const preview = invoice.extractedData;
  const date = invoice.createdAt
    ? new Date(invoice.createdAt).toLocaleDateString('tr-TR')
    : '—';

  return (
    <div className="scribble-card p-5 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:bg-neutral-50 transition-colors">
      
      {/* Document icon and key info */}
      <div className="flex items-start gap-4 min-w-0">
        <div className="w-14 h-14 rounded-xl border-[2.5px] border-black bg-white flex items-center justify-center shrink-0 shadow-[3px_3px_0px_#000] group-hover:rotate-[-2deg] transition-transform">
          <FileText size={28} className="text-black stroke-[2.2]" />
        </div>

        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h4 className="font-heading font-black text-base text-black truncate max-w-sm">
              {invoice.fileName}
            </h4>
            <span className={`text-[11px] uppercase tracking-wider font-heading px-2.5 py-0.5 rounded-full border-[1.5px] border-black shadow-[1.5px_1.5px_0px_#000] flex items-center gap-1.5 ${tagClass}`}>
              <Icon size={12} className="stroke-[3]" />
              {label}
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap font-scribble text-xs font-bold text-neutral-600">
            {config && (
              <span className="border-b border-black">
                {config.name}
              </span>
            )}
            {preview?.faturaNumarasi?.value && (
              <span>
                No: <strong className="text-black font-heading font-bold">{preview.faturaNumarasi.value}</strong>
              </span>
            )}
            {preview?.genelToplam?.value && (
              <span className="bg-neutral-100 border border-black px-2 py-0.5 rounded text-black font-heading font-extrabold text-xs shadow-[1px_1px_0px_#000]">
                {preview.genelToplam.value}
              </span>
            )}
            <span className="text-neutral-400">
              {date}
            </span>
          </div>

          {invoice.errorMessage && (
            <div className="text-xs font-bold text-neutral-800 bg-neutral-100 border border-black p-2 rounded-lg mt-2">
              ⚠️ {invoice.errorMessage}
            </div>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
        <button
          onClick={() => onViewDetails(invoice.id)}
          className="scribble-btn scribble-btn-secondary text-xs px-4 py-2.5 flex items-center gap-1.5 shadow-[2.5px_2.5px_0px_#000]"
        >
          <Eye size={16} className="stroke-[2.5]" />
          <span>İncele</span>
          <ArrowUpRight size={14} className="stroke-[2.5]" />
        </button>

        <button
          onClick={() => onDeleteInvoice(invoice.id)}
          title="Faturayı Sil"
          className="w-10 h-10 rounded-xl border-2 border-black bg-white hover:bg-black hover:text-white flex items-center justify-center transition-colors shadow-[2px_2px_0px_#000]"
        >
          <Trash2 size={16} className="stroke-[2.5]" />
        </button>
      </div>

    </div>
  );
};
