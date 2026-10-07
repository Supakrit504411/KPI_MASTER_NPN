// โครงสไลด์ 1600x900 ทุกหน้าใช้ร่วมกัน: แถบหัวเรื่อง + พื้นที่เนื้อหา + footer
export default function SlideShell({ kicker, title, aside, footer, children }) {
  return (
    <div className="w-[1600px] h-[900px] bg-white flex flex-col overflow-hidden">
      <div className="h-2 bg-gradient-to-r from-blue-800 via-blue-600 to-amber-400 shrink-0" />
      <div className="px-16 pt-10 pb-6 flex items-start justify-between gap-10 shrink-0">
        <div className="min-w-0">
          {kicker && <div className="text-xl font-semibold text-blue-700 mb-2">{kicker}</div>}
          <h2 className="text-[40px] leading-tight font-bold text-slate-800">{title}</h2>
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </div>
      <div className="flex-1 min-h-0 px-16 pb-6">{children}</div>
      <div className="px-16 py-4 border-t border-slate-100 flex items-center justify-between text-base text-slate-400 shrink-0">
        <span>PEA Dashboard · ผลการดำเนินงานตามตัวชี้วัด (KPIs)</span>
        <span>{footer}</span>
      </div>
    </div>
  );
}
