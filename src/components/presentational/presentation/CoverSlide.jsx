import { Zap } from 'lucide-react';

export default function CoverSlide({ dataStatus, focusPeas, itemCount }) {
  const today = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <div className="w-[1600px] h-[900px] bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 text-white flex flex-col justify-between p-24 overflow-hidden relative">
      <div className="absolute -right-40 -top-40 w-[700px] h-[700px] rounded-full bg-white/5" />
      <div className="absolute right-40 bottom-[-260px] w-[520px] h-[520px] rounded-full bg-amber-400/10" />
      <div className="flex items-center gap-4 text-2xl text-blue-100 relative">
        <div className="bg-white/15 p-3 rounded-xl"><Zap className="w-9 h-9 text-amber-300" /></div>
        การไฟฟ้าส่วนภูมิภาค
      </div>
      <div className="relative">
        <div className="text-3xl text-amber-300 font-semibold mb-6">นำเสนอผลการดำเนินงาน</div>
        <h1 className="text-[88px] leading-[1.1] font-bold">ค่าเกณฑ์วัด KPIs</h1>
        <div className="mt-10 flex flex-wrap gap-3">
          {focusPeas.map((p) => (
            <span key={p} className="text-2xl px-5 py-2 rounded-full bg-white/15 border border-white/20">{p}</span>
          ))}
        </div>
      </div>
      <div className="flex items-end justify-between text-2xl text-blue-100 relative">
        <div className="space-y-2">
          {dataStatus && <div>สถานะข้อมูล: <span className="text-white font-semibold">{dataStatus}</span></div>}
          <div>นำเสนอ {itemCount} ตัวชี้วัด</div>
        </div>
        <div>{today}</div>
      </div>
    </div>
  );
}
