import React from 'react';
import { ProcessedInvoiceCard } from '../components/ProcessedInvoiceCard';
import { ProcessedInvoice, InvoiceConfig } from '../types';
import { Clock, ArrowRight, CheckCircle2 } from 'lucide-react';

interface ReviewPageProps {
  invoices: ProcessedInvoice[];
  configs: InvoiceConfig[];
  onViewDetails: (invoiceId: string) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onStartReview: () => void;
}

export const ReviewPage: React.FC<ReviewPageProps> = ({
  invoices,
  configs,
  onViewDetails,
  onDeleteInvoice,
  onStartReview,
}) => {
  const configMap = new Map(configs.map((c) => [c.id, c]));
  const pendingInvoices = invoices.filter((i) => i.reviewStatus === 'pending');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-slate-800/90 p-6 rounded-3xl border border-slate-700 shadow-xl">
        <div>
          <h2 className="text-2xl font-black text-amber-400 flex items-center gap-2">
            <Clock className="w-7 h-7" />
            <span>Kontrol Bekleyen Faturalar</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Yapay zeka tarafından işlenen verileri kontrol edin, gerekirse düzeltip onaylayın.
          </p>
        </div>

        {pendingInvoices.length > 0 && (
          <button
            onClick={onStartReview}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all group"
          >
            <span>İlk Faturayı İncele</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </div>

      {/* Pending Invoices List */}
      {pendingInvoices.length > 0 ? (
        <div className="space-y-3">
          {pendingInvoices.map((invoice) => (
            <ProcessedInvoiceCard
              key={invoice.id}
              invoice={invoice}
              config={configMap.get(invoice.configId)}
              onViewDetails={onViewDetails}
              onDelete={onDeleteInvoice}
            />
          ))}
        </div>
      ) : (
        <div className="mt-12 text-center text-slate-400 bg-slate-800/40 rounded-3xl py-16 border border-slate-800/80">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-emerald-400 mb-4 shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-200">Harika! Tüm Faturalar Kontrol Edildi</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Bekleyen faturanız bulunmuyor. Yeni faturalar yüklemek için "Yükle" sayfasına geçebilirsiniz.
          </p>
        </div>
      )}
    </div>
  );
};
