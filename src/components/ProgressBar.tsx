import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, label }) => {
  const percentage = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  return (
    <div className="w-full bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 shadow-md">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label || 'İşlem Durumu'}
        </span>
        <span className="text-xs font-bold text-indigo-400">
          {current} / {total} (%{percentage})
        </span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out shadow-sm shadow-indigo-500/50"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
