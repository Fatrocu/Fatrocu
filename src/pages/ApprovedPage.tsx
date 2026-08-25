import React, { useState, useMemo } from 'react';
import { ProcessedInvoiceCard } from '../components/ProcessedInvoiceCard';
import { ProcessedInvoice, InvoiceConfig } from '../types';
import {
  FileSpreadsheet,
  Download,
  Trash2,
  Search,
  CheckCircle2,
  FileText,
  Filter,
  DollarSign,
} from 'lucide-react';

interface ApprovedPageProps {
  invoices: ProcessedInvoice[];
  configs: InvoiceConfig[];
  onViewDetails: (invoiceId: string) => void;
  onDeleteInvoice: (invoiceId: string) => void;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConfigFilter, setSelectedConfigFilter] = useState<string>('all');

  const configMap = new Map(configs.map((c) => [c.id, c]));

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (selectedConfigFilter !== 'all' && inv.configId !== selectedConfigFilter) {
        return false;
      }
      if (!searchTerm.trim()) return true;

      const query = searchTerm.toLowerCase();
      const fileName = inv.fileName.toLowerCase();
      const faturaNo = (
        inv.extractedData?.faturaNumarasi?.value ||
        inv.extractedData?.fisNo?.value ||
        ''
      ).toLowerCase();
      const unvan = (
        inv.extractedData?.saticiUnvan?.value ||
        inv.extractedData?.aliciUnvan?.value ||
        ''
      ).toLowerCase();
      const tarih = (
        inv.extractedData?.faturaTarihi?.value ||
        inv.extractedData?.fisTarihi?.value ||
        ''
      ).toLowerCase();

      return (
        fileName.includes(query) ||
        faturaNo.includes(query) ||
        unvan.includes(query) ||
        tarih.includes(query)
      );
    });
  }, [invoices, searchTerm, selectedConfigFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Stats */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-slate-800/90 p-6 rounded-3xl border border-slate-700 shadow-xl">
        <div>
          <h2 className="text-2xl font-black text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-7 h-7" />
            <span>Onaylanmış &amp; Arşivlenmiş Faturalar</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Kontrol edilip onaylanan tüm faturalarınız burada listelenir. Tek tıkla Excel veya CSV
            olarak dışa aktarabilirsiniz.
          </p>
        </div>

        {invoices.length > 0 && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={onExportCsv}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-100 text-xs font-bold rounded-xl shadow-md transition-all"
              title="CSV olarak indir"
            >
              <Download className="w-4 h-4" />
              <span>CSV İndir</span>
            </button>

            <button
              onClick={onExportExcel}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
              title="Excel (.xlsx) tablosu olarak indir"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel İndir ({invoices.length})</span>
            </button>

            <button
              onClick={onClearApproved}
              className="p-2.5 bg-red-900/30 hover:bg-red-900/60 border border-red-700/40 text-red-300 text-xs font-bold rounded-xl transition-colors"
              title="Tüm onaylanmış faturaları arşivden temizle"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      {invoices.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800/60 p-4 rounded-2xl border border-slate-700">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Fatura no, satıcı ünvanı veya tarih ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedConfigFilter}
              onChange={(e) => setSelectedConfigFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Tüm Şablonlar</option>
              {configs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Invoices List */}
      {filteredInvoices.length > 0 ? (
        <div className="space-y-3">
          {filteredInvoices.map((invoice) => (
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
          <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-500 mb-4 shadow-inner">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-200">
            {invoices.length === 0 ? 'Arşiv Boş' : 'Sonuç Bulunamadı'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {invoices.length === 0
              ? 'Henüz onaylanmış bir fatura bulunmuyor. Faturaları yükleyip onayladıktan sonra burada görebilirsiniz.'
              : 'Arama kriterlerinize uygun fatura bulunamadı.'}
          </p>
        </div>
      )}
    </div>
  );
};
