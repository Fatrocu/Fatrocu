import React from 'react';
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import { AlertType } from '../types';

const ICONS: Record<AlertType, React.ElementType> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLORS: Record<AlertType, { bg: string; border: string; text: string }> = {
  success: { bg: '#0d1a0d', border: '#1f3a1f', text: '#6bcf7f' },
  error:   { bg: '#1a0d0d', border: '#3a1f1f', text: '#f87171' },
  warning: { bg: '#1a160d', border: '#3a2f1f', text: '#fbbf24' },
  info:    { bg: '#0d0f1a', border: '#1f233a', text: '#60a5fa' },
};

interface AlertMessageProps {
  type: AlertType;
  message: string;
  onClose: () => void;
}

export const AlertMessage: React.FC<AlertMessageProps> = ({ type, message, onClose }) => {
  const Icon = ICONS[type];
  const c = COLORS[type];

  return (
    <div
      className="fade-in"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        borderRadius: 8,
        border: `1px solid ${c.border}`,
        background: c.bg,
        color: c.text,
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      <Icon size={14} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onClose}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.text, opacity: 0.6, padding: 2 }}
      >
        <X size={13} />
      </button>
    </div>
  );
};
