import React, { useState } from 'react';
import { ProcessedInvoiceCard } from '../components/ProcessedInvoiceCard';
import { InvoiceConfig, ProcessedInvoice } from '../types';
import { Search, Sparkles, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

interface ReviewPageProps {
  invoices: ProcessedInvoice[];
  configs: InvoiceConfig[];
  onViewDetails: (id: string) => void;
  onDeleteInvoice: (id: string) => void;
  onStartReview: () => void;
}

export const ReviewPage: React.FC<ReviewPageProps> = ({
  invoices,
  configs,
  onViewDetails,
  onDeleteInvoice,
  onStartReview,
}) => {
  const [query, setQuery] = useState('');
  const pending = invoices.filter((i) => i.reviewStatus !== 'reviewed');

  const filtered = pending.filter(
    (i) =>
      !query ||
      i.fileName.toLowerCase().includes(query.toLowerCase()) ||
      i.extractedData?.faturaNumarasi?.value?.toLowerCase().includes(query.toLowerCase()) ||
      i.extractedData?.saticiUnvan?.value?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fade-in max-w-5xl mx-auto flex flex-col gap-8 pb-16">
      
      {/* Top Banner Card */}
      <div className="scribble-card p-6 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-black text-2xl text-black">
              İnceleme ve Onay Kuyruğu
            </h1>
            <span className="scribble-badge bg-black text-white text-xs font-scribble px-2.5 py-0.5">
              {pending.length} bekleyen
            </span>
          </div>
          <p className="font-scribble text-sm text-neutral-600 font-semibold mt-1">
            Çıkarılan alanları kontrol edin, gerekirse düzenleyin ve arşive aktarın.
          </p>
        </div>

        {pending.length > 0 && (
          <button
            onClick={onStartReview}
            className="scribble-btn scribble-btn-primary px-6 py-3.5 text-sm flex items-center gap-2 shrink-0"
          >
            <span>Hızlı İncelemeye Başla</span>
            <ArrowRight size={16} className="stroke-[3]" />
          </button>
        )}
      </div>

      {/* Search Input with doodle border */}
      {pending.length > 0 && (
        <div className="relative">
          <input
            type="text"
            placeholder="Dosya adı, fatura numarası veya satıcı adı ile arayın..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 text-sm font-heading font-semibold"
          />
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-black stroke-[2.5]"
          />
        </div>
      )}

      {/* Documents List */}
      {filtered.length > 0 ? (
        <div className="flex flex-col gap-3">
          {filtered.map((inv) => (
            <ProcessedInvoiceCard
              key={inv.id}
              invoice={inv}
              config={configs.find((c) => c.id === inv.configId)}
              onViewDetails={onViewDetails}
              onDeleteInvoice={onDeleteInvoice}
            />
          ))}
        </div>
      ) : (
        <div className="scribble-card p-16 bg-white text-center flex flex-col items-center justify-center gap-4 border-dashed">
          <div className="w-16 h-16 rounded-2xl border-[2.5px] border-black flex items-center justify-center bg-neutral-100 shadow-[3px_3px_0px_#000]">
            <CheckCircle2 size={32} className="text-black stroke-[2.5]" />
          </div>
          <div>
            <h3 className="font-heading font-black text-xl text-black">
              {pending.length === 0 ? 'İnceleme Kuyruğu Tertemiz!' : 'Aramanızla Eşleşen Belge Bulunamadı'}
            </h3>
            <p className="font-scribble text-sm text-neutral-600 font-semibold mt-1">
              {pending.length === 0
                ? 'Tüm faturalar gözden geçirildi ve onaylandı. Yeni belgeler ekleyebilirsiniz.'
                : 'Farklı bir arama terimi deneyin.'}
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
