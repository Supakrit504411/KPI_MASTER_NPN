import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Maximize, Minimize, X, HelpCircle, Image as ImageIcon, Upload, Trash2, FileDown, Loader2 } from 'lucide-react';
import { fetchPlanData } from '../../services/planSheet';
import { buildPlanDeck, GRADE_ORDER, gradeStyle } from '../../utils/parsePlan';
import LoadingSpinner from '../presentational/LoadingSpinner';
import ErrorMessage from '../presentational/ErrorMessage';
import PlanCoverSlide from '../presentational/presentation/plan/PlanCoverSlide';
import PlanOverviewSlide from '../presentational/presentation/plan/PlanOverviewSlide';
import PlanAreaSlide from '../presentational/presentation/plan/PlanAreaSlide';
import ImageCoverSlide from '../presentational/presentation/ImageCoverSlide';
import { usePdfExport, PdfDeck } from '../presentational/presentation/PdfDeck';

const PLAN_COVER_KEY = 'pea-plan-presentation-cover';

const SLIDE_W = 1600;
const SLIDE_H = 900;

function useFitScale() {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / SLIDE_W, window.innerHeight / SLIDE_H));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  return scale;
}

export default function PlanPresentationContainer({ onExit }) {
  const [csvBySheet, setCsvBySheet] = useState(null);
  const [error, setError] = useState('');
  const [current, setCurrent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showLegend, setShowLegend] = useState(false);
  const [showCoverPanel, setShowCoverPanel] = useState(false);
  const [localCover, setLocalCover] = useState(() => {
    try { return localStorage.getItem(PLAN_COVER_KEY) || ''; } catch { return ''; }
  });
  const hideTimer = useRef(null);
  const scale = useFitScale();
  const pdf = usePdfExport(); // ส่งออกทุกสไลด์เป็น PDF

  const changeLocalCover = useCallback((dataUrl) => {
    setLocalCover(dataUrl);
    try {
      if (dataUrl) localStorage.setItem(PLAN_COVER_KEY, dataUrl);
      else localStorage.removeItem(PLAN_COVER_KEY);
    } catch {
      // พื้นที่เต็ม — ยังใช้งานต่อได้ในหน้าปัจจุบัน
    }
  }, []);

  const load = useCallback(() => {
    setError('');
    setCsvBySheet(null);
    fetchPlanData()
      .then((data) => {
        const hasAny = Object.values(data).some((c) => c && c.trim().length > 40);
        if (!hasAny) throw new Error('ไม่พบข้อมูลแผนปฏิบัติ');
        setCsvBySheet(data);
      })
      .catch((e) => setError(e.message || 'โหลดข้อมูลแผนปฏิบัติไม่สำเร็จ'));
  }, []);
  useEffect(load, [load]);

  const deck = useMemo(() => (csvBySheet ? buildPlanDeck(csvBySheet) : null), [csvBySheet]);

  const slides = useMemo(() => {
    if (!deck) return [];
    return [
      { key: 'cover', type: 'cover' },
      { key: 'overview', type: 'overview' },
      ...deck.areas.map((a) => ({ key: `area-${a.key}`, type: 'area', area: a })),
    ];
  }, [deck]);

  const safeCurrent = Math.min(current, Math.max(slides.length - 1, 0));
  const go = useCallback((i) => setCurrent(Math.max(0, Math.min(slides.length - 1, i))), [slides.length]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      if (document.fullscreenElement) document.exitFullscreen?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (showLegend) { if (e.key === 'Escape') setShowLegend(false); return; }
      if (showCoverPanel) { if (e.key === 'Escape') setShowCoverPanel(false); return; }
      if (e.target instanceof HTMLInputElement) return;
      switch (e.key) {
        case 'ArrowRight': case 'PageDown': case ' ': e.preventDefault(); go(safeCurrent + 1); break;
        case 'ArrowLeft': case 'PageUp': e.preventDefault(); go(safeCurrent - 1); break;
        case 'Home': go(0); break;
        case 'End': go(slides.length - 1); break;
        case 'f': case 'F': toggleFullscreen(); break;
        case 'Escape': if (!document.fullscreenElement) onExit(); break;
        default:
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, safeCurrent, slides.length, toggleFullscreen, onExit, showLegend, showCoverPanel]);

  const pokeControls = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 2500);
  }, []);
  useEffect(() => {
    pokeControls();
    return () => clearTimeout(hideTimer.current);
  }, [pokeControls]);

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center p-8">
        <div className="max-w-lg w-full">
          <ErrorMessage message={error} onRetry={load} />
          <button type="button" onClick={onExit} className="mt-4 w-full py-3 rounded-xl bg-white/10 text-white hover:bg-white/20">ปิด</button>
        </div>
      </div>
    );
  }
  if (!deck) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center">
        <LoadingSpinner message="กำลังโหลดข้อมูลแผนปฏิบัติ..." />
      </div>
    );
  }

  const renderSlide = (slide = slides[safeCurrent], footer = `${safeCurrent + 1} / ${slides.length}`) => {
    switch (slide.type) {
      case 'cover': {
        const builtIn = <PlanCoverSlide deck={deck} />;
        return localCover ? <ImageCoverSlide src={localCover} fallback={builtIn} /> : builtIn;
      }
      case 'overview': return <PlanOverviewSlide deck={deck} footer={footer} />;
      case 'area': return <PlanAreaSlide area={slide.area} footer={footer} />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center overflow-hidden select-none" onMouseMove={pokeControls}>
      <div style={{ width: SLIDE_W * scale, height: SLIDE_H * scale }} className="relative shadow-2xl">
        <div style={{ width: SLIDE_W, height: SLIDE_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          {renderSlide()}
        </div>
      </div>

      <button type="button" aria-label="ก่อนหน้า" onClick={() => go(safeCurrent - 1)} className="absolute left-0 top-1/4 h-1/2 w-16 opacity-0 hover:opacity-100 flex items-center justify-center text-white/70 transition-opacity">
        <ChevronLeft className="w-10 h-10" />
      </button>
      <button type="button" aria-label="ถัดไป" onClick={() => go(safeCurrent + 1)} className="absolute right-0 top-1/4 h-1/2 w-16 opacity-0 hover:opacity-100 flex items-center justify-center text-white/70 transition-opacity">
        <ChevronRight className="w-10 h-10" />
      </button>

      <div className="absolute top-0 inset-x-0 h-1 bg-white/10">
        <div className="h-full bg-amber-400 transition-all" style={{ width: `${((safeCurrent + 1) / slides.length) * 100}%` }} />
      </div>

      <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-800/90 text-white rounded-full px-2 py-1.5 shadow-xl transition-opacity duration-300 ${controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <CtrlBtn title="ก่อนหน้า (←)" onClick={() => go(safeCurrent - 1)}><ChevronLeft className="w-5 h-5" /></CtrlBtn>
        <span className="text-sm tabular-nums px-2 min-w-16 text-center">{safeCurrent + 1} / {slides.length}</span>
        <CtrlBtn title="ถัดไป (→)" onClick={() => go(safeCurrent + 1)}><ChevronRight className="w-5 h-5" /></CtrlBtn>
        <div className="w-px h-5 bg-white/20 mx-1" />
        <button type="button" onClick={() => setShowLegend(true)} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium hover:bg-white/15">
          <HelpCircle className="w-4 h-4" /> เกณฑ์เกรด
        </button>
        <button
          type="button"
          onClick={() => setShowCoverPanel(true)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${localCover ? 'bg-amber-400 text-blue-900' : 'hover:bg-white/15'}`}
          title="เปลี่ยนหน้าปก"
        >
          <ImageIcon className="w-4 h-4" /> หน้าปก
        </button>
        <CtrlBtn title="ส่งออกทุกสไลด์เป็น PDF (สำรองไว้ใช้ตอนไม่มีอินเทอร์เน็ต)" onClick={pdf.start}>
          {pdf.exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
        </CtrlBtn>
        <CtrlBtn title="เต็มจอ (F)" onClick={toggleFullscreen}>{isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}</CtrlBtn>
        <CtrlBtn title="ออก (Esc)" onClick={onExit}><X className="w-5 h-5" /></CtrlBtn>
      </div>

      {showCoverPanel && (
        <CoverPanel
          localCover={localCover}
          onChange={changeLocalCover}
          onClose={() => setShowCoverPanel(false)}
        />
      )}

      {pdf.exporting && <PdfDeck deckRef={pdf.deckRef} slides={slides} render={renderSlide} />}

      {showLegend && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-8" onClick={() => setShowLegend(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-2xl font-bold text-slate-800">เกณฑ์ประเมินความสำเร็จกิจกรรม</h3>
              <button type="button" onClick={() => setShowLegend(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              {GRADE_ORDER.map((g) => {
                const st = gradeStyle(g);
                return (
                  <div key={g} className="flex items-start gap-4">
                    <span className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white shrink-0" style={{ background: st.color }}>{g}</span>
                    <div>
                      <div className="text-lg font-semibold text-slate-800">{st.label}</div>
                      <div className="text-base text-slate-500">{st.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CtrlBtn({ title, onClick, children }) {
  return (
    <button type="button" title={title} onClick={onClick} className="p-2 rounded-full hover:bg-white/15 transition-colors">
      {children}
    </button>
  );
}

function CoverPanel({ localCover, onChange, onClose }) {
  const onPickFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const onPaste = (e) => {
      const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith('image/'));
      if (item) onPickFile(item.getAsFile());
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  });

  return (
    <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-6 z-10" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-800">เปลี่ยนหน้าปก (แผนปฏิบัติ)</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          อัปโหลดรูป (เช่น export จาก Canva/PowerPoint ขนาด 16:9) หรือกด Ctrl+V วางรูปจากคลิปบอร์ด
        </p>

        {localCover ? (
          <div className="mb-4 border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
            <img src={localCover} alt="หน้าปก" className="w-full object-contain max-h-64 mx-auto block" />
          </div>
        ) : (
          <div className="mb-4 border-2 border-dashed border-slate-300 rounded-xl py-10 text-center text-slate-400 bg-slate-50">
            ยังไม่มีหน้าปกเอง · ใช้หน้าปกเริ่มต้นของระบบ
          </div>
        )}

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-medium cursor-pointer hover:bg-blue-700">
            <Upload className="w-4 h-4" /> เลือกรูป
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onPickFile(e.target.files?.[0])} />
          </label>
          {localCover && (
            <button type="button" onClick={() => onChange('')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-700 font-medium hover:bg-red-100">
              <Trash2 className="w-4 h-4" /> ลบหน้าปก
            </button>
          )}
          <div className="flex-1" />
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200">ปิด</button>
        </div>
      </div>
    </div>
  );
}
