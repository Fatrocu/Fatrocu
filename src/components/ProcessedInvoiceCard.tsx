import React from 'react';
import { FileText, AlertCircle, CheckCircle2, Clock, Trash2, Eye } from 'lucide-react';
import { ProcessedInvoice, InvoiceConfig, FileProcessingStatus } from '../types';

interface ProcessedInvoiceCardProps {
  invoice: ProcessedInvoice;
  config?: InvoiceConfig;
  onViewDetails: (id: string) => void;
  onDeleteInvoice: (id: string) => void;
}

const STATUS_META: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
  [FileProcessingStatus.SUCCESS]: { label: 'Hazır',      color: '#4ade80', Icon: CheckCircle2 },
  [FileProcessingStatus.ERROR]:   { label: 'Hata',       color: '#f87171', Icon: AlertCircle },
  [FileProcessingStatus.PROCESSING]: { label: 'İşleniyor', color: '#fbbf24', Icon: Clock },
  reviewed: { label: 'Onaylandı', color: '#60a5fa', Icon: CheckCircle2 },
  pending:  { label: 'Bekliyor',  color: '#aaa',    Icon: Clock },
};

export const ProcessedInvoiceCard: React.FC<ProcessedInvoiceCardProps> = ({
  invoice,
  config,
  onViewDetails,
  onDeleteInvoice,
}) => {
  const key = invoice.reviewStatus === 'reviewed' ? 'reviewed'
    : invoice.reviewStatus === 'pending'  ? 'pending'
    : invoice.status;
  const meta = STATUS_META[key] ?? STATUS_META[FileProcessingStatus.PROCESSING];
  const { label, color, Icon } = meta;

  const preview = invoice.extractedData;
  const date = invoice.createdAt
    ? new Date(invoice.createdAt).toLocaleDateString('tr-TR')
    : '—';

  return (
    <div
      className="card"
      style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}
    >
      {/* Icon */}
      <div style={{ flexShrink: 0, color: '#333' }}>
        <FileText size={20} />
      </div>

      {/* Main info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#ddd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {invoice.fileName}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 3, flexWrap: 'wrap' }}>
          {config && (
            <span style={{ fontSize: 11, color: '#444' }}>{config.name}</span>
          )}
          {preview?.faturaNumarasi?.value && (
            <span style={{ fontSize: 11, color: '#444' }}>{preview.faturaNumarasi.value}</span>
          )}
          {preview?.genelToplam?.value && (
            <span style={{ fontSize: 11, color: '#555', fontWeight: 600 }}>{preview.genelToplam.value}</span>
          )}
          <span style={{ fontSize: 11, color: '#333' }}>{date}</span>
        </div>
        {invoice.errorMessage && (
          <div style={{ fontSize: 11, color: '#f87171', marginTop: 3 }}>{invoice.errorMessage}</div>
        )}
      </div>

      {/* Status badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
        <Icon size={12} color={color} />
        <span style={{ fontSize: 11, color, fontWeight: 600 }}>{label}</span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <button
          onClick={() => onViewDetails(invoice.id)}
          title="İncele"
          style={{ background: '#1a1a1a', border: '1px solid #222', borderRadius: 5, cursor: 'pointer', color: '#888', padding: '4px 8px', display: 'flex', alignItems: 'center' }}
        >
          <Eye size={12} />
        </button>
        <button
          onClick={() => onDeleteInvoice(invoice.id)}
          title="Sil"
          style={{ background: 'transparent', border: 'none', borderRadius: 5, cursor: 'pointer', color: '#333', padding: '4px 8px', display: 'flex', alignItems: 'center' }}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
};
