import React from 'react';
import { FileText, Clock, CheckSquare, Settings, Upload } from 'lucide-react';
import { ModelStatus } from '../types';

type Page = 'upload' | 'review' | 'approved' | 'settings';

interface HeaderProps {
  currentPage: Page;
  setCurrentPage: (p: Page) => void;
  pendingCount: number;
  approvedCount: number;
  modelStatus: ModelStatus | null;
}

const NAV: { id: Page; label: string; Icon: React.ElementType }[] = [
  { id: 'upload',   label: 'Yükle',      Icon: Upload },
  { id: 'review',   label: 'İncele',     Icon: Clock },
  { id: 'approved', label: 'Arşiv',      Icon: CheckSquare },
  { id: 'settings', label: 'Ayarlar',    Icon: Settings },
];

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  setCurrentPage,
  pendingCount,
  approvedCount,
  modelStatus,
}) => {
  return (
    <header
      style={{
        borderBottom: '1px solid #1f1f1f',
        background: '#0a0a0a',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px',
          height: 52,
          display: 'flex',
          alignItems: 'center',
          gap: 32,
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <FileText size={16} color="#fff" />
          <span style={{ fontWeight: 700, fontSize: 14, color: '#fff', letterSpacing: '-0.02em' }}>
            Fatrocu
          </span>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', gap: 2, flex: 1 }}>
          {NAV.map(({ id, label, Icon }) => {
            const active = currentPage === id;
            const badge = id === 'review' ? pendingCount : id === 'approved' ? approvedCount : 0;
            return (
              <button
                key={id}
                onClick={() => setCurrentPage(id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 12px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: active ? 600 : 400,
                  color: active ? '#fff' : '#666',
                  background: active ? '#1a1a1a' : 'transparent',
                  transition: 'all 0.12s',
                  position: 'relative',
                }}
              >
                <Icon size={13} />
                {label}
                {badge > 0 && (
                  <span
                    style={{
                      background: active ? '#fff' : '#333',
                      color: active ? '#000' : '#aaa',
                      borderRadius: 99,
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '1px 5px',
                      lineHeight: 1.4,
                    }}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Engine Status Dot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div
            title={modelStatus?.message ?? 'Motor durumu bilinmiyor'}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: modelStatus?.online ? '#4ade80' : '#333',
            }}
          />
          <span style={{ fontSize: 11, color: '#444' }}>
            {modelStatus?.modelName ?? 'Motor bağlantısı yok'}
          </span>
        </div>
      </div>
    </header>
  );
};
