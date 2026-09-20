import React from 'react';
import { FileUploadArea } from '../components/FileUploadArea';
import { ProcessedInvoiceCard } from '../components/ProcessedInvoiceCard';
import { InvoiceConfig, ProcessedInvoice, FileProcessingStatus } from '../types';

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
}) => {
  const recent = recentInvoices.slice(0, 8);
  const activeConfig = configs.find((c) => c.id === activeConfigId);

  return (
    <div className="fade-in" style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
          Belge Yükle
        </h1>
        <p style={{ fontSize: 13, color: '#444' }}>
          Fatura PDF veya görsellerini işlemek için yükleyin.
        </p>
      </div>

      <FileUploadArea
        configs={configs}
        activeConfigId={activeConfigId}
        onSelectConfig={onSelectConfig}
        onFilesSelected={onFilesSelected}
        isProcessing={isProcessing}
        processingProgress={processingProgress}
      />

      {recent.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#444', letterSpacing: '0.05em', marginBottom: 8 }}>
            SON İŞLEMELER
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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
