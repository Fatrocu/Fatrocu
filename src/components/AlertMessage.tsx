import React from 'react';
import { X, CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';
import { AlertType } from '../types';

const ICONS: Record<AlertType, React.ElementType> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

interface AlertMessageProps {
  type: AlertType;
  message: string;
  onClose: () => void;
}

export const AlertMessage: React.FC<AlertMessageProps> = ({ type, message, onClose }) => {
  const Icon = ICONS[type];

  return (
    <div className="fade-in scribble-card p-4 bg-white flex items-center justify-between gap-4 border-[2.5px] border-black shadow-[4px_4px_0px_#000]">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg border-2 border-black flex items-center justify-center bg-black text-white shrink-0 shadow-[1.5px_1.5px_0px_#000]">
          <Icon size={18} className="stroke-[2.5]" />
        </div>
        <span className="font-heading font-bold text-sm text-black">
          {message}
        </span>
      </div>
      <button
        onClick={onClose}
        className="w-8 h-8 rounded-lg border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors shrink-0 shadow-[1.5px_1.5px_0px_#000]"
      >
        <X size={16} className="stroke-[3]" />
      </button>
    </div>
  );
};
