import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Maximize, Minimize, Settings2, X, LayoutGrid } from 'lucide-react';
import { getUniquePEAs, MONITOR_PEAS } from '../../utils/parseCSV';
import { buildItemIndex, buildPEAOverview, filterItems, ITEM_FILTERS, toImageUrl } from '../../utils/presentation';
import { getCoverImageUrl } from '../../services/googleSheet';
import CoverSlide from '../presentational/presentation/CoverSlide';
import ImageCoverSlide from '../presentational/presentation/ImageCoverSlide';
import OverviewSlide from '../presentational/presentation/OverviewSlide';
import MatrixSlide from '../presentational/presentation/MatrixSlide';
import KpiSlide from '../presentational/presentation/KpiSlide';
import SummarySlide from '../presentational/presentation/SummarySlide';
import PresentationSetup from '../presentational/presentation/PresentationSetup';

const SLIDE_W = 1600;
const SLIDE_H = 900;
const STORAGE_KEY = 'pea-presentation-v1';
const COVER_KEY = 'pea-presentation-cover';

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

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

export default function PresentationContainer({ rawData, dataStatus, onExit }) {
  const allPeas = useMemo(() => getUniquePEAs(rawData), [rawData]);
  const index = useMemo(() => buildItemIndex(rawData), [rawData]);
  const saved = useMemo(loadSaved, []);

  const [focusPeas, setFocusPeas] = useState(() => {
    const list = (saved.focusPeas || MONITOR_PEAS).filter((p) => allPeas.includes(p));
    return list.length ? list : allPeas.slice(0, 4);
  });
  // itemFilter: all | passed | failed | custom (เลือกเองรายข้อ)
  const [itemFilter, setItemFilter] = useState(() => (saved.itemFilter in ITEM_FILTERS || saved.itemFilter === 'custom' ? saved.itemFilter : 'failed'));
  const [customItems, setCustomItems] = useState(() => (saved.deckItems || []).filter((i) => index.has(i)));
  const deckItems = useMemo(
    () => (itemFilter === 'custom' ? customItems : filterItems(index, focusPeas, itemFilter)),
    [itemFilter, customItems, index, focusPeas],
  );
  const setDeckItems = useCallback((next) => {
    setCustomItems((prev) => (typeof next === 'function' ? next(prev) : next));
    setItemFilter('custom');
  }, []);
  const [current, setCurrent] = useState(0);
  const [drill, setDrill] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [pendingJump, setPendingJump] = useState(null);
  // หน้าปก: รูปที่เลือกจากเครื่องนี้ (มาก่อน) > ลิงก์ในชีต Config (coverImage) > ปกสำเร็จรูป
  const [localCover, setLocalCover] = useState(() => {
    try {
      return localStorage.getItem(COVER_KEY) || '';
    } catch {
      return '';
    }
  });
  const [sheetCover, setSheetCover] = useState('');
  const hideTimer = useRef(null);
  const scale = useFitScale();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ focusPeas, deckItems, itemFilter }));
    } catch {
      // ไม่บันทึกได้ก็ใช้งานต่อได้ตามปกติ
    }
  }, [focusPeas, deckItems, itemFilter]);

  useEffect(() => {
    getCoverImageUrl().then(setSheetCover);
  }, []);

  const changeLocalCover = useCallback((dataUrl) => {
    setLocalCover(dataUrl);
    try {
      if (dataUrl) localStorage.setItem(COVER_KEY, dataUrl);
      else localStorage.removeItem(COVER_KEY);
    } catch {
      // พื้นที่เก็บเต็ม — ยังแสดงได้จนกว่าจะปิดหน้า
    }
  }, []);

  const coverSrc = localCover || toImageUrl(sheetCover);

  const slides = useMemo(() => [
    { key: 'cover', type: 'cover' },
    { key: 'overview', type: 'overview' },
    { key: 'matrix', type: 'matrix' },
    ...deckItems.map((item) => ({ key: `kpi-${item}`, type: 'kpi', item })),
    { key: 'summary', type: 'summary' },
  ], [deckItems]);

  const matrixIndex = 2;
  const safeCurrent = Math.min(current, slides.length - 1);
  const slide = slides[safeCurrent];

  const go = useCallback((i) => {
    setCurrent(Math.max(0, Math.min(slides.length - 1, i)));
  }, [slides.length]);

  // กระโดดไปข้อที่เลือกจากแผนที่/สรุป (ถ้ายังไม่อยู่ใน deck ให้เพิ่มเข้าไปก่อน)
  const jumpToItem = useCallback((item) => {
    if (!deckItems.includes(item)) {
      const order = [...index.keys()];
      setDeckItems(order.filter((i) => i === item || deckItems.includes(i)));
    }
    setPendingJump(item);
  }, [deckItems, index, setDeckItems]);

  useEffect(() => {
    if (!pendingJump) return;
    const i = slides.findIndex((s) => s.item === pendingJump);
    if (i >= 0) {
      setCurrent(i);
      setPendingJump(null);
    }
  }, [pendingJump, slides]);

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
      if (showSetup) {
        if (e.key === 'Escape') setShowSetup(false);
        return;
      }
      if (e.target instanceof HTMLInputElement) return;
      switch (e.key) {
        case 'ArrowRight': case 'PageDown': case ' ': e.preventDefault(); go(safeCurrent + 1); break;
        case 'ArrowLeft': case 'PageUp': e.preventDefault(); go(safeCurrent - 1); break;
        case 'Home': go(0); break;
        case 'End': go(slides.length - 1); break;
        case 'f': case 'F': toggleFullscreen(); break;
        case 'd': case 'D': setDrill((v) => !v); break;
        case 'm': case 'M': go(matrixIndex); break;
        case 's': case 'S': setShowSetup(true); break;
        case 'Escape': if (!document.fullscreenElement) onExit(); break;
        default:
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, safeCurrent, slides.length, showSetup, toggleFullscreen, onExit]);

  // แถบควบคุมจะซ่อนเองเมื่อไม่ขยับเมาส์ 2.5 วินาที
  const pokeControls = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 2500);
  }, []);
  useEffect(() => {
    pokeControls();
    return () => clearTimeout(hideTimer.current);
  }, [pokeControls]);

  const footer = `${safeCurrent + 1} / ${slides.length}`;

  const renderSlide = () => {
    switch (slide.type) {
      case 'cover': {
        const builtIn = <CoverSlide dataStatus={dataStatus} focusPeas={focusPeas} itemCount={deckItems.length} />;
        return coverSrc ? <ImageCoverSlide src={coverSrc} fallback={builtIn} /> : builtIn;
      }
      case 'overview':
        return <OverviewSlide overview={buildPEAOverview(rawData, focusPeas)} footer={footer} />;
      case 'matrix':
        return <MatrixSlide index={index} focusPeas={focusPeas} deckItems={deckItems} onJump={jumpToItem} footer={footer} />;
      case 'kpi':
        return <KpiSlide entry={index.get(slide.item)} focusPeas={focusPeas} drill={drill} onToggleDrill={() => setDrill((v) => !v)} footer={footer} />;
      case 'summary':
        return <SummarySlide index={index} focusPeas={focusPeas} onJump={jumpToItem} footer={footer} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center overflow-hidden select-none" onMouseMove={pokeControls}>
      <div style={{ width: SLIDE_W * scale, height: SLIDE_H * scale }} className="relative shadow-2xl">
        <div style={{ width: SLIDE_W, height: SLIDE_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          {renderSlide()}
        </div>
      </div>

      {/* คลิกขอบซ้าย/ขวาเพื่อเปลี่ยนสไลด์ */}
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
        {Object.entries(ITEM_FILTERS).map(([mode, label]) => (
          <button
            key={mode}
            type="button"
            title="เลือกข้อที่นำเสนอ"
            onClick={() => { setItemFilter(mode); setCurrent(0); }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${itemFilter === mode ? 'bg-amber-400 text-blue-900' : 'hover:bg-white/15'}`}
          >
            {label}
          </button>
        ))}
        <div className="w-px h-5 bg-white/20 mx-1" />
        <CtrlBtn title="แผนที่ตัวชี้วัด (M)" onClick={() => go(matrixIndex)}><LayoutGrid className="w-5 h-5" /></CtrlBtn>
        <CtrlBtn title="ตั้งค่า (S)" onClick={() => setShowSetup(true)}><Settings2 className="w-5 h-5" /></CtrlBtn>
        <CtrlBtn title="เต็มจอ (F)" onClick={toggleFullscreen}>{isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}</CtrlBtn>
        <CtrlBtn title="ออกจากโหมดนำเสนอ (Esc)" onClick={onExit}><X className="w-5 h-5" /></CtrlBtn>
      </div>

      {showSetup && (
        <PresentationSetup
          index={index}
          allPeas={allPeas}
          focusPeas={focusPeas}
          deckItems={deckItems}
          itemFilter={itemFilter}
          onChangeFilter={setItemFilter}
          onChangePeas={setFocusPeas}
          onChangeItems={setDeckItems}
          localCover={localCover}
          sheetCover={sheetCover}
          onChangeLocalCover={changeLocalCover}
          onClose={() => setShowSetup(false)}
        />
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
