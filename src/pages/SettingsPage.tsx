import React, { useState } from 'react';
import { AppSettings, InvoiceConfig, FieldConfig, ModelStatus } from '../types';
import {
  Settings,
  Cpu,
  Plus,
  Trash2,
  Edit2,
  Check,
  RefreshCw,
  Server,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { PREDEFINED_CONFIGS } from '../services/configService';

interface SettingsPageProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  configs: InvoiceConfig[];
  onSaveConfigs: (configs: InvoiceConfig[]) => void;
  modelStatus: ModelStatus | null;
  onRefreshModel: () => void;
  onStartServer: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onSaveSettings,
  configs,
  onSaveConfigs,
  modelStatus,
  onRefreshModel,
  onStartServer,
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [editingConfig, setEditingConfig] = useState<InvoiceConfig | null>(null);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(localSettings);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  const handleCreateNewTemplate = () => {
    const newConfig: InvoiceConfig = {
      id: `custom-${Date.now()}`,
      name: 'Yeni Fatura Şablonu',
      isPredefined: false,
      fields: [
        { key: 'faturaNumarasi', label: 'Fatura Numarası' },
        { key: 'faturaTarihi', label: 'Fatura Tarihi' },
        { key: 'saticiUnvan', label: 'Satıcı Ünvan' },
        { key: 'genelToplam', label: 'Genel Toplam' },
      ],
      lineItemFields: [
        { key: 'kdvOrani', label: 'KDV Oranı (%)' },
        { key: 'kdvTutari', label: 'KDV Tutarı' },
      ],
    };
    setEditingConfig(newConfig);
  };

  const handleSaveTemplate = (saved: InvoiceConfig) => {
    const idx = configs.findIndex((c) => c.id === saved.id);
    let next: InvoiceConfig[];
    if (idx >= 0) {
      next = [...configs];
      next[idx] = saved;
    } else {
      next = [...configs, saved];
    }
    onSaveConfigs(next);
    setEditingConfig(null);
  };

  const handleDeleteTemplate = (id: string) => {
    if (window.confirm('Bu şablonu silmek istediğinize emin misiniz?')) {
      const next = configs.filter((c) => c.id !== id);
      onSaveConfigs(next);
    }
  };

  const handleResetDefaultConfigs = () => {
    if (window.confirm('Tüm varsayılan şablonları geri yüklemek istiyor musiniz?')) {
      const customOnes = configs.filter((c) => !c.isPredefined);
      onSaveConfigs([...PREDEFINED_CONFIGS, ...customOnes]);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Settings Top Banner */}
      <div className="bg-slate-800/90 p-6 rounded-3xl border border-slate-700 shadow-xl">
        <h2 className="text-2xl font-black text-white flex items-center gap-2">
          <Settings className="w-7 h-7 text-indigo-400" />
          <span>Ayarlar &amp; Yapılandırma</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          NaviDC-OCR yapay zeka model bağlantısını ve fatura alan şablonlarını yönetin.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: NaviDC-OCR Engine Settings */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-6 shadow-md">
            <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span>NaviDC-OCR Motor Ayarları</span>
            </h3>

            {/* Model Status Card */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/80 mb-5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Sunucu Durumu</span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    modelStatus?.online
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {modelStatus?.online ? 'Çevrimiçi / Bağlı' : 'Çevrimdışı'}
                </span>
              </div>

              <div className="text-xs space-y-1 font-mono text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Model:</span>
                  <span>{modelStatus?.modelName || localSettings.modelPath}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cihaz:</span>
                  <span>{modelStatus?.device || localSettings.device.toUpperCase()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onRefreshModel}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition-colors border border-slate-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Bağlantıyı Test Et</span>
                </button>

                <button
                  type="button"
                  onClick={onStartServer}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-lg transition-colors shadow-md"
                  title="Yerel motor sunucusunu başlat"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Sunucuyu Başlat</span>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Sunucu URL (REST API)
                </label>
                <input
                  type="text"
                  value={localSettings.navidcUrl}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, navidcUrl: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  placeholder="http://127.0.0.1:8765"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Model Adı / Yolu
                </label>
                <input
                  type="text"
                  value={localSettings.modelPath}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, modelPath: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  placeholder="StarDoc-AI/NaviDC-OCR"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Çalıştırma Donanımı
                </label>
                <select
                  value={localSettings.device}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, device: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="cuda">NVIDIA GPU (CUDA - Hızlı)</option>
                  <option value="cpu">CPU (İşlemci)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="autoStart"
                  checked={localSettings.autoStartSidecar}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      autoStartSidecar: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
                />
                <label htmlFor="autoStart" className="text-slate-300 font-medium cursor-pointer">
                  Uygulama açılışında NaviDC motorunu otomatik başlat
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 mt-2"
              >
                {settingsSaved ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Kaydedildi!</span>
                  </>
                ) : (
                  <span>Ayarları Kaydet</span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Template Management */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-6 shadow-md">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-700">
              <div>
                <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider">
                  Fatura Alan Şablonları ({configs.length})
                </h3>
                <p className="text-xs text-slate-400">
                  Farklı fatura veya fiş türleri için çıkarılacak alanları özelleştirin.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetDefaultConfigs}
                  className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition-colors text-xs flex items-center gap-1"
                  title="Varsayılanları Geri Yükle"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleCreateNewTemplate}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Yeni Şablon</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {configs.map((config) => (
                <div
                  key={config.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-700/70 hover:border-slate-600 transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-100">{config.name}</h4>
                      {config.isPredefined && (
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          Ön Tanımlı
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {config.fields.length} Ana Alan &bull;{' '}
                      {config.lineItemFields?.length || 0} Satır Kalemi
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingConfig(config)}
                      className="p-2 hover:bg-slate-800 text-slate-300 hover:text-indigo-300 rounded-lg transition-colors"
                      title="Şablonu Düzenle"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {!config.isPredefined && (
                      <button
                        onClick={() => handleDeleteTemplate(config.id)}
                        className="p-2 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                        title="Şablonu Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Template Edit Modal */}
      {editingConfig && (
        <TemplateEditorModal
          config={editingConfig}
          onSave={handleSaveTemplate}
          onCancel={() => setEditingConfig(null)}
        />
      )}
    </div>
  );
};

// Modal for editing templates
const TemplateEditorModal: React.FC<{
  config: InvoiceConfig;
  onSave: (config: InvoiceConfig) => void;
  onCancel: () => void;
}> = ({ config, onSave, onCancel }) => {
  const [edited, setEdited] = useState<InvoiceConfig>({ ...config });

  const addField = (type: 'fields' | 'lineItemFields') => {
    const key = `yeniAlan_${Date.now().toString().slice(-4)}`;
    const label = 'Yeni Alan';
    const current = edited[type] || [];
    setEdited({ ...edited, [type]: [...current, { key, label }] });
  };

  const removeField = (type: 'fields' | 'lineItemFields', index: number) => {
    const current = [...(edited[type] || [])];
    current.splice(index, 1);
    setEdited({ ...edited, [type]: current });
  };

  const updateField = (
    type: 'fields' | 'lineItemFields',
    index: number,
    field: Partial<FieldConfig>
  ) => {
    const current = [...(edited[type] || [])];
    current[index] = { ...current[index], ...field };
    setEdited({ ...edited, [type]: current });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center pb-3 border-b border-slate-700">
          <h3 className="text-lg font-bold text-white">
            {edited.isPredefined ? 'Şablon Detayları' : 'Şablonu Düzenle'}
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Şablon Adı
            </label>
            <input
              type="text"
              value={edited.name}
              disabled={edited.isPredefined}
              onChange={(e) => setEdited({ ...edited, name: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 disabled:opacity-60 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Main Fields */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Ana Alanlar ({edited.fields.length})
              </h4>
              {!edited.isPredefined && (
                <button
                  type="button"
                  onClick={() => addField('fields')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
                >
                  + Alan Ekle
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {edited.fields.map((f, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-700/60"
                >
                  <input
                    type="text"
                    value={f.label}
                    placeholder="Etiket (örn: Fatura No)"
                    disabled={edited.isPredefined}
                    onChange={(e) => updateField('fields', idx, { label: e.target.value })}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-100"
                  />
                  <input
                    type="text"
                    value={f.key}
                    placeholder="Anahtar (örn: faturaNo)"
                    disabled={edited.isPredefined}
                    onChange={(e) => updateField('fields', idx, { key: e.target.value })}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-400 font-mono"
                  />
                  {!edited.isPredefined && (
                    <button
                      type="button"
                      onClick={() => removeField('fields', idx)}
                      className="p-1 text-slate-500 hover:text-red-400 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Line Item Fields */}
          <div className="space-y-3 pt-4 border-t border-slate-700">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Satır Kalemi Sütunları ({edited.lineItemFields?.length || 0})
              </h4>
              {!edited.isPredefined && (
                <button
                  type="button"
                  onClick={() => addField('lineItemFields')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
                >
                  + Sütun Ekle
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {(edited.lineItemFields || []).map((f, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-700/60"
                >
                  <input
                    type="text"
                    value={f.label}
                    placeholder="Sütun Etiketi (örn: KDV Oranı)"
                    disabled={edited.isPredefined}
                    onChange={(e) => updateField('lineItemFields', idx, { label: e.target.value })}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-100"
                  />
                  <input
                    type="text"
                    value={f.key}
                    placeholder="Anahtar (örn: kdvOrani)"
                    disabled={edited.isPredefined}
                    onChange={(e) => updateField('lineItemFields', idx, { key: e.target.value })}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-400 font-mono"
                  />
                  {!edited.isPredefined && (
                    <button
                      type="button"
                      onClick={() => removeField('lineItemFields', idx)}
                      className="p-1 text-slate-500 hover:text-red-400 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs rounded-xl transition-colors"
          >
            Kapat
          </button>
          {!edited.isPredefined && (
            <button
              type="button"
              onClick={() => onSave(edited)}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              Kaydet
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
