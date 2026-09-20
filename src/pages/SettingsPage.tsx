import React, { useState } from 'react';
import { AppSettings, InvoiceConfig, ModelStatus, FieldConfig, GemmaVariant } from '../types';
import { Plus, Trash2, ChevronDown, Info } from 'lucide-react';

interface SettingsPageProps {
  settings: AppSettings;
  onSaveSettings: (s: AppSettings) => void;
  configs: InvoiceConfig[];
  onSaveConfigs: (c: InvoiceConfig[]) => void;
  modelStatus: ModelStatus | null;
}

const GEMMA_MODELS: { id: GemmaVariant; label: string; size: string; note?: string }[] = [
  { id: 'E2B',    label: 'Gemma 4 E2B',  size: '~1.4 GB', note: 'Hızlı, düşük VRAM' },
  { id: 'E4B',    label: 'Gemma 4 E4B',  size: '~2.8 GB', note: 'Varsayılan — önerilen' },
  { id: '12B',    label: 'Gemma 4 12B',  size: '~7.5 GB', note: 'En yüksek doğruluk' },
  { id: 'custom', label: 'Özel GGUF',    size: '—',       note: 'Kendi modelini ekle' },
];

type Section = 'models' | 'templates' | 'advanced';

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings, onSaveSettings, configs, onSaveConfigs, modelStatus,
}) => {
  const [local, setLocal] = useState<AppSettings>(settings);
  const [localConfigs, setLocalConfigs] = useState<InvoiceConfig[]>(configs);
  const [section, setSection] = useState<Section>('models');
  const [editConfigIdx, setEditConfigIdx] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof AppSettings>(k: K, v: AppSettings[K]) =>
    setLocal((p) => ({ ...p, [k]: v }));

  const save = async () => {
    await onSaveSettings(local);
    await onSaveConfigs(localConfigs);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // ── Template helpers ─────────────────────────────────────────────────────
  const addConfig = () => {
    const name = window.prompt('Şablon adı:'); if (!name) return;
    const cfg: InvoiceConfig = {
      id: `cfg_${Date.now()}`, name, isPredefined: false,
      fields: [{ key: 'faturaNumarasi', label: 'Fatura No' }],
      lineItemFields: [],
    };
    setLocalConfigs((p) => [...p, cfg]);
    setEditConfigIdx(localConfigs.length);
  };

  const deleteConfig = (idx: number) =>
    setLocalConfigs((p) => p.filter((_, i) => i !== idx));

  const updateConfig = (idx: number, patch: Partial<InvoiceConfig>) =>
    setLocalConfigs((p) => p.map((c, i) => i === idx ? { ...c, ...patch } : c));

  const addField = (configIdx: number, type: 'fields' | 'lineItemFields') => {
    const label = window.prompt('Alan adı:'); if (!label) return;
    const key = label.toLowerCase().replace(/\s+/g, '_') + Date.now().toString().slice(-4);
    const cfg = localConfigs[configIdx];
    updateConfig(configIdx, { [type]: [...(cfg[type] || []), { key, label }] });
  };

  const removeField = (configIdx: number, type: 'fields' | 'lineItemFields', fieldKey: string) => {
    const cfg = localConfigs[configIdx];
    updateConfig(configIdx, { [type]: (cfg[type] || []).filter((f: FieldConfig) => f.key !== fieldKey) });
  };

  // ── Styles ───────────────────────────────────────────────────────────────
  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
    fontSize: 12, fontWeight: active ? 600 : 400,
    background: active ? '#1a1a1a' : 'transparent',
    color: active ? '#fff' : '#555',
  });

  const label: React.CSSProperties = { fontSize: 11, color: '#444', fontWeight: 600, display: 'block', marginBottom: 5, letterSpacing: '0.04em' };
  const inp: React.CSSProperties = { width: '100%', background: '#0f0f0f', border: '1px solid #1f1f1f', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: '#ccc', outline: 'none' };
  const row: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 5 };

  return (
    <div className="fade-in" style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Ayarlar</h1>
        <button
          onClick={save}
          style={{ padding: '7px 18px', background: saved ? '#1a1a1a' : '#fff', color: saved ? '#4ade80' : '#000', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
        >
          {saved ? '✓ Kaydedildi' : 'Kaydet'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2 }}>
        {(['models', 'templates', 'advanced'] as Section[]).map((s) => (
          <button key={s} onClick={() => setSection(s)} style={tabStyle(section === s)}>
            {s === 'models' ? 'Model Yönetimi' : s === 'templates' ? 'Şablonlar' : 'Gelişmiş'}
          </button>
        ))}
      </div>

      {/* ── Model Management ─────────────────────────────────────────────── */}
      {section === 'models' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Info banner */}
          <div className="card" style={{ padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Info size={14} color="#555" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 4 }}>Pipeline: DeepSeek-OCR → Gemma 4</div>
              <div style={{ fontSize: 11, color: '#444', lineHeight: 1.6 }}>
                Görsel/PDF → DeepSeek-OCR (Markdown) → Gemma 4 (yapılandırılmış JSON çıkarma).<br />
                Tüm modeller llama.cpp GGUF formatıyla çalışır — GPU/CPU cihazlarında çalışır.
              </div>
            </div>
          </div>

          {/* OCR Model */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#444', letterSpacing: '0.05em', marginBottom: 12 }}>OCR MOTORU — DeepSeek-OCR</div>
            <div style={row}>
              <span style={label}>Model Yolu (GGUF)</span>
              <input style={inp} placeholder="Ör: models/deepseek-ocr-q4.gguf" value={local.ocrModelPath} onChange={(e) => set('ocrModelPath', e.target.value)} />
              <span style={{ fontSize: 11, color: '#333' }}>Faz 2'de model indirme sistemi entegre edilecek. Şimdilik yolu elle girin.</span>
            </div>
          </div>

          {/* Extraction Model */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#444', letterSpacing: '0.05em', marginBottom: 12 }}>ÇIKARMA ASİSTANI — Gemma 4 GGUF</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              {GEMMA_MODELS.map(({ id, label: l, size, note }) => {
                const active = local.extractionModelId === id;
                return (
                  <button
                    key={id}
                    onClick={() => set('extractionModelId', id)}
                    style={{
                      padding: '10px 12px', borderRadius: 7, border: `1px solid ${active ? '#555' : '#1a1a1a'}`,
                      background: active ? '#1a1a1a' : '#0d0d0d', cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.12s',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? '#fff' : '#666' }}>{l}</div>
                    <div style={{ fontSize: 10, color: '#444', marginTop: 2 }}>{size} · {note}</div>
                    {id === 'E4B' && <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>● Varsayılan</div>}
                  </button>
                );
              })}
            </div>
            {local.extractionModelId === 'custom' && (
              <div style={row}>
                <span style={label}>Özel Model Yolu</span>
                <input style={inp} placeholder="Ör: models/custom-model-q4.gguf" value={local.extractionModelPath} onChange={(e) => set('extractionModelPath', e.target.value)} />
              </div>
            )}
          </div>

          {/* GPU layers */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#444', letterSpacing: '0.05em', marginBottom: 12 }}>DONANIM</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={row}>
                <span style={label}>OCR GPU Katmanları (0 = CPU)</span>
                <input type="number" min={0} max={100} style={inp} value={local.ocrGpuLayers} onChange={(e) => set('ocrGpuLayers', Number(e.target.value))} />
              </div>
              <div style={row}>
                <span style={label}>Çıkarma GPU Katmanları</span>
                <input type="number" min={0} max={100} style={inp} value={local.extractionGpuLayers} onChange={(e) => set('extractionGpuLayers', Number(e.target.value))} />
              </div>
              <div style={row}>
                <span style={label}>OCR Thread Sayısı</span>
                <input type="number" min={1} max={32} style={inp} value={local.ocrThreads} onChange={(e) => set('ocrThreads', Number(e.target.value))} />
              </div>
              <div style={row}>
                <span style={label}>Çıkarma Thread Sayısı</span>
                <input type="number" min={1} max={32} style={inp} value={local.extractionThreads} onChange={(e) => set('extractionThreads', Number(e.target.value))} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Templates ────────────────────────────────────────────────────── */}
      {section === 'templates' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={addConfig}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#1a1a1a', border: '1px solid #222', borderRadius: 6, fontSize: 12, color: '#888', cursor: 'pointer' }}
            >
              <Plus size={12} /> Yeni Şablon
            </button>
          </div>
          {localConfigs.map((cfg, ci) => (
            <div key={cfg.id} className="card" style={{ overflow: 'hidden' }}>
              {/* Config header */}
              <div
                style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', cursor: 'pointer', gap: 10 }}
                onClick={() => setEditConfigIdx(editConfigIdx === ci ? null : ci)}
              >
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#ccc' }}>{cfg.name}</span>
                <span style={{ fontSize: 11, color: '#444' }}>{cfg.fields.length} alan</span>
                {cfg.isPredefined && <span style={{ fontSize: 10, color: '#333', background: '#1a1a1a', padding: '2px 6px', borderRadius: 4 }}>Varsayılan</span>}
                {!cfg.isPredefined && (
                  <button onClick={(e) => { e.stopPropagation(); deleteConfig(ci); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#333' }}>
                    <Trash2 size={13} />
                  </button>
                )}
                <ChevronDown size={13} color="#444" style={{ transform: editConfigIdx === ci ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </div>

              {/* Config editor */}
              {editConfigIdx === ci && (
                <div style={{ padding: '0 14px 14px', borderTop: '1px solid #1a1a1a' }}>
                  <div style={{ marginTop: 12, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: '#444', fontWeight: 600, letterSpacing: '0.05em' }}>ALANLAR</span>
                    <button onClick={() => addField(ci, 'fields')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Plus size={11} /> Ekle
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {cfg.fields.map((f) => (
                      <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', background: '#0d0d0d', borderRadius: 5 }}>
                        <span style={{ flex: 1, fontSize: 12, color: '#666' }}>{f.label}</span>
                        <span style={{ fontSize: 11, color: '#333', fontFamily: 'monospace' }}>{f.key}</span>
                        {!cfg.isPredefined && (
                          <button onClick={() => removeField(ci, 'fields', f.key)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#333' }}>
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Line item fields */}
                  <div style={{ marginTop: 12, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: '#444', fontWeight: 600, letterSpacing: '0.05em' }}>KALEM SÜTUNLARI</span>
                    <button onClick={() => addField(ci, 'lineItemFields')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Plus size={11} /> Ekle
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {(cfg.lineItemFields || []).map((f) => (
                      <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', background: '#0d0d0d', borderRadius: 5 }}>
                        <span style={{ flex: 1, fontSize: 12, color: '#666' }}>{f.label}</span>
                        <span style={{ fontSize: 11, color: '#333', fontFamily: 'monospace' }}>{f.key}</span>
                        {!cfg.isPredefined && (
                          <button onClick={() => removeField(ci, 'lineItemFields', f.key)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#333' }}>
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    ))}
                    {(cfg.lineItemFields || []).length === 0 && (
                      <div style={{ fontSize: 11, color: '#333', padding: '6px 8px' }}>Kalem sütunu yok.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Advanced ──────────────────────────────────────────────────────── */}
      {section === 'advanced' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={row}>
              <span style={label}>Varsayılan Dışa Aktarma Formatı</span>
              <div style={{ position: 'relative' }}>
                <select
                  value={local.defaultExportFormat}
                  onChange={(e) => set('defaultExportFormat', e.target.value as 'xlsx' | 'csv')}
                  style={{ ...inp, appearance: 'none', paddingRight: 28 }}
                >
                  <option value="xlsx">Excel (.xlsx)</option>
                  <option value="csv">CSV (.csv)</option>
                </select>
                <ChevronDown size={13} color="#555" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>İşlenen dosyaları kaydet</div>
                <div style={{ fontSize: 11, color: '#444' }}>Fatura görselleri ve veriler %APPDATA%\Fatrocu altına kaydedilir.</div>
              </div>
              <button
                onClick={() => set('saveProcessedFiles', !local.saveProcessedFiles)}
                style={{
                  width: 36, height: 20, borderRadius: 99, border: 'none', cursor: 'pointer',
                  background: local.saveProcessedFiles ? '#fff' : '#1a1a1a',
                  position: 'relative', flexShrink: 0,
                }}
              >
                <div style={{
                  position: 'absolute', top: 2, width: 16, height: 16, borderRadius: '50%',
                  background: local.saveProcessedFiles ? '#000' : '#444',
                  left: local.saveProcessedFiles ? 18 : 2,
                  transition: 'left 0.15s',
                }} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
