import React, { useState, useRef } from 'react';
import { AppSettings, InvoiceConfig, ModelStatus, FieldConfig, GemmaVariant } from '../types';
import { Plus, Trash2, ChevronDown, Info, Cpu, HardDrive, Sliders, CheckCircle2, Bookmark, UploadCloud, FolderOpen, Download, RefreshCw, Zap } from 'lucide-react';
import { tauriService } from '../services/tauriService';

interface SettingsPageProps {
  settings: AppSettings;
  onSaveSettings: (s: AppSettings) => void;
  configs: InvoiceConfig[];
  onSaveConfigs: (c: InvoiceConfig[]) => void;
  modelStatus: ModelStatus | null;
}

const GEMMA_MODELS: { id: GemmaVariant; label: string; size: string; note: string; badge?: string }[] = [
  { id: 'E4B', label: 'Gemma 4 E4B', size: '~2.8 GB GGUF', note: 'Varsayılan & Önerilen model. Hızlı ve dengeli.', badge: 'ÖNERİLEN' },
  { id: 'E2B', label: 'Gemma 4 E2B', size: '~1.4 GB GGUF', note: 'Ultra hafif, düşük RAM/VRAM cihazlar için ideal.' },
  { id: '12B', label: 'Gemma 4 12B', size: '~7.5 GB GGUF', note: 'Karmaşık çok sayfalı tablolar ve en yüksek doğruluk.' },
  { id: 'custom', label: 'Özel GGUF Model İçe Aktar', size: 'Kullanıcı seçimi', note: 'Kendi yerel GGUF model dosyanızı ekleyin.' },
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
  const [isInstallingEngine, setIsInstallingEngine] = useState(false);
  const [installMessage, setInstallMessage] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [isDraggingModel, setIsDraggingModel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAutoInstallEngine = async () => {
    setIsInstallingEngine(true);
    setInstallMessage('llama.cpp motoru GitHub üzerinden indiriliyor ve kuruluyor...');
    try {
      const msg = await tauriService.autoInstallLlamaEngine();
      setInstallMessage(`✓ ${msg}`);
    } catch (err) {
      setInstallMessage(`Hata: ${err}`);
    } finally {
      setIsInstallingEngine(false);
    }
  };

  const handleImportModelPath = async (filePath: string) => {
    try {
      const res = await tauriService.importModelFile(filePath);
      setImportMessage(`✓ ${res}`);
      // Güncel ayarları tekrar çek
      const updated = await tauriService.getAppSettings();
      if (updated) {
        setLocal(updated);
        onSaveSettings(updated);
      }
    } catch (err) {
      setImportMessage(`Hata: ${err}`);
    }
  };

  const set = <K extends keyof AppSettings>(k: K, v: AppSettings[K]) =>
    setLocal((p) => ({ ...p, [k]: v }));

  const save = async () => {
    await onSaveSettings(local);
    await onSaveConfigs(localConfigs);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addConfig = () => {
    const name = window.prompt('Yeni Şablon Adı:'); if (!name) return;
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
    const label = window.prompt('Alan Adı:'); if (!label) return;
    const key = label.toLowerCase().replace(/\s+/g, '_') + Date.now().toString().slice(-4);
    const cfg = localConfigs[configIdx];
    updateConfig(configIdx, { [type]: [...(cfg[type] || []), { key, label }] });
  };

  const removeField = (configIdx: number, type: 'fields' | 'lineItemFields', fieldKey: string) => {
    const cfg = localConfigs[configIdx];
    updateConfig(configIdx, { [type]: (cfg[type] || []).filter((f: FieldConfig) => f.key !== fieldKey) });
  };

  return (
    <div className="fade-in max-w-5xl mx-auto flex flex-col gap-8 pb-16">
      
      {/* Top Banner */}
      <div className="scribble-card p-6 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h1 className="font-heading font-black text-2xl text-black">
            Uygulama ve Model Ayarları
          </h1>
          <p className="font-scribble text-sm text-neutral-600 font-semibold mt-1">
            llama.cpp motoru, DeepSeek-OCR, Gemma 4 ve özel fatura şablonlarınızı yönetin.
          </p>
        </div>

        <button
          onClick={save}
          className={`scribble-btn px-6 py-3 text-sm flex items-center gap-2 ${
            saved ? 'bg-black text-white' : 'scribble-btn-primary'
          }`}
        >
          <CheckCircle2 size={18} className="stroke-[3]" />
          <span>{saved ? 'Kaydedildi!' : 'Değişiklikleri Kaydet'}</span>
        </button>
      </div>

      {/* Nav Tabs */}
      <div className="flex items-center gap-3">
        {(['models', 'templates', 'advanced'] as Section[]).map((s) => {
          const active = section === s;
          const label = s === 'models' ? '1. Model Yönetimi (Gemma / OCR)' : s === 'templates' ? '2. Fatura Şablonları' : '3. Donanım & Çıktı';
          return (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={`px-5 py-2.5 rounded-xl border-2 border-black font-heading font-bold text-xs uppercase tracking-wider transition-all ${
                active
                  ? 'bg-black text-white shadow-[3px_3px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
                  : 'bg-white text-black hover:bg-neutral-100 shadow-[2px_2px_0px_#000]'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* SECTION: Models */}
      {section === 'models' && (
        <div className="space-y-6">
          
          {/* Quick Automation Hub: Engine & Model Importer */}
          <div className="scribble-card p-6 bg-white border-2 border-black space-y-5 shadow-[5px_5px_0px_#000]">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black">
              <div className="flex items-center gap-2">
                <Zap size={22} className="text-black stroke-[3]" />
                <h3 className="font-heading font-black text-lg text-black uppercase tracking-wider">
                  Otomatik Kurulum &amp; Model Sürükle-Bırak
                </h3>
              </div>
              <button
                onClick={() => tauriService.openModelsFolder()}
                className="scribble-btn scribble-btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-[1.5px_1.5px_0px_#000]"
                title="AppData altındaki models klasörünü aç"
              >
                <FolderOpen size={14} className="stroke-[2.5]" />
                <span>Modeller Klasörünü Aç</span>
              </button>
            </div>

            {/* Quick Engine installer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border-2 border-black bg-neutral-50 shadow-[2px_2px_0px_#000]">
              <div className="space-y-0.5">
                <span className="font-heading font-black text-sm text-black block">
                  1. llama.cpp Motorunu Otomatik Kur
                </span>
                <span className="font-scribble text-xs text-neutral-600 font-bold block">
                  Gereken llama-cli.exe ve DLL dosyalarını tek tıkla indirip ayarlar.
                </span>
                {installMessage && (
                  <span className="font-heading font-bold text-xs text-black block mt-1">
                    {installMessage}
                  </span>
                )}
              </div>

              <button
                onClick={handleAutoInstallEngine}
                disabled={isInstallingEngine}
                className={`scribble-btn px-4 py-2 text-xs flex items-center gap-2 shrink-0 ${
                  isInstallingEngine ? 'opacity-50 cursor-not-allowed' : 'scribble-btn-primary'
                }`}
              >
                {isInstallingEngine ? (
                  <RefreshCw size={14} className="animate-spin stroke-[2.5]" />
                ) : (
                  <Download size={14} className="stroke-[2.5]" />
                )}
                <span>{isInstallingEngine ? 'Kuruluyor...' : 'Motoru Tek Tıkla Kur'}</span>
              </button>
            </div>

            {/* Drag & Drop GGUF Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDraggingModel(true); }}
              onDragLeave={() => setIsDraggingModel(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingModel(false);
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                  // Tauri'de sürüklenen dosyanın absolute path'i alınır
                  const filePath = (files[0] as any).path || files[0].name;
                  handleImportModelPath(filePath);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-[2.5px] border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDraggingModel
                  ? 'border-black bg-neutral-100 shadow-[4px_4px_0px_#000]'
                  : 'border-black/60 bg-white hover:border-black shadow-[2px_2px_0px_#000]'
              }`}
            >
              <UploadCloud size={32} className="mx-auto text-black stroke-[2] mb-1.5" />
              <h4 className="font-heading font-black text-sm text-black">
                GGUF Model Dosyasını (.gguf) Buraya Sürükleyip Bırakın
              </h4>
              <p className="font-scribble text-xs text-neutral-600 font-bold mt-0.5">
                DeepSeek-OCR veya Gemma 4 GGUF dosyanızı bıraktığınızda otomatik tanınıp klasöre kopyalanır.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".gguf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const path = (e.target.files[0] as any).path;
                    if (path) handleImportModelPath(path);
                  }
                }}
              />
            </div>

            {importMessage && (
              <div className="p-3 bg-neutral-100 border-2 border-black rounded-lg font-heading font-bold text-xs text-black">
                {importMessage}
              </div>
            )}
          </div>

          {/* Architecture notice card */}
          <div className="scribble-card p-5 bg-white border-2 border-black flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl border-2 border-black bg-neutral-100 flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#000]">
              <Info size={20} className="text-black stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <span className="font-heading font-black text-sm text-black block">
                İki Aşamalı Saf llama.cpp Pipeline (NVIDIA Bağımsız)
              </span>
              <p className="font-scribble text-xs text-neutral-600 font-semibold leading-relaxed">
                1. <strong>DeepSeek-OCR GGUF:</strong> Görsel/PDF dosyasını tabloları ve konumları koruyarak ham markdown'a dönüştürür.<br />
                2. <strong>Gemma 4 GGUF:</strong> Markdown metnini okuyarak fatura no, tarih, VKN, KDV ve tutar alanlarını JSON olarak ayıklar.
              </p>
            </div>
          </div>

          {/* DeepSeek OCR Path */}
          <div className="scribble-card p-6 bg-white space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-black">
              <HardDrive size={20} className="text-black stroke-[2.5]" />
              <h3 className="font-heading font-black text-base text-black uppercase tracking-wider">
                Adım 1: DeepSeek-OCR (GGUF) Motoru
              </h3>
            </div>

            <div className="space-y-2">
              <label className="font-heading font-bold text-xs text-neutral-700 block">
                Model Dosyası Yolu veya HuggingFace Repo
              </label>
              <input
                type="text"
                placeholder="Örnek: models/DeepSeek-OCR-GGUF/deepseek-ocr.gguf"
                value={local.ocrModelPath}
                onChange={(e) => set('ocrModelPath', e.target.value)}
                className="w-full font-heading font-bold text-sm"
              />
              <span className="font-scribble text-xs text-neutral-500 font-bold block">
                * NexaAI/DeepSeek-OCR-GGUF formatındaki model dosyası.
              </span>
            </div>
          </div>

          {/* Gemma 4 Assistant Selection */}
          <div className="scribble-card p-6 bg-white space-y-4">
            <div className="flex items-center justify-between pb-2 border-b-2 border-black">
              <div className="flex items-center gap-2">
                <Cpu size={20} className="text-black stroke-[2.5]" />
                <h3 className="font-heading font-black text-base text-black uppercase tracking-wider">
                  Adım 2: Gemma 4 Alan Çıkarma Asistanı
                </h3>
              </div>
              <span className="scribble-tag text-xs font-scribble bg-black text-white px-2 py-0.5 rounded">
                SADECE ALAN ÇIKARMA GÖREVİNDE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {GEMMA_MODELS.map(({ id, label: l, size, note, badge }) => {
                const active = local.extractionModelId === id;
                return (
                  <div
                    key={id}
                    onClick={() => set('extractionModelId', id)}
                    className={`p-4 rounded-xl border-[2.5px] cursor-pointer transition-all bg-white flex flex-col justify-between ${
                      active
                        ? 'border-black shadow-[4px_4px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
                        : 'border-black/60 shadow-[2px_2px_0px_#000] hover:border-black'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-heading font-extrabold text-base text-black">
                          {l}
                        </span>
                        {badge && (
                          <span className="scribble-badge bg-black text-white text-[10px] font-scribble px-2 py-0.5">
                            {badge}
                          </span>
                        )}
                      </div>
                      <span className="font-scribble text-xs font-bold text-neutral-500 block">
                        Boyut: {size}
                      </span>
                      <p className="font-scribble text-xs text-neutral-700 font-semibold pt-1">
                        {note}
                      </p>
                    </div>

                    <div className="mt-4 pt-2 border-t border-black/10 flex items-center justify-between">
                      <span className="text-[11px] font-heading font-extrabold text-neutral-500">
                        {active ? '● Seçili Model' : 'Seçmek için tıkla'}
                      </span>
                      <div className={`w-4 h-4 rounded-full border-2 border-black flex items-center justify-center ${active ? 'bg-black' : 'bg-white'}`}>
                        {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {local.extractionModelId === 'custom' && (
              <div className="mt-4 p-4 border-2 border-black rounded-xl bg-neutral-50 space-y-2">
                <label className="font-heading font-bold text-xs text-black block">
                  Özel GGUF Model Dosya Yolu:
                </label>
                <input
                  type="text"
                  placeholder="C:/Modellerim/benim-modelim-q4_k_m.gguf"
                  value={local.extractionModelPath}
                  onChange={(e) => set('extractionModelPath', e.target.value)}
                  className="w-full font-heading font-bold text-sm bg-white"
                />
              </div>
            )}
          </div>

        </div>
      )}

      {/* SECTION: Templates */}
      {section === 'templates' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={addConfig}
              className="scribble-btn scribble-btn-primary text-xs px-4 py-2 shadow-[2px_2px_0px_#000] flex items-center gap-1.5"
            >
              <Plus size={16} className="stroke-[3]" />
              <span>Yeni Şablon Oluştur</span>
            </button>
          </div>

          <div className="space-y-4">
            {localConfigs.map((cfg, ci) => (
              <div key={cfg.id} className="scribble-card bg-white overflow-hidden">
                <div
                  onClick={() => setEditConfigIdx(editConfigIdx === ci ? null : ci)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-neutral-50 transition-colors select-none"
                >
                  <div className="flex items-center gap-3">
                    <Bookmark size={20} className="text-black stroke-[2.5]" />
                    <div>
                      <span className="font-heading font-black text-base text-black block">
                        {cfg.name}
                      </span>
                      <span className="font-scribble text-xs text-neutral-500 font-bold block">
                        {cfg.fields.length} temel alan, {(cfg.lineItemFields || []).length} kalem sütunu
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {cfg.isPredefined ? (
                      <span className="scribble-badge bg-neutral-100 text-black text-[11px] font-heading font-bold">
                        Varsayılan Şablon
                      </span>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteConfig(ci); }}
                        className="w-8 h-8 rounded-lg border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors"
                        title="Şablonu Sil"
                      >
                        <Trash2 size={14} className="stroke-[2.5]" />
                      </button>
                    )}
                    <ChevronDown
                      size={20}
                      className={`text-black stroke-[3] transition-transform ${editConfigIdx === ci ? 'rotate-180' : ''}`}
                    />
                  </div>
                </div>

                {/* Sub Editor */}
                {editConfigIdx === ci && (
                  <div className="p-6 border-t-2 border-black bg-neutral-50 space-y-6">
                    {/* Fields */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-heading font-black text-xs text-black uppercase tracking-wider">
                          Belge Alanları
                        </span>
                        <button
                          onClick={() => addField(ci, 'fields')}
                          className="scribble-btn scribble-btn-secondary text-xs py-1 px-3 shadow-[1.5px_1.5px_0px_#000]"
                        >
                          <Plus size={12} className="stroke-[3]" />
                          <span>Alan Ekle</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {cfg.fields.map((f) => (
                          <div
                            key={f.key}
                            className="p-3 rounded-lg border-2 border-black bg-white flex items-center justify-between shadow-[2px_2px_0px_#000]"
                          >
                            <div className="truncate mr-2">
                              <span className="font-heading font-bold text-xs text-black block truncate">
                                {f.label}
                              </span>
                              <span className="font-mono text-[10px] text-neutral-400 block truncate">
                                {f.key}
                              </span>
                            </div>
                            {!cfg.isPredefined && (
                              <button
                                onClick={() => removeField(ci, 'fields', f.key)}
                                className="text-neutral-400 hover:text-black shrink-0"
                              >
                                <Trash2 size={13} className="stroke-[2.5]" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Line Item Columns */}
                    <div className="space-y-3 pt-4 border-t border-black/20">
                      <div className="flex items-center justify-between">
                        <span className="font-heading font-black text-xs text-black uppercase tracking-wider">
                          Kalem Tablosu Sütunları
                        </span>
                        <button
                          onClick={() => addField(ci, 'lineItemFields')}
                          className="scribble-btn scribble-btn-secondary text-xs py-1 px-3 shadow-[1.5px_1.5px_0px_#000]"
                        >
                          <Plus size={12} className="stroke-[3]" />
                          <span>Sütun Ekle</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {(cfg.lineItemFields || []).map((f) => (
                          <div
                            key={f.key}
                            className="p-3 rounded-lg border-2 border-black bg-white flex items-center justify-between shadow-[2px_2px_0px_#000]"
                          >
                            <div className="truncate mr-2">
                              <span className="font-heading font-bold text-xs text-black block truncate">
                                {f.label}
                              </span>
                              <span className="font-mono text-[10px] text-neutral-400 block truncate">
                                {f.key}
                              </span>
                            </div>
                            {!cfg.isPredefined && (
                              <button
                                onClick={() => removeField(ci, 'lineItemFields', f.key)}
                                className="text-neutral-400 hover:text-black shrink-0"
                              >
                                <Trash2 size={13} className="stroke-[2.5]" />
                              </button>
                            )}
                          </div>
                        ))}
                        {(cfg.lineItemFields || []).length === 0 && (
                          <div className="font-scribble text-xs text-neutral-400 font-bold p-2">
                            Kalem sütunu tanımlanmamış.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION: Advanced / Hardware */}
      {section === 'advanced' && (
        <div className="space-y-6">
          
          <div className="scribble-card p-6 bg-white space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-black">
              <Sliders size={20} className="text-black stroke-[2.5]" />
              <h3 className="font-heading font-black text-base text-black uppercase tracking-wider">
                Donanım &amp; llama.cpp Performans Ayarları
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="font-heading font-bold text-xs text-black block">
                  DeepSeek-OCR GPU Katman Sayısı
                </label>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={local.ocrGpuLayers}
                  onChange={(e) => set('ocrGpuLayers', Number(e.target.value))}
                  className="w-full font-heading font-bold text-sm"
                />
                <span className="font-scribble text-xs text-neutral-500 font-bold block">
                  0 = Tamamen CPU modu (GPU gerektirmez)
                </span>
              </div>

              <div className="space-y-2">
                <label className="font-heading font-bold text-xs text-black block">
                  Gemma 4 GPU Katman Sayısı
                </label>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={local.extractionGpuLayers}
                  onChange={(e) => set('extractionGpuLayers', Number(e.target.value))}
                  className="w-full font-heading font-bold text-sm"
                />
                <span className="font-scribble text-xs text-neutral-500 font-bold block">
                  0 = Saf CPU çıkarımı
                </span>
              </div>

              <div className="space-y-2">
                <label className="font-heading font-bold text-xs text-black block">
                  OCR CPU Thread Sayısı
                </label>
                <input
                  type="number"
                  min={1}
                  max={32}
                  value={local.ocrThreads}
                  onChange={(e) => set('ocrThreads', Number(e.target.value))}
                  className="w-full font-heading font-bold text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="font-heading font-bold text-xs text-black block">
                  Çıkarma CPU Thread Sayısı
                </label>
                <input
                  type="number"
                  min={1}
                  max={32}
                  value={local.extractionThreads}
                  onChange={(e) => set('extractionThreads', Number(e.target.value))}
                  className="w-full font-heading font-bold text-sm"
                />
              </div>
            </div>
          </div>

          <div className="scribble-card p-6 bg-white space-y-4">
            <h3 className="font-heading font-black text-base text-black uppercase tracking-wider pb-2 border-b-2 border-black">
              Dışa Aktarma Tercihleri
            </h3>

            <div className="space-y-2 max-w-sm">
              <label className="font-heading font-bold text-xs text-black block">
                Varsayılan Rapor Formatı
              </label>
              <div className="relative">
                <select
                  value={local.defaultExportFormat}
                  onChange={(e) => set('defaultExportFormat', e.target.value as 'xlsx' | 'csv')}
                  className="w-full font-heading font-bold text-sm appearance-none pr-10"
                >
                  <option value="xlsx">Excel Tablosu (.xlsx)</option>
                  <option value="csv">CSV Metin Dosyası (.csv)</option>
                </select>
                <ChevronDown
                  size={18}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-black stroke-[3]"
                />
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
