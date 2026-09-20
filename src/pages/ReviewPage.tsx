import React, { useState } from 'react';
import { ProcessedInvoiceCard } from '../components/ProcessedInvoiceCard';
import { InvoiceConfig, ProcessedInvoice } from '../types';
import { Search } from 'lucide-react';

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
      i.extractedData?.faturaNumarasi?.value?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fade-in" style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>İnceleme Kuyruğu</h1>
          <p style={{ fontSize: 12, color: '#444', marginTop: 2 }}>
            {pending.length} bekleyen belge
          </p>
        </div>
        <div style={{ flex: 1 }} />
        {pending.length > 0 && (
          <button
            onClick={onStartReview}
            style={{
              padding: '7px 16px',
              background: '#fff',
              color: '#000',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            İncelemeye Başla →
          </button>
        )}
      </div>

      {/* Search */}
      {pending.length > 0 && (
        <div style={{ position: 'relative' }}>
          <Search size={13} color="#444" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            placeholder="Dosya adı veya fatura no ara…"
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
        <div
          className="card"
          style={{ padding: 40, textAlign: 'center', color: '#333' }}
        >
          {pending.length === 0 ? (
            <>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
              <div style={{ fontSize: 13, color: '#555' }}>İnceleme kuyruğu boş.</div>
            </>
          ) : (
            <div style={{ fontSize: 12, color: '#444' }}>Arama sonucu bulunamadı.</div>
          )}
        </div>
      )}
    </div>
  );
};
