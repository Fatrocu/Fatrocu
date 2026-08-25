import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AlertMessage } from './components/AlertMessage';
import { UploadPage } from './pages/UploadPage';
import { ReviewPage } from './pages/ReviewPage';
import { CheckInvoicePage } from './pages/CheckInvoicePage';
import { ApprovedPage } from './pages/ApprovedPage';
import { SettingsPage } from './pages/SettingsPage';
import {
  ProcessedInvoice,
  InvoiceConfig,
  AppSettings,
  ModelStatus,
  AlertType,
  ExtractedInvoiceFields,
  FieldConfig,
  FileProcessingStatus,
} from './types';
import { tauriService } from './services/tauriService';
import { PREDEFINED_CONFIGS } from './services/configService';

export const App: React.FC = () => {
  const [invoices, setInvoices] = useState<ProcessedInvoice[]>([]);
  const [configs, setConfigs] = useState<InvoiceConfig[]>(PREDEFINED_CONFIGS);
  const [activeConfigId, setActiveConfigId] = useState<string>(PREDEFINED_CONFIGS[0].id);
  const [settings, setSettings] = useState<AppSettings>({
    navidcUrl: 'http://127.0.0.1:8765',
    autoStartSidecar: true,
    device: 'cuda',
    modelPath: 'StarDoc-AI/NaviDC-OCR',
    saveProcessedFiles: true,
    defaultExportFormat: 'xlsx',
  });
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);

  const [currentPage, setCurrentPage] = useState<
    'upload' | 'review' | 'settings' | 'approved' | 'check'
  >('upload');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });

  const [alert, setAlert] = useState<{ type: AlertType; message: string } | null>(null);

  const showAlert = (type: AlertType, message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 6000);
  };

  // Initial Load from Rust Backend
  useEffect(() => {
    const initApp = async () => {
      try {
        const [loadedSettings, loadedConfigs, loadedInvoices, initialModelStatus] =
          await Promise.all([
            tauriService.getAppSettings(),
            tauriService.getConfigs(),
            tauriService.getInvoices(),
            tauriService.checkNavidcStatus(),
          ]);

        if (loadedSettings) setSettings(loadedSettings);
        if (loadedConfigs && loadedConfigs.length > 0) {
          setConfigs(loadedConfigs);
          setActiveConfigId(loadedConfigs[0].id);
        }
        if (loadedInvoices) setInvoices(loadedInvoices);
        setModelStatus(initialModelStatus);
      } catch (err) {
        console.error('Initialization error:', err);
      }
    };
    initApp();
  }, []);

  const handleRefreshModelStatus = async () => {
    try {
      const status = await tauriService.checkNavidcStatus();
      setModelStatus(status);
      showAlert(
        status.online ? 'success' : 'warning',
        status.online
          ? `NaviDC-OCR Sunucusu Aktif (${status.device})`
          : 'NaviDC-OCR sunucusuna bağlanılamadı.'
      );
    } catch {
      showAlert('error', 'Model durumu sorgulanırken hata oluştu.');
    }
  };

  const handleStartServer = async () => {
    try {
      await tauriService.startNavidcServer();
      showAlert('info', 'NaviDC-OCR motor sunucusu başlatılıyor...');
      setTimeout(handleRefreshModelStatus, 3000);
    } catch (e) {
      showAlert('error', `Sunucu başlatılamadı: ${e}`);
    }
  };

  // Batch Files Processing Queue
  const handleFilesSelected = async (files: File[]) => {
    const targetConfig =
      configs.find((c) => c.id === activeConfigId) || configs[0] || PREDEFINED_CONFIGS[0];

    setIsProcessing(true);
    setProcessingProgress({ current: 0, total: files.length });

    const newInvoices: ProcessedInvoice[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const tempId = `inv_${Date.now()}_${i}`;

      try {
        const processed = await tauriService.processInvoiceFile(file, tempId, targetConfig);
        await tauriService.saveInvoice(processed);
        newInvoices.push(processed);
        setInvoices((prev) => [processed, ...prev.filter((p) => p.id !== processed.id)]);
      } catch (err) {
        console.error(`Error processing ${file.name}:`, err);
        const errorInv: ProcessedInvoice = {
          id: tempId,
          fileName: file.name,
          fileType: file.type,
          status: FileProcessingStatus.ERROR,
          errorMessage: String(err),
          configId: targetConfig.id,
          createdAt: new Date().toISOString(),
        };
        await tauriService.saveInvoice(errorInv);
        newInvoices.push(errorInv);
        setInvoices((prev) => [errorInv, ...prev]);
      }

      setProcessingProgress({ current: i + 1, total: files.length });
    }

    setIsProcessing(false);
    showAlert('success', `${files.length} belge başarıyla işlendi ve kuyruğa alındı!`);
    setCurrentPage('review');
  };

  const handleViewInvoiceDetails = (id: string) => {
    setSelectedInvoiceId(id);
    setCurrentPage('check');
  };

  const handleDeleteInvoice = async (id: string) => {
    try {
      await tauriService.deleteInvoice(id);
      setInvoices((prev) => prev.filter((i) => i.id !== id));
      if (selectedInvoiceId === id) {
        setSelectedInvoiceId(null);
        setCurrentPage('review');
      }
      showAlert('info', 'Fatura silindi.');
    } catch (e) {
      showAlert('error', `Fatura silinirken hata: ${e}`);
    }
  };

  const handleClearApproved = async () => {
    if (window.confirm('Tüm onaylanmış faturalar arşivden silinecek. Onaylıyor musunuz?')) {
      const remaining = invoices.filter((i) => i.reviewStatus !== 'reviewed');
      for (const inv of invoices.filter((i) => i.reviewStatus === 'reviewed')) {
        await tauriService.deleteInvoice(inv.id);
      }
      setInvoices(remaining);
      showAlert('info', 'Onaylanmış faturalar temizlendi.');
    }
  };

  const handleSaveInvoiceChanges = async (
    invoiceId: string,
    updatedData: ExtractedInvoiceFields,
    updatedLineItems: any[],
    customFields: FieldConfig[],
    customLineItemFields: FieldConfig[],
    markApproved: boolean = false
  ) => {
    const existing = invoices.find((i) => i.id === invoiceId);
    if (!existing) return;

    const updated: ProcessedInvoice = {
      ...existing,
      extractedData: updatedData,
      lineItems: updatedLineItems,
      customFields,
      customLineItemFields,
      reviewStatus: markApproved ? 'reviewed' : existing.reviewStatus || 'pending',
    };

    await tauriService.saveInvoice(updated);
    setInvoices((prev) => prev.map((i) => (i.id === invoiceId ? updated : i)));

    if (markApproved) {
      showAlert('success', `'${existing.fileName}' onaylandı ve arşive eklendi!`);
    } else {
      showAlert('info', 'Değişiklikler kaydedildi.');
    }
  };

  const handleSaveAndNext = async (
    invoiceId: string,
    updatedData: ExtractedInvoiceFields,
    updatedLineItems: any[],
    customFields: FieldConfig[],
    customLineItemFields: FieldConfig[]
  ) => {
    await handleSaveInvoiceChanges(
      invoiceId,
      updatedData,
      updatedLineItems,
      customFields,
      customLineItemFields,
      true
    );

    // Find next pending invoice
    const pending = invoices.filter(
      (i) => i.id !== invoiceId && i.reviewStatus === 'pending'
    );

    if (pending.length > 0) {
      setSelectedInvoiceId(pending[0].id);
      setCurrentPage('check');
    } else {
      setSelectedInvoiceId(null);
      setCurrentPage('approved');
      showAlert('success', 'Tüm bekleyen faturalar onaylandı!');
    }
  };

  const handleExportExcel = async () => {
    const approved = invoices.filter((i) => i.reviewStatus === 'reviewed');
    const toExport = approved.length > 0 ? approved : invoices;
    if (toExport.length === 0) {
      showAlert('warning', 'Dışa aktarılacak fatura bulunmuyor.');
      return;
    }
    try {
      const savedPath = await tauriService.exportInvoicesExcel(toExport, configs);
      showAlert('success', `Excel dosyası oluşturuldu: ${savedPath}`);
    } catch (e) {
      showAlert('error', `Excel aktarım hatası: ${e}`);
    }
  };

  const handleExportCsv = async () => {
    const approved = invoices.filter((i) => i.reviewStatus === 'reviewed');
    const toExport = approved.length > 0 ? approved : invoices;
    if (toExport.length === 0) {
      showAlert('warning', 'Dışa aktarılacak fatura bulunmuyor.');
      return;
    }
    try {
      const savedPath = await tauriService.exportInvoicesCsv(toExport, configs);
      showAlert('success', `CSV dosyası oluşturuldu: ${savedPath}`);
    } catch (e) {
      showAlert('error', `CSV aktarım hatası: ${e}`);
    }
  };

  const pendingInvoices = invoices.filter((i) => i.reviewStatus === 'pending');
  const approvedInvoices = invoices.filter((i) => i.reviewStatus === 'reviewed');

  const selectedInvoice = invoices.find((i) => i.id === selectedInvoiceId);
  const selectedConfig = selectedInvoice
    ? configs.find((c) => c.id === selectedInvoice.configId) || configs[0]
    : configs[0];

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100">
      <Header
        currentPage={currentPage === 'check' ? 'review' : currentPage}
        setCurrentPage={(page) => {
          setSelectedInvoiceId(null);
          setCurrentPage(page);
        }}
        pendingCount={pendingInvoices.length}
        approvedCount={approvedInvoices.length}
        modelStatus={modelStatus}
        onRefreshModel={handleRefreshModelStatus}
        onExportExcel={handleExportExcel}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-4">
        {alert && (
          <AlertMessage
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {currentPage === 'upload' && (
          <UploadPage
            configs={configs}
            activeConfigId={activeConfigId}
            onSelectConfig={(id) => setActiveConfigId(id)}
            onFilesSelected={handleFilesSelected}
            isProcessing={isProcessing}
            processingProgress={processingProgress}
            recentInvoices={invoices}
            onViewDetails={handleViewInvoiceDetails}
            onDeleteInvoice={handleDeleteInvoice}
            onNavigateToReview={() => setCurrentPage('review')}
          />
        )}

        {currentPage === 'review' && (
          <ReviewPage
            invoices={invoices}
            configs={configs}
            onViewDetails={handleViewInvoiceDetails}
            onDeleteInvoice={handleDeleteInvoice}
            onStartReview={() => {
              if (pendingInvoices.length > 0) {
                handleViewInvoiceDetails(pendingInvoices[0].id);
              }
            }}
          />
        )}

        {currentPage === 'check' && selectedInvoice && (
          <CheckInvoicePage
            invoice={selectedInvoice}
            config={selectedConfig}
            onSave={(id, data, lines, cf, clf) =>
              handleSaveInvoiceChanges(id, data, lines, cf, clf, false)
            }
            onSaveAndNext={handleSaveAndNext}
            onBack={() => {
              setSelectedInvoiceId(null);
              setCurrentPage('review');
            }}
            pendingReviewIds={pendingInvoices.map((i) => i.id)}
            onNavigateToInvoice={(id) => setSelectedInvoiceId(id)}
          />
        )}

        {currentPage === 'approved' && (
          <ApprovedPage
            invoices={approvedInvoices}
            configs={configs}
            onViewDetails={handleViewInvoiceDetails}
            onDeleteInvoice={handleDeleteInvoice}
            onClearApproved={handleClearApproved}
            onExportExcel={handleExportExcel}
            onExportCsv={handleExportCsv}
          />
        )}

        {currentPage === 'settings' && (
          <SettingsPage
            settings={settings}
            onSaveSettings={async (s) => {
              setSettings(s);
              await tauriService.saveAppSettings(s);
              showAlert('success', 'Ayarlar kaydedildi.');
            }}
            configs={configs}
            onSaveConfigs={async (c) => {
              setConfigs(c);
              await tauriService.saveConfigs(c);
              showAlert('success', 'Şablonlar güncellendi.');
            }}
            modelStatus={modelStatus}
            onRefreshModel={handleRefreshModelStatus}
            onStartServer={handleStartServer}
          />
        )}
      </main>

      <Footer />
    </div>
  );
};
