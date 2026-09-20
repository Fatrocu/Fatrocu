import React, { useState } from 'react';
import { ProcessedInvoiceCard } from '../components/ProcessedInvoiceCard';
import { InvoiceConfig, ProcessedInvoice } from '../types';
import { Search, Download, Trash2 } from 'lucide-react';

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
  invoices, configs, onViewDetails, onDeleteInvoice, onClearApproved, onExportExcel, onExportCsv,
}) => {
  const [query, setQuery] = useState('');

  const filtered = invoices.filter(
    (i) => !query ||
      i.fileName.toLowerCase().includes(query.toLowerCase()) ||
      i.extractedData?.faturaNumarasi?.value?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fade-in" style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Arşiv</h1>
          <p style={{ fontSize: 12, color: '#444', marginTop: 2 }}>{invoices.length} onaylanmış belge</p>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={onExportExcel}
            disabled={invoices.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#fff', color: '#000', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: invoices.length === 0 ? 'not-allowed' : 'pointer', opacity: invoices.length === 0 ? 0.3 : 1 }}
          >
            <Download size={12} /> Excel
          </button>
          <button
            onClick={onExportCsv}
            disabled={invoices.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#1a1a1a', color: '#888', border: '1px solid #222', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: invoices.length === 0 ? 'not-allowed' : 'pointer', opacity: invoices.length === 0 ? 0.3 : 1 }}
          >
            CSV
          </button>
          {invoices.length > 0 && (
            <button
              onClick={onClearApproved}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'transparent', color: '#444', border: 'none', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}
            >
              <Trash2 size={12} /> Temizle
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      {invoices.length > 0 && (
        <div style={{ position: 'relative' }}>
          <Search size={13} color="#444" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            placeholder="Ara…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: 30 }}
          />
        </div>
      )}

      {/* List */}
      {filtered.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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
        <div className="card" style={{ padding: 48, textAlign: 'center', color: '#333' }}>
          {invoices.length === 0 ? (
            <>
              <div style={{ fontSize: 32, marginBottom: 12 }}>□</div>
              <div style={{ fontSize: 12, color: '#444' }}>Henüz onaylanmış belge yok.</div>
            </>
          ) : (
            <div style={{ fontSize: 12, color: '#444' }}>Sonuç bulunamadı.</div>
          )}
        </div>
      )}
    </div>
  );
};
