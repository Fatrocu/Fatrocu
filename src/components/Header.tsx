import React from 'react';
import { FileText, Clock, CheckSquare, Settings, Upload, Sparkles, PenTool } from 'lucide-react';
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
  { id: 'upload',   label: 'Belge Yükle', Icon: Upload },
  { id: 'review',   label: 'İnceleme',   Icon: Clock },
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
    <header className="border-b-[3px] border-black bg-white sticky top-0 z-50 shadow-[0_4px_0px_#000]">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-6">
        
        {/* Brand Logo with hand-drawn scribble aesthetics */}
        <div 
          onClick={() => setCurrentPage('upload')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-12 h-12 bg-white border-[2.5px] border-black rounded-xl shadow-[3px_3px_0px_#000] flex items-center justify-center group-hover:rotate-6 transition-transform">
            <PenTool size={24} className="text-black stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold text-2xl text-black tracking-tight">
                FATROCU
              </span>
              <span className="scribble-tag font-scribble text-xs px-2 py-0.5 bg-black text-white rounded">
                v4.0
              </span>
            </div>
            <span className="font-scribble text-xs text-neutral-600 block -mt-1 font-semibold">
              // akıllı yerel fatura asistanı
            </span>
          </div>
        </div>

        {/* Big tactile Navigation Buttons */}
        <nav className="flex items-center gap-3">
          {NAV.map(({ id, label, Icon }) => {
            const active = currentPage === id;
            const badge = id === 'review' ? pendingCount : id === 'approved' ? approvedCount : 0;
            return (
              <button
                key={id}
                onClick={() => setCurrentPage(id)}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl border-[2.5px] border-black font-heading font-bold text-sm transition-all select-none ${
                  active
                    ? 'bg-black text-white shadow-[4px_4px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
                    : 'bg-white text-black hover:bg-neutral-100 shadow-[2px_2px_0px_#000] hover:shadow-[3px_3px_0px_#000]'
                }`}
              >
                <Icon size={18} className="stroke-[2.5]" />
                <span>{label}</span>
                {badge > 0 && (
                  <span
                    className={`ml-1 text-xs font-black px-2 py-0.5 rounded-full border-2 border-black ${
                      active ? 'bg-white text-black' : 'bg-black text-white'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Engine Status Badge (Handcrafted badge) */}
        <div className="hidden lg:flex items-center gap-2.5 bg-white border-2 border-black px-3.5 py-1.5 rounded-xl shadow-[3px_3px_0px_#000]">
          <div
            className={`w-3.5 h-3.5 rounded-full border-2 border-black ${
              modelStatus?.online ? 'bg-white shadow-[inset_0_0_0_3px_#000]' : 'bg-neutral-300'
            }`}
          />
          <div className="text-left">
            <span className="text-[11px] font-extrabold uppercase tracking-wider block leading-tight text-neutral-500">
              Pipeline
            </span>
            <span className="text-xs font-bold text-black block leading-tight font-heading">
              {modelStatus?.modelName ?? 'DeepSeek + Gemma'}
            </span>
          </div>
        </div>

      </div>
    </header>
  );
};
