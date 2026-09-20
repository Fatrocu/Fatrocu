import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AlertMessage } from './components/AlertMessage';
import { UploadPage } from './pages/UploadPage';
import { ReviewPage } from './pages/ReviewPage';
import { CheckInvoicePage } from './pages/CheckInvoicePage';
import { ApprovedPage } from './pages/ApprovedPage';
import { SettingsPage } from './pages/SettingsPage';
import {
  ProcessedInvoice, InvoiceConfig, AppSettings, ModelStatus,
  AlertType, ExtractedInvoiceFields, FieldConfig, FileProcessingStatus, GemmaVariant,
} from './types';
import { tauriService } from './services/tauriService';
import { PREDEFINED_CONFIGS } from './services/configService';

type Page = 'upload' | 'review' | 'approved' | 'settings' | 'check';

const DEFAULT_SETTINGS: AppSettings = {
  ocrModelPath: '',
  ocrThreads: 4,
  ocrGpuLayers: 0,
  extractionModelId: 'E4B' as GemmaVariant,
  extractionModelPath: '',
  extractionThreads: 4,
  extractionGpuLayers: 0,
  saveProcessedFiles: true,
  defaultExportFormat: 'xlsx',
};

export const App: React.FC = () => {
  const [invoices, setInvoices] = useState<ProcessedInvoice[]>([]);
  const [configs, setConfigs] = useState<InvoiceConfig[]>(PREDEFINED_CONFIGS);
  const [activeConfigId, setActiveConfigId] = useState<string>(PREDEFINED_CONFIGS[0].id);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);

  const [page, setPage] = useState<Page>('upload');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });
  const [alert, setAlert] = useState<{ type: AlertType; message: string } | null>(null);

  const showAlert = (type: AlertType, message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  useEffect(() => {
    (async () => {
      try {
        const [s, c, inv, status] = await Promise.all([
          tauriService.getAppSettings(),
          tauriService.getConfigs(),
          tauriService.getInvoices(),
          tauriService.checkEngineStatus(),
        ]);
        if (s) setSettings(s);
        if (c && c.length > 0) { setConfigs(c); setActiveConfigId(c[0].id); }
        if (inv) setInvoices(inv);
        setModelStatus(status);
      } catch (e) {
        console.error('Init error:', e);
      }
    })();
  }, []);

  const handleFilesSelected = async (files: File[]) => {
    const cfg = configs.find((c) => c.id === activeConfigId) || configs[0];
    setIsProcessing(true);
    setProcessingProgress({ current: 0, total: files.length });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const tempId = `inv_${Date.now()}_${i}`;
      try {
        const processed = await tauriService.processInvoiceFile(file, tempId, cfg);
        await tauriService.saveInvoice(processed);
        setInvoices((p) => [processed, ...p.filter((x) => x.id !== processed.id)]);
      } catch (err) {
        const errInv: ProcessedInvoice = {
          id: tempId, fileName: file.name, fileType: file.type,
          status: FileProcessingStatus.ERROR, errorMessage: String(err),
          configId: cfg.id, createdAt: new Date().toISOString(),
        };
        await tauriService.saveInvoice(errInv);
        setInvoices((p) => [errInv, ...p]);
      }
      setProcessingProgress({ current: i + 1, total: files.length });
    }

    setIsProcessing(false);
    showAlert('success', `${files.length} fatura başarıyla çözümlendi!`);
    setPage('review');
  };

  const handleDelete = async (id: string) => {
    await tauriService.deleteInvoice(id);
    setInvoices((p) => p.filter((i) => i.id !== id));
    if (selectedId === id) { setSelectedId(null); setPage('review'); }
    showAlert('info', 'Fatura silindi.');
  };

  const handleSave = async (
    id: string, data: ExtractedInvoiceFields, lines: any[],
    cf: FieldConfig[], clf: FieldConfig[], approve = false
  ) => {
    const existing = invoices.find((i) => i.id === id);
    if (!existing) return;
    const updated: ProcessedInvoice = {
      ...existing, extractedData: data, lineItems: lines,
      customFields: cf, customLineItemFields: clf,
      reviewStatus: approve ? 'reviewed' : existing.reviewStatus || 'pending',
    };
    await tauriService.saveInvoice(updated);
    setInvoices((p) => p.map((i) => (i.id === id ? updated : i)));
    if (approve) showAlert('success', `"${existing.fileName}" onaylandı ve arşive eklendi.`);
    else showAlert('info', 'Değişiklikler kaydedildi.');
  };

  const handleSaveAndNext = async (
    id: string, data: ExtractedInvoiceFields, lines: any[],
    cf: FieldConfig[], clf: FieldConfig[]
  ) => {
    await handleSave(id, data, lines, cf, clf, true);
    const pending = invoices.filter((i) => i.id !== id && i.reviewStatus === 'pending');
    if (pending.length > 0) {
      setSelectedId(pending[0].id);
    } else {
      setSelectedId(null);
      setPage('approved');
      showAlert('success', 'Tebrikler! Kuyruktaki tüm faturalar onaylandı.');
    }
  };

  const handleClearApproved = async () => {
    if (!window.confirm('Tüm onaylanmış faturalar arşivden silinecek. Emin misiniz?')) return;
    for (const inv of invoices.filter((i) => i.reviewStatus === 'reviewed')) {
      await tauriService.deleteInvoice(inv.id);
    }
    setInvoices((p) => p.filter((i) => i.reviewStatus !== 'reviewed'));
    showAlert('info', 'Arşiv temizlendi.');
  };

  const handleExportExcel = async () => {
    const toExport = invoices.filter((i) => i.reviewStatus === 'reviewed');
    if (toExport.length === 0) { showAlert('warning', 'Dışa aktarılacak onaylanmış belge bulunamadı.'); return; }
    try {
      const path = await tauriService.exportInvoicesExcel(toExport, configs);
      showAlert('success', `Excel dosyası kaydedildi: ${path}`);
    } catch (e) { showAlert('error', `Excel hatası: ${e}`); }
  };

  const handleExportCsv = async () => {
    const toExport = invoices.filter((i) => i.reviewStatus === 'reviewed');
    if (toExport.length === 0) { showAlert('warning', 'Dışa aktarılacak onaylanmış belge bulunamadı.'); return; }
    try {
      const path = await tauriService.exportInvoicesCsv(toExport, configs);
      showAlert('success', `CSV dosyası kaydedildi: ${path}`);
    } catch (e) { showAlert('error', `CSV hatası: ${e}`); }
  };

  const pending = invoices.filter((i) => i.reviewStatus !== 'reviewed');
  const approved = invoices.filter((i) => i.reviewStatus === 'reviewed');
  const selectedInvoice = invoices.find((i) => i.id === selectedId);
  const selectedConfig = selectedInvoice ? configs.find((c) => c.id === selectedInvoice.configId) || configs[0] : configs[0];

  const navPage = page === 'check' ? 'review' : page;

  return (
    <div className="min-h-screen bg-white text-black flex flex-col font-sans">
      <Header
        currentPage={navPage as any}
        setCurrentPage={(p) => { setSelectedId(null); setPage(p); }}
        pendingCount={pending.length}
        approvedCount={approved.length}
        modelStatus={modelStatus}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col gap-6">
        {alert && (
          <AlertMessage type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        )}

        {page === 'upload' && (
          <UploadPage
            configs={configs}
            activeConfigId={activeConfigId}
            onSelectConfig={setActiveConfigId}
            onFilesSelected={handleFilesSelected}
            isProcessing={isProcessing}
            processingProgress={processingProgress}
            recentInvoices={invoices}
            onViewDetails={(id) => { setSelectedId(id); setPage('check'); }}
            onDeleteInvoice={handleDelete}
            onNavigateToReview={() => setPage('review')}
          />
        )}

        {page === 'review' && (
          <ReviewPage
            invoices={invoices}
            configs={configs}
            onViewDetails={(id) => { setSelectedId(id); setPage('check'); }}
            onDeleteInvoice={handleDelete}
            onStartReview={() => {
              if (pending.length > 0) { setSelectedId(pending[0].id); setPage('check'); }
            }}
          />
        )}

        {page === 'check' && selectedInvoice && (
          <CheckInvoicePage
            invoice={selectedInvoice}
            config={selectedConfig}
            onSave={(id, d, l, cf, clf) => handleSave(id, d, l, cf, clf, false)}
            onSaveAndNext={handleSaveAndNext}
            onBack={() => { setSelectedId(null); setPage('review'); }}
            pendingReviewIds={pending.map((i) => i.id)}
            onNavigateToInvoice={setSelectedId}
          />
        )}

        {page === 'approved' && (
          <ApprovedPage
            invoices={approved}
            configs={configs}
            onViewDetails={(id) => { setSelectedId(id); setPage('check'); }}
            onDeleteInvoice={handleDelete}
            onClearApproved={handleClearApproved}
            onExportExcel={handleExportExcel}
            onExportCsv={handleExportCsv}
          />
        )}

        {page === 'settings' && (
          <SettingsPage
            settings={settings}
            onSaveSettings={async (s) => { setSettings(s); await tauriService.saveAppSettings(s); }}
            configs={configs}
            onSaveConfigs={async (c) => { setConfigs(c); await tauriService.saveConfigs(c); }}
            modelStatus={modelStatus}
          />
        )}
      </main>
    </div>
  );
};
