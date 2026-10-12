import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

// ส่งออกสไลด์ทั้งชุดเป็น PDF ผ่านหน้าต่างพิมพ์ของเบราว์เซอร์ (ใช้ร่วมกันทุกโหมดนำเสนอ)
// ข้อความยังเป็นตัวอักษรจริง คมชัดและค้นหาได้ — ขนาดหน้า/การซ่อนส่วนอื่นอยู่ใน index.css (#pdf-deck)
export function usePdfExport() {
  const [exporting, setExporting] = useState(false);
  const deckRef = useRef(null);

  useEffect(() => {
    if (!exporting) return undefined;
    let cancelled = false;
    const done = () => setExporting(false);
    window.addEventListener('afterprint', done);
    (async () => {
      // รอฟอนต์และรูปทุกภาพโหลดเสร็จก่อน ไม่งั้นหน้าที่มีรูปจะออกมาว่าง
      await document.fonts?.ready;
      const imgs = [...(deckRef.current?.querySelectorAll('img') || [])];
      await Promise.all(imgs.map((img) => (img.complete ? null : img.decode().catch(() => null))));
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (!cancelled) window.print();
    })();
    return () => {
      cancelled = true;
      window.removeEventListener('afterprint', done);
    };
  }, [exporting]);

  const start = useCallback(() => setExporting(true), []);
  return { exporting, start, deckRef };
}

// เรนเดอร์ทุกสไลด์ไว้นอกจอ หน้าละ 1600x900 สำหรับพิมพ์
export function PdfDeck({ deckRef, slides, render }) {
  return createPortal(
    <div id="pdf-deck" ref={deckRef} aria-hidden="true">
      {slides.map((s, i) => (
        <div key={s.key} className="pdf-page">{render(s, `${i + 1} / ${slides.length}`)}</div>
      ))}
    </div>,
    document.body,
  );
}
