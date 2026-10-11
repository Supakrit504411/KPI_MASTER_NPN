import { ExternalLink } from 'lucide-react';
import SlideShell from './SlideShell';

// สไลด์ที่ผู้นำเสนอแทรกเอง: รูปภาพ (capture) หรือฝังเว็บ (iframe)
export default function InsertedSlide({ insert, itemNo, footer }) {
  const kicker = `ประกอบข้อ ${itemNo}`;

  if (insert.type === 'image') {
    return (
      <div className="w-[1600px] h-[900px] bg-slate-900 flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 flex items-center justify-center p-6">
          <img src={insert.src} alt={insert.title || kicker} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
        </div>
        <div className="px-10 py-3 flex items-center justify-between text-base text-slate-300 bg-slate-950/60 shrink-0">
          <span>{kicker}{insert.title ? ` · ${insert.title}` : ''}</span>
          <span>{footer}</span>
        </div>
      </div>
    );
  }

  // ฝังเว็บ/เว็บแอป
  return (
    <SlideShell kicker={kicker} title={insert.title || insert.src} footer={footer}
      aside={
        <a href={insert.src} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-lg font-semibold hover:bg-blue-700">
          <ExternalLink className="w-5 h-5" /> เปิดในแท็บใหม่
        </a>
      }>
      <div className="w-full h-full rounded-2xl border border-slate-200 overflow-hidden bg-slate-50">
        <iframe
          src={insert.src}
          title={insert.title || insert.src}
          className="w-full h-full"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          referrerPolicy="no-referrer"
        />
      </div>
    </SlideShell>
  );
}
