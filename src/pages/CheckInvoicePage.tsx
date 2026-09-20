import React, { useState, useEffect, useMemo } from 'react';
import {
  ProcessedInvoice, ExtractedInvoiceFields, GroundedValue,
  InvoiceConfig, FieldConfig, GroundedPoint,
} from '../types';
import { DocumentViewer } from '../components/DocumentViewer';
import {
  ArrowLeft, Check, ChevronLeft, ChevronRight, Save, Plus, Trash2,
  FileCheck, HelpCircle, Layers, CheckCircle2
} from 'lucide-react';

interface CheckInvoicePageProps {
  invoice: ProcessedInvoice;
  config: InvoiceConfig;
  onSave: (id: string, data: ExtractedInvoiceFields, lines: any[], cf: FieldConfig[], clf: FieldConfig[]) => void;
  onSaveAndNext: (id: string, data: ExtractedInvoiceFields, lines: any[], cf: FieldConfig[], clf: FieldConfig[]) => void;
  onBack: () => void;
  pendingReviewIds: string[];
  onNavigateToInvoice: (id: string) => void;
}

const toKey = (label: string) =>
  label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9\s]/g, '').trim()
    .split(/\s+/).map((w, i) => i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()).join('') +
  Date.now().toString().slice(-4);

export const CheckInvoicePage: React.FC<CheckInvoicePageProps> = ({
  invoice, config, onSave, onSaveAndNext, onBack, pendingReviewIds, onNavigateToInvoice,
}) => {
  const [formData, setFormData] = useState<ExtractedInvoiceFields>(invoice.extractedData || {});
  const [lineItems, setLineItems] = useState<any[]>(invoice.lineItems || []);
  const [customFields, setCustomFields] = useState<FieldConfig[]>(invoice.customFields || []);
  const [customLineItemFields, setCustomLineItemFields] = useState<FieldConfig[]>(invoice.customLineItemFields || []);
  const [focusedKey, setFocusedKey] = useState<string | null>(null);

  useEffect(() => {
    setFormData(invoice.extractedData || {});
    setLineItems(invoice.lineItems || []);
    setCustomFields(invoice.customFields || []);
    setCustomLineItemFields(invoice.customLineItemFields || []);
  }, [invoice]);

  const allMain = useMemo(() => [...config.fields, ...customFields], [config.fields, customFields]);
  const allLine = useMemo(() => [...(config.lineItemFields || []), ...customLineItemFields], [config.lineItemFields, customLineItemFields]);

  const allPolygons = useMemo(() =>
    allMain.flatMap((f) => {
      const p = formData[f.key]?.boundingPoly;
      return p && p.length >= 3 ? [{ key: f.key, label: f.label, poly: p }] : [];
    }), [allMain, formData]);

  const activePolygon = useMemo(() =>
    focusedKey ? formData[focusedKey]?.boundingPoly : undefined, [focusedKey, formData]);

  const onChange = (key: string, value: string) =>
    setFormData((p) => ({ ...p, [key]: { ...p[key], value } }));

  const onLineChange = (idx: number, key: string, value: string) =>
    setLineItems((p) => p.map((r, i) => i === idx ? { ...r, [key]: { ...r[key], value } } : r));

  const addMainField = () => {
    const label = window.prompt('Yeni Alan Adı:'); if (!label) return;
    const key = toKey(label);
    setCustomFields((p) => [...p, { key, label }]);
    setFormData((p) => ({ ...p, [key]: { value: '' } }));
  };

  const addLineCol = () => {
    const label = window.prompt('Yeni Kalem Sütun Adı:'); if (!label) return;
    const key = toKey(label);
    setCustomLineItemFields((p) => [...p, { key, label }]);
    setLineItems((p) => p.map((r) => ({ ...r, [key]: { value: '' } })));
  };

  const addLineRow = () => {
    const row: Record<string, GroundedValue> = {};
    allLine.forEach((f) => { row[f.key] = { value: '' }; });
    setLineItems((p) => [...p, row]);
  };

  const removeCustomField = (key: string) => {
    setCustomFields((p) => p.filter((f) => f.key !== key));
    setFormData((p) => { const n = { ...p }; delete n[key]; return n; });
  };

  const removeLineRow = (idx: number) => setLineItems((p) => p.filter((_, i) => i !== idx));

  const idx = pendingReviewIds.indexOf(invoice.id);
  const hasPrev = idx > 0;
  const hasNext = idx >= 0 && idx < pendingReviewIds.length - 1;

  const submit = (approve: boolean) => {
    if (approve) onSaveAndNext(invoice.id, formData, lineItems, customFields, customLineItemFields);
    else onSave(invoice.id, formData, lineItems, customFields, customLineItemFields);
  };

  return (
    <div className="fade-in flex flex-col gap-5 h-[calc(100vh-120px)] min-h-[650px] pb-4">
      
      {/* Top Controller Bar */}
      <div className="scribble-card p-4 bg-white flex flex-wrap items-center justify-between gap-4 shrink-0">
        
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="scribble-btn scribble-btn-secondary px-3.5 py-2 text-xs flex items-center gap-1.5 shadow-[2px_2px_0px_#000]"
          >
            <ArrowLeft size={16} className="stroke-[3]" />
            <span>Listeye Dön</span>
          </button>

          <div className="min-w-0">
            <h3 className="font-heading font-black text-base text-black truncate max-w-sm">
              {invoice.fileName}
            </h3>
            <span className="font-scribble text-xs text-neutral-600 font-bold block -mt-0.5">
              Şablon: {config.name}
            </span>
          </div>
        </div>

        {/* Pager & Action CTA Buttons */}
        <div className="flex items-center gap-3">
          {pendingReviewIds.length > 1 && (
            <div className="flex items-center bg-neutral-100 border-2 border-black rounded-xl p-1 shadow-[2px_2px_0px_#000] gap-1">
              <button
                disabled={!hasPrev}
                onClick={() => onNavigateToInvoice(pendingReviewIds[idx - 1])}
                className="p-1.5 hover:bg-white disabled:opacity-30 rounded-lg text-black transition-colors"
                title="Önceki Fatura"
              >
                <ChevronLeft size={16} className="stroke-[3]" />
              </button>
              <span className="font-heading font-black text-xs px-2 text-black font-mono">
                {idx + 1} / {pendingReviewIds.length}
              </span>
              <button
                disabled={!hasNext}
                onClick={() => onNavigateToInvoice(pendingReviewIds[idx + 1])}
                className="p-1.5 hover:bg-white disabled:opacity-30 rounded-lg text-black transition-colors"
                title="Sonraki Fatura"
              >
                <ChevronRight size={16} className="stroke-[3]" />
              </button>
            </div>
          )}

          <button
            onClick={() => submit(false)}
            className="scribble-btn scribble-btn-secondary px-4 py-2.5 text-xs flex items-center gap-2 shadow-[2.5px_2.5px_0px_#000]"
          >
            <Save size={16} className="stroke-[2.5]" />
            <span>Kaydet</span>
          </button>

          <button
            onClick={() => submit(true)}
            className="scribble-btn scribble-btn-primary px-6 py-2.5 text-xs flex items-center gap-2 shadow-[3px_3px_0px_#000]"
          >
            <Check size={16} className="stroke-[3]" />
            <span>Onayla ve İlerle</span>
          </button>
        </div>

      </div>

      {/* Main Split Grid (50% Viewer, 50% Form) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
        
        {/* Left Column: Hand-drawn Document Viewer */}
        <div className="lg:col-span-6 h-full min-h-0 flex flex-col">
          {invoice.previewImageBase64 ? (
            <DocumentViewer
              imageSrc={invoice.previewImageBase64}
              fileName={invoice.fileName}
              activePolygon={activePolygon}
              allPolygons={allPolygons}
              onSelectField={(k) => setFocusedKey(k)}
            />
          ) : (
            <div className="scribble-card bg-white h-full flex items-center justify-center font-scribble font-bold text-neutral-500 text-sm">
              Önizleme görseli yüklenemedi.
            </div>
          )}
        </div>

        {/* Right Column: Structured Data Form with large tactile inputs */}
        <div className="lg:col-span-6 h-full min-h-0 overflow-y-auto pr-1 flex flex-col gap-5">
          
          {/* Main Document Fields Box */}
          <div className="scribble-card p-6 bg-white space-y-5">
            <div className="flex items-center justify-between pb-3 border-b-[2.5px] border-black">
              <div className="flex items-center gap-2">
                <FileCheck size={20} className="text-black stroke-[2.5]" />
                <h4 className="font-heading font-black text-base text-black uppercase tracking-wider">
                  Temel Fatura Bilgileri
                </h4>
              </div>
              <button
                onClick={addMainField}
                className="scribble-btn scribble-btn-secondary text-xs px-3 py-1.5 shadow-[2px_2px_0px_#000] flex items-center gap-1"
              >
                <Plus size={14} className="stroke-[3]" />
                <span>Alan Ekle</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {allMain.map((field) => {
                const isCustom = customFields.some((cf) => cf.key === field.key);
                const active = focusedKey === field.key;
                const hasPoly = formData[field.key]?.boundingPoly && formData[field.key]!.boundingPoly!.length >= 3;

                return (
                  <div
                    key={field.key}
                    className={`p-3.5 rounded-xl border-[2px] transition-all bg-white ${
                      active
                        ? 'border-black shadow-[4px_4px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
                        : 'border-black/70 shadow-[2px_2px_0px_#000] hover:border-black'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-heading font-extrabold text-xs text-black block truncate">
                        {field.label}
                      </label>
                      <div className="flex items-center gap-1.5">
                        {hasPoly && (
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black bg-black"
                            title="Görselde koordinatı işaretlendi"
                          />
                        )}
                        {isCustom && (
                          <button
                            onClick={() => removeCustomField(field.key)}
                            className="text-neutral-400 hover:text-black p-0.5"
                            title="Alanı Sil"
                          >
                            <Trash2 size={13} className="stroke-[2.5]" />
                          </button>
                        )}
                      </div>
                    </div>

                    <input
                      type="text"
                      value={formData[field.key]?.value || ''}
                      onFocus={() => setFocusedKey(field.key)}
                      onBlur={() => setFocusedKey(null)}
                      onChange={(e) => onChange(field.key, e.target.value)}
                      className="w-full font-heading font-bold text-sm bg-neutral-50 border-2 border-black rounded-lg p-2.5 shadow-[2px_2px_0px_#000]"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Line Items Table with Lined Paper Effect */}
          {allLine.length > 0 && (
            <div className="scribble-card p-6 bg-white space-y-4">
              <div className="flex items-center justify-between pb-3 border-b-[2.5px] border-black">
                <div className="flex items-center gap-2">
                  <Layers size={20} className="text-black stroke-[2.5]" />
                  <h4 className="font-heading font-black text-base text-black uppercase tracking-wider">
                    Kalemler ve KDV Dökümü ({lineItems.length})
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={addLineCol}
                    className="scribble-btn scribble-btn-secondary text-xs px-3 py-1.5 shadow-[2px_2px_0px_#000]"
                  >
                    <Plus size={14} className="stroke-[3]" />
                    <span>Sütun Ekle</span>
                  </button>
                  <button
                    onClick={addLineRow}
                    className="scribble-btn scribble-btn-primary text-xs px-3.5 py-1.5 shadow-[2px_2px_0px_#000]"
                  >
                    <Plus size={14} className="stroke-[3]" />
                    <span>Satır Ekle</span>
                  </button>
                </div>
              </div>

              {lineItems.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border-2 border-black bg-white shadow-[3px_3px_0px_#000]">
                  <table className="w-full text-left text-xs border-collapse font-heading font-bold">
                    <thead>
                      <tr className="bg-neutral-100 border-b-2 border-black text-black">
                        {allLine.map((f) => (
                          <th key={f.key} className="p-3 uppercase tracking-wider text-xs">
                            {f.label}
                          </th>
                        ))}
                        <th className="p-3 w-12 text-center">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-black/10">
                      {lineItems.map((row, ri) => (
                        <tr key={ri} className="hover:bg-neutral-50 transition-colors">
                          {allLine.map((f) => (
                            <td key={f.key} className="p-2.5">
                              <input
                                type="text"
                                value={row[f.key]?.value || ''}
                                onChange={(e) => onLineChange(ri, f.key, e.target.value)}
                                className="w-full bg-white border-[1.5px] border-black rounded-md p-1.5 font-heading font-semibold text-xs shadow-[1px_1px_0px_#000]"
                              />
                            </td>
                          ))}
                          <td className="p-2.5 text-center">
                            <button
                              onClick={() => removeLineRow(ri)}
                              className="w-7 h-7 rounded border border-black hover:bg-black hover:text-white inline-flex items-center justify-center transition-colors shadow-[1px_1px_0px_#000]"
                              title="Satırı Kaldır"
                            >
                              <Trash2 size={13} className="stroke-[2.5]" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 border-2 border-dashed border-black rounded-xl text-center font-scribble font-bold text-neutral-500 text-xs">
                  Henüz satır kalemi eklenmemiş. Yukarıdaki "Satır Ekle" butonuna tıklayabilirsiniz.
                </div>
              )}
            </div>
          )}

          {/* Raw OCR / Markdown collapsible view */}
          {invoice.rawOcr && (
            <details className="scribble-card p-4 bg-white group cursor-pointer">
              <summary className="font-heading font-bold text-xs text-black uppercase tracking-wider select-none list-none flex items-center justify-between">
                <span>[+] DeepSeek-OCR Ham Markdown Metni</span>
                <span className="font-scribble text-xs text-neutral-400 font-bold group-open:hidden">Genişlet</span>
              </summary>
              <pre className="mt-3 p-4 bg-neutral-50 border-2 border-black rounded-lg text-xs font-mono font-medium text-black whitespace-pre-wrap max-h-48 overflow-y-auto shadow-[inset_2px_2px_0px_#00000010]">
                {invoice.rawOcr}
              </pre>
            </details>
          )}

        </div>

      </div>

    </div>
  );
};
