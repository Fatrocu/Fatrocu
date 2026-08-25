import React from 'react';
import { AlertType } from '../types';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

interface AlertMessageProps {
  type: AlertType;
  message: string;
  onClose?: () => void;
}

export const AlertMessage: React.FC<AlertMessageProps> = ({ type, message, onClose }) => {
  const config = {
    success: {
      bg: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    },
    error: {
      bg: 'bg-red-950/80 border-red-500/40 text-red-200',
      icon: <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />,
    },
    warning: {
      bg: 'bg-amber-950/80 border-amber-500/40 text-amber-200',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    },
    info: {
      bg: 'bg-indigo-950/80 border-indigo-500/40 text-indigo-200',
      icon: <Info className="w-5 h-5 text-indigo-400 shrink-0" />,
    },
  }[type];

  return (
    <div
      className={`flex items-center justify-between gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg transition-all animate-in fade-in slide-in-from-top-2 ${config.bg}`}
      role="alert"
    >
      <div className="flex items-center gap-3">
        {config.icon}
        <span className="text-sm font-medium">{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
