import React from 'react';
import { ModelStatus } from '../types';
import { Cpu, RefreshCw, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ModelStatusBadgeProps {
  status: ModelStatus | null;
  onRefresh: () => void;
}

export const ModelStatusBadge: React.FC<ModelStatusBadgeProps> = ({ status, onRefresh }) => {
  if (!status) {
    return (
      <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs border border-slate-700">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>NaviDC Bağlanıyor...</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
        status.online
          ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300'
          : 'bg-amber-950/40 border-amber-700/50 text-amber-300'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={`w-2 h-2 rounded-full ${
            status.online ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
          }`}
        />
        <Cpu className="w-3.5 h-3.5" />
        <span className="font-semibold">{status.modelName.replace('StarDoc-AI/', '')}</span>
        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-300 uppercase font-mono">
          {status.device}
        </span>
      </div>

      <button
        onClick={onRefresh}
        className="p-1 hover:bg-slate-700/60 rounded text-slate-400 hover:text-slate-200 transition-colors"
        title="Model Durumunu Yenile"
      >
        <RefreshCw className="w-3 h-3" />
      </button>
    </div>
  );
};
