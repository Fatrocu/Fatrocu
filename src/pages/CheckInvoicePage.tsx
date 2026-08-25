import React, { useState, useEffect, useMemo } from 'react';
import {
  ProcessedInvoice,
  ExtractedInvoiceFields,
  GroundedValue,
  InvoiceConfig,
  FieldConfig,
  GroundedPoint,
} from '../types';
import { DocumentViewer } from '../components/DocumentViewer';
import {
  ArrowLeft,
  Check,
  ArrowRight,
  Plus,
  Trash2,
  Cpu,
  ChevronLeft,
  ChevronRight,
  Save,
} from 'lucide-react';

interface CheckInvoicePageProps {
  invoice: ProcessedInvoice;
  config: InvoiceConfig;
  onSave: (
    invoiceId: string,
    updatedData: ExtractedInvoiceFields,
    updatedLineItems: any[],
    customFields: FieldConfig[],
    customLineItemFields: FieldConfig[]
  ) => void;
  onSaveAndNext: (
    invoiceId: string,
    updatedData: ExtractedInvoiceFields,
    updatedLineItems: any[],
    customFields: FieldConfig[],
    customLineItemFields: FieldConfig[]
  ) => void;
  onBack: () => void;
  pendingReviewIds: string[];
  onNavigateToInvoice: (id: string) => void;
}

const generateKeyFromLabel = (label: string): string => {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word, index) =>
      index === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join('');
};

