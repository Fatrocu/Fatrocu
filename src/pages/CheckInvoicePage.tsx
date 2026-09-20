import React, { useState, useEffect, useMemo } from 'react';
import {
  ProcessedInvoice, ExtractedInvoiceFields, GroundedValue,
  InvoiceConfig, FieldConfig, GroundedPoint,
} from '../types';
import { DocumentViewer } from '../components/DocumentViewer';
import {
  ArrowLeft, Check, ChevronLeft, ChevronRight, Save, Plus, Trash2,
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
    const label = window.prompt('Alan adı:'); if (!label) return;
    const key = toKey(label);
    setCustomFields((p) => [...p, { key, label }]);
    setFormData((p) => ({ ...p, [key]: { value: '' } }));
  };

  const addLineCol = () => {
    const label = window.prompt('Sütun adı:'); if (!label) return;
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

  // ── input style helper ───────────────────────────────────────────────────
  const inp = (active: boolean): React.CSSProperties => ({
    width: '100%',
    background: active ? '#181818' : '#0f0f0f',
    border: `1px solid ${active ? '#444' : '#1f1f1f'}`,
    borderRadius: 5,
    padding: '5px 8px',
    fontSize: 12,
    color: '#ddd',
    outline: 'none',
    transition: 'border-color 0.12s',
  });

  const btn = (primary: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
    fontSize: 12, fontWeight: 700,
    background: primary ? '#fff' : '#1a1a1a',
    color: primary ? '#000' : '#888',
    transition: 'opacity 0.1s',
  });

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12, height: 'calc(100vh - 80px)' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button onClick={onBack} style={{ ...btn(false), gap: 4 }}>
          <ArrowLeft size={13} /> Geri
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {invoice.fileName}
          </div>
          <div style={{ fontSize: 11, color: '#444' }}>{config.name}</div>
        </div>

        {pendingReviewIds.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#111', border: '1px solid #1f1f1f', borderRadius: 6, padding: '4px 8px' }}>
            <button
              disabled={!hasPrev}
              onClick={() => onNavigateToInvoice(pendingReviewIds[idx - 1])}
              style={{ background: 'none', border: 'none', cursor: hasPrev ? 'pointer' : 'default', color: hasPrev ? '#666' : '#222', padding: 2 }}
            ><ChevronLeft size={13} /></button>
            <span style={{ fontSize: 11, color: '#444', fontVariantNumeric: 'tabular-nums', minWidth: 40, textAlign: 'center' }}>
              {idx + 1} / {pendingReviewIds.length}
            </span>
            <button
              disabled={!hasNext}
              onClick={() => onNavigateToInvoice(pendingReviewIds[idx + 1])}
              style={{ background: 'none', border: 'none', cursor: hasNext ? 'pointer' : 'default', color: hasNext ? '#666' : '#222', padding: 2 }}
            ><ChevronRight size={13} /></button>
          </div>
        )}

        <button onClick={() => submit(false)} style={btn(false)}>
          <Save size={13} /> Kaydet
        </button>
        <button onClick={() => submit(true)} style={btn(true)}>
          <Check size={13} /> Onayla
        </button>
      </div>

      {/* Split pane */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1, minHeight: 0 }}>
        {/* Document viewer */}
        <div style={{ minHeight: 0 }}>
          {invoice.previewImageBase64 ? (
            <DocumentViewer
              imageSrc={invoice.previewImageBase64}
              fileName={invoice.fileName}
              activePolygon={activePolygon}
              allPolygons={allPolygons}
              onSelectField={(k) => setFocusedKey(k)}
            />
          ) : (
            <div className="card" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: 12 }}>
              Önizleme yok
            </div>
          )}
        </div>

        {/* Form panel */}
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Main fields */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#444', letterSpacing: '0.05em' }}>ALANLAR</span>
              <button onClick={addMainField} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Plus size={12} /> Alan Ekle
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {allMain.map((field) => {
                const isCustom = customFields.some((cf) => cf.key === field.key);
                const active = focusedKey === field.key;
                return (
                  <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ fontSize: 11, color: active ? '#888' : '#444', fontWeight: 500 }}>
                        {field.label}
                      </label>
                      {isCustom && (
                        <button onClick={() => removeCustomField(field.key)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#333', padding: 0 }}>
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={formData[field.key]?.value || ''}
                      onFocus={() => setFocusedKey(field.key)}
                      onBlur={() => setFocusedKey(null)}
                      onChange={(e) => onChange(field.key, e.target.value)}
                      style={inp(active)}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Line items */}
          {allLine.length > 0 && (
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#444', letterSpacing: '0.05em' }}>
                  KALEMLER ({lineItems.length})
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={addLineCol} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Plus size={12} /> Sütun
                  </button>
                  <button onClick={addLineRow} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Plus size={12} /> Satır
                  </button>
                </div>
              </div>
              {lineItems.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr>
                        {allLine.map((f) => (
                          <th key={f.key} style={{ padding: '6px 8px', textAlign: 'left', color: '#444', fontWeight: 600, borderBottom: '1px solid #1a1a1a', whiteSpace: 'nowrap' }}>
                            {f.label}
                          </th>
                        ))}
                        <th style={{ width: 28 }} />
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((row, ri) => (
                        <tr key={ri}>
                          {allLine.map((f) => (
                            <td key={f.key} style={{ padding: '3px 4px' }}>
                              <input
                                type="text"
                                value={row[f.key]?.value || ''}
                                onChange={(e) => onLineChange(ri, f.key, e.target.value)}
                                style={{ width: '100%', background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 4, padding: '3px 6px', fontSize: 11, color: '#ccc', outline: 'none' }}
                              />
                            </td>
                          ))}
                          <td style={{ padding: '3px 4px', textAlign: 'center' }}>
                            <button onClick={() => removeLineRow(ri)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#333' }}>
                              <Trash2 size={11} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 16, color: '#333', fontSize: 11 }}>
                  Satır yok — "Satır" düğmesi ile ekleyin.
                </div>
              )}
            </div>
          )}

          {/* Raw OCR */}
          {invoice.rawOcr && (
            <details className="card" style={{ padding: 12 }}>
              <summary style={{ fontSize: 11, color: '#444', cursor: 'pointer', fontWeight: 600, letterSpacing: '0.05em' }}>
                HAM OCR METNİ
              </summary>
              <pre style={{ marginTop: 10, fontSize: 10, color: '#333', whiteSpace: 'pre-wrap', lineHeight: 1.6, maxHeight: 200, overflowY: 'auto' }}>
                {invoice.rawOcr}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};
