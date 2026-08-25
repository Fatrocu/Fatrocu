import { InvoiceConfig } from '../types';

export const PREDEFINED_CONFIGS: InvoiceConfig[] = [
  {
    id: 'predefined-e-arsiv',
    name: 'e-Arşiv Fatura',
    isPredefined: true,
    fields: [
      { key: 'faturaNumarasi', label: 'Fatura Numarası' },
      { key: 'faturaTarihi', label: 'Fatura Tarihi' },
      { key: 'faturaTuru', label: 'Fatura Türü (Alış/Satış)' },
      { key: 'saticiVknTckn', label: 'Satıcı VKN/TCKN' },
      { key: 'saticiUnvan', label: 'Satıcı Ünvan' },
      { key: 'aliciVknTckn', label: 'Alıcı VKN/TCKN' },
      { key: 'aliciUnvan', label: 'Alıcı Ünvan' },
      { key: 'genelToplam', label: 'Genel Toplam' },
    ],
    lineItemFields: [
      { key: 'kdvOrani', label: 'KDV Oranı (%)' },
      { key: 'kdvMatrahi', label: 'KDV Matrahı' },
      { key: 'kdvTutari', label: 'KDV Tutarı' },
    ],
  },
  {
    id: 'predefined-okc',
    name: 'ÖKC/Yazar Kasa Fişi',
    isPredefined: true,
    fields: [
      { key: 'fisNo', label: 'Fiş No' },
      { key: 'fisTarihi', label: 'Fiş Tarihi' },
      { key: 'fisTuru', label: 'Fiş Türü' },
      { key: 'saticiVknTckn', label: 'Satıcı VKN/TCKN' },
      { key: 'saticiUnvan', label: 'Satıcı Ünvan' },
      { key: 'genelToplam', label: 'Genel Toplam' },
    ],
    lineItemFields: [
      { key: 'vergiOrani', label: 'Vergi Oranı (%)' },
      { key: 'vergiTutari', label: 'Vergi Tutarı' },
    ],
  },
  {
    id: 'predefined-manual',
    name: 'Manuel Veri Girişi (Yapay Zeka olmadan)',
    isPredefined: true,
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
  },
];
