import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto py-4 px-6 border-t border-slate-800 bg-slate-900/80 text-center text-xs text-slate-500">
      <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
        <p>
          Fatrocu v3.0 &bull; Yerel &amp; Güvenli Fatura İşleme &bull; %100 Çevrimdışı &bull; Rust &amp; NaviDC-OCR
        </p>
        <p className="text-slate-600">
          Tüm veriler cihazınızda yerel olarak işlenir ve saklanır.
        </p>
      </div>
    </footer>
  );
};