export const CheckInvoicePage: React.FC<CheckInvoicePageProps> = ({
  invoice,
  config,
  onSave,
  onSaveAndNext,
  onBack,
  pendingReviewIds,
  onNavigateToInvoice,
}) => {
  const [formData, setFormData] = useState<ExtractedInvoiceFields>(
    invoice.extractedData || {}
  );
  const [lineItems, setLineItems] = useState<any[]>(invoice.lineItems || []);
  const [customFields, setCustomFields] = useState<FieldConfig[]>(
    invoice.customFields || []
  );
  const [customLineItemFields, setCustomLineItemFields] = useState<FieldConfig[]>(
    invoice.customLineItemFields || []
  );
  const [focusedFieldKey, setFocusedFieldKey] = useState<string | null>(null);

  useEffect(() => {
    setFormData(invoice.extractedData || {});
    setLineItems(invoice.lineItems || []);
    setCustomFields(invoice.customFields || []);
    setCustomLineItemFields(invoice.customLineItemFields || []);
  }, [invoice]);

  const allMainFields = useMemo(
    () => [...config.fields, ...customFields],
    [config.fields, customFields]
  );

  const allLineItemFields = useMemo(
    () => [...(config.lineItemFields || []), ...customLineItemFields],
    [config.lineItemFields, customLineItemFields]
  );

  // Collect all polygons for the DocumentViewer
  const allPolygons = useMemo(() => {
    const polys: Array<{ key: string; label: string; poly: GroundedPoint[] }> = [];
    allMainFields.forEach((f) => {
      const gv = formData[f.key];
      if (gv && gv.boundingPoly && gv.boundingPoly.length >= 3) {
        polys.push({ key: f.key, label: f.label, poly: gv.boundingPoly });
      }
    });
    return polys;
  }, [allMainFields, formData]);

  const activePolygon = useMemo(() => {
    if (!focusedFieldKey) return undefined;
    return formData[focusedFieldKey]?.boundingPoly;
  }, [focusedFieldKey, formData]);

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), value },
    }));
  };

  const handleLineItemChange = (index: number, key: string, value: string) => {
    setLineItems((prev) => {
      const next = [...prev];
      const row = { ...next[index] };
      row[key] = { ...(row[key] || {}), value };
      next[index] = row;
      return next;
    });
  };

  const addLineItemRow = () => {
    const newRow: { [key: string]: GroundedValue } = {};
    allLineItemFields.forEach((f) => {
      newRow[f.key] = { value: '' };
    });
    setLineItems((prev) => [...prev, newRow]);
  };

  const removeLineItemRow = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addField = (type: 'main' | 'lineItem') => {
    const label = window.prompt('Yeni alanın adını girin:');
    if (!label) return;
    const key = generateKeyFromLabel(label) + Date.now().toString().slice(-4);

    if (type === 'main') {
      setCustomFields((prev) => [...prev, { key, label }]);
      setFormData((prev) => ({ ...prev, [key]: { value: '' } }));
    } else {
      setCustomLineItemFields((prev) => [...prev, { key, label }]);
      setLineItems((prev) =>
        prev.map((row) => ({ ...row, [key]: { value: '' } }))
      );
    }
  };

  const removeCustomField = (key: string, type: 'main' | 'lineItem') => {
    if (type === 'main') {
      setCustomFields((prev) => prev.filter((f) => f.key !== key));
      setFormData((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } else {
      setCustomLineItemFields((prev) => prev.filter((f) => f.key !== key));
      setLineItems((prev) =>
        prev.map((row) => {
          const next = { ...row };
          delete next[key];
          return next;
        })
      );
    }
  };

  const currentPendingIndex = pendingReviewIds.indexOf(invoice.id);
  const hasPrev = currentPendingIndex > 0;
  const hasNext = currentPendingIndex >= 0 && currentPendingIndex < pendingReviewIds.length - 1;

  const handleSaveClick = () => {
    onSave(invoice.id, formData, lineItems, customFields, customLineItemFields);
  };

  const handleSaveAndNextClick = () => {
    onSaveAndNext(
      invoice.id,
      formData,
      lineItems,
      customFields,
      customLineItemFields
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800/90 p-4 rounded-2xl border border-slate-700 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-semibold text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Listeye Dön</span>
          </button>
          <div>
            <h3 className="font-bold text-sm text-white truncate max-w-sm">
              {invoice.fileName}
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              {config.name} &bull; {invoice.modelUsed || 'NaviDC-OCR'}
            </span>
          </div>
        </div>

        {/* Pending Invoices Pager & Action Buttons */}
        <div className="flex items-center gap-2">
          {pendingReviewIds.length > 1 && (
            <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded-xl border border-slate-700 text-xs">
              <button
                disabled={!hasPrev}
                onClick={() => onNavigateToInvoice(pendingReviewIds[currentPendingIndex - 1])}
                className="p-1 hover:bg-slate-800 disabled:opacity-30 rounded text-slate-300"
                title="Önceki Fatura"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-slate-300 font-bold px-1.5">
                {currentPendingIndex + 1} / {pendingReviewIds.length}
              </span>
              <button
                disabled={!hasNext}
                onClick={() => onNavigateToInvoice(pendingReviewIds[currentPendingIndex + 1])}
                className="p-1 hover:bg-slate-800 disabled:opacity-30 rounded text-slate-300"
                title="Sonraki Fatura"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={handleSaveClick}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-xl shadow-md transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Kaydet</span>
          </button>

          <button
            onClick={handleSaveAndNextClick}
            className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Onayla ve Sonrakine Geç</span>
          </button>
        </div>
      </div>

      {/* Split View: Left Document Preview / Right Structured Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-210px)] min-h-[580px]">
        {/* Left 6 Columns: Interactive Document Canvas */}
        <div className="lg:col-span-6 h-full flex flex-col">
          {invoice.previewImageBase64 ? (
            <DocumentViewer
              imageSrc={invoice.previewImageBase64}
              fileName={invoice.fileName}
              activePolygon={activePolygon}
              allPolygons={allPolygons}
              onSelectField={(key) => setFocusedFieldKey(key)}
            />
          ) : (
            <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center text-slate-500 text-sm">
              Görsel önizleme yüklenemedi.
            </div>
          )}
        </div>

        {/* Right 6 Columns: Structured Data Form & Line Items */}
        <div className="lg:col-span-6 h-full overflow-y-auto bg-slate-800/80 rounded-2xl border border-slate-700 p-6 space-y-6 shadow-xl">
          {/* Main Form Fields */}
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-700">
              <h4 className="font-bold text-sm text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <span>Temel Fatura Bilgileri</span>
              </h4>
              <button
                type="button"
                onClick={() => addField('main')}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-bold px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Alan Ekle
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {allMainFields.map((field) => {
                const isCustom = customFields.some((cf) => cf.key === field.key);
                const hasPoly =
                  formData[field.key]?.boundingPoly &&
                  formData[field.key]!.boundingPoly!.length >= 3;

                return (
                  <div
                    key={field.key}
                    className={`p-3 rounded-xl border transition-all ${
                      focusedFieldKey === field.key
                        ? 'bg-slate-700/80 border-indigo-500 ring-1 ring-indigo-500 shadow-md'
                        : 'bg-slate-900/60 border-slate-700/70 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <label
                        htmlFor={field.key}
                        className="text-xs font-semibold text-slate-300 truncate"
                      >
                        {field.label}
                      </label>
                      <div className="flex items-center gap-1">
                        {hasPoly && (
                          <span
                            className="w-2 h-2 rounded-full bg-indigo-400"
                            title="Görselde konumu tespit edildi"
                          />
                        )}
                        {isCustom && (
                          <button
                            type="button"
                            onClick={() => removeCustomField(field.key, 'main')}
                            className="p-0.5 text-slate-500 hover:text-red-400"
                            title="Alanı Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <input
                      type="text"
                      id={field.key}
                      value={formData[field.key]?.value || ''}
                      onFocus={() => setFocusedFieldKey(field.key)}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg py-1.5 px-2.5 text-sm text-slate-100 font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Line Items / KDV Breakdown Table */}
          {allLineItemFields.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-700">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-sm text-indigo-300 uppercase tracking-wider">
                  Satır Kalemleri &amp; KDV Detayları ({lineItems.length})
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => addField('lineItem')}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-bold px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20"
                  >
                    <Plus className="w-3.5 h-3.5" /> Sütun Ekle
                  </button>
                  <button
                    type="button"
                    onClick={addLineItemRow}
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-bold px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20"
                  >
                    <Plus className="w-3.5 h-3.5" /> Satır Ekle
                  </button>
                </div>
              </div>

              {lineItems.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-900/60 shadow-inner">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-800 border-b border-slate-700 text-slate-300">
                        {allLineItemFields.map((f) => (
                          <th key={f.key} className="py-2.5 px-3 font-semibold">
                            {f.label}
                          </th>
                        ))}
                        <th className="py-2.5 px-2 w-10 text-center">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {lineItems.map((row, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-slate-800/40">
                          {allLineItemFields.map((f) => (
                            <td key={f.key} className="p-2">
                              <input
                                type="text"
                                value={row[f.key]?.value || ''}
                                onChange={(e) =>
                                  handleLineItemChange(rowIdx, f.key, e.target.value)
                                }
                                className="w-full bg-slate-800 border border-slate-700 rounded py-1 px-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                              />
                            </td>
                          ))}
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeLineItemRow(rowIdx)}
                              className="p-1 text-slate-500 hover:text-red-400 rounded"
                              title="Satırı Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 bg-slate-900/40 rounded-xl border border-slate-800 text-xs text-slate-500">
                  Satır kalemi bulunmuyor. Yeni eklemek için "Satır Ekle" butonunu kullanabilirsiniz.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
