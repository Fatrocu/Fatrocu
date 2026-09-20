import React, { useState } from 'react';
import { ProcessedInvoiceCard } from '../components/ProcessedInvoiceCard';
import { InvoiceConfig, ProcessedInvoice } from '../types';
import { Search, Download, Trash2, CheckCircle2, FileSpreadsheet, Archive } from 'lucide-react';

interface ApprovedPageProps {
  invoices: ProcessedInvoice[];
  configs: InvoiceConfig[];
  onViewDetails: (id: string) => void;
  onDeleteInvoice: (id: string) => void;
  onClearApproved: () => void;
  onExportExcel: () => void;
  onExportCsv: () => void;
}

export const ApprovedPage: React.FC<ApprovedPageProps> = ({
  invoices,
  configs,
  onViewDetails,
  onDeleteInvoice,
  onClearApproved,
  onExportExcel,
  onExportCsv,
}) => {
  const [query, setQuery] = useState('');

  const filtered = invoices.filter(
    (i) =>
      !query ||
      i.fileName.toLowerCase().includes(query.toLowerCase()) ||
      i.extractedData?.faturaNumarasi?.value?.toLowerCase().includes(query.toLowerCase()) ||
      i.extractedData?.saticiUnvan?.value?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fade-in max-w-5xl mx-auto flex flex-col gap-8 pb-16">
      
      {/* Top Banner Card with Scribble Brutalism */}
      <div className="scribble-card p-6 bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <Archive size={26} className="text-black stroke-[2.5]" />
            <h1 className="font-heading font-black text-2xl text-black">
              Onaylanmış Fatura Arşivi
            </h1>
            <span className="scribble-badge bg-black text-white text-xs font-scribble px-2.5 py-0.5">
              {invoices.length} fatura
            </span>
          </div>
          <p className="font-scribble text-sm text-neutral-600 font-semibold mt-1">
            İncelenip onaylanmış tüm belgeler burada toplanır. Tek tıkla Excel veya CSV'ye dökebilirsiniz.
          </p>
        </div>

        {/* Export & Action Buttons */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <button
            onClick={onExportExcel}
            disabled={invoices.length === 0}
            className={`scribble-btn px-5 py-2.5 text-xs flex items-center gap-2 ${
              invoices.length === 0
                ? 'opacity-40 cursor-not-allowed bg-neutral-100 text-neutral-400 border-neutral-300 shadow-none'
                : 'scribble-btn-primary'
            }`}
          >
            <FileSpreadsheet size={16} className="stroke-[2.5]" />
            <span>Excel (.xlsx) İndir</span>
          </button>

          <button
            onClick={onExportCsv}
            disabled={invoices.length === 0}
            className={`scribble-btn px-4 py-2.5 text-xs flex items-center gap-2 ${
              invoices.length === 0
                ? 'opacity-40 cursor-not-allowed bg-neutral-100 text-neutral-400 border-neutral-300 shadow-none'
                : 'scribble-btn-secondary'
            }`}
          >
            <Download size={16} className="stroke-[2.5]" />
            <span>CSV</span>
          </button>

          {invoices.length > 0 && (
            <button
              onClick={onClearApproved}
              className="p-2.5 rounded-xl border-2 border-black bg-white hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_#000]"
              title="Tüm Arşivi Temizle"
            >
              <Trash2 size={16} className="stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>

      {/* Search Input */}
      {invoices.length > 0 && (
        <div className="relative">
          <input
            type="text"
            placeholder="Arşivde fatura no, dosya adı veya satıcı ara..."
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

      {/* Archive List */}
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
              {invoices.length === 0 ? 'Arşivde Henüz Onaylanmış Fatura Yok' : 'Arama Eşleşmesi Bulunamadı'}
            </h3>
            <p className="font-scribble text-sm text-neutral-600 font-semibold mt-1">
              {invoices.length === 0
                ? 'İnceleme kuyruğundaki belgeleri onayladıkça buraya eklenecektir.'
                : 'Lütfen arama teriminizi kontrol edin.'}
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
