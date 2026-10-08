import { Zap } from 'lucide-react';
import { GRADE_ORDER, gradeStyle } from '../../../../utils/parsePlan';

export default function PlanCoverSlide({ deck }) {
  const { office, dataPeriod, summary, areas } = deck;
  return (
    <div className="w-[1600px] h-[900px] bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 text-white flex flex-col justify-center px-28 relative overflow-hidden">
      <div className="absolute -right-40 -top-40 w-[700px] h-[700px] rounded-full bg-white/5" />
      <div className="absolute right-40 bottom-0 w-[420px] h-[420px] rounded-full bg-white/5" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-amber-400/90 text-blue-900 p-2.5 rounded-xl"><Zap className="w-7 h-7" /></div>
          <span className="text-2xl font-medium text-blue-100">การไฟฟ้าส่วนภูมิภาค</span>
        </div>

        <div className="text-3xl text-blue-200 mb-3">นำเสนอความก้าวหน้า</div>
        <h1 className="text-[92px] font-bold leading-none tracking-tight">แผนปฏิบัติการ</h1>
        {office && <div className="text-5xl mt-5 font-semibold text-amber-300">{office}</div>}

        <div className="mt-12 flex items-center gap-10 text-2xl text-blue-100">
          <span><b className="text-white">{areas.length}</b> งานด้าน · <b className="text-white">{summary.total}</b> กิจกรรม</span>
          {dataPeriod && <span>· ข้อมูล {dataPeriod}</span>}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          {GRADE_ORDER.filter((g) => summary.byGrade[g] > 0).map((g) => {
            const st = gradeStyle(g);
            return (
              <span key={g} className="flex items-center gap-2 bg-white/10 rounded-full pl-2 pr-4 py-1.5 text-xl">
                <span className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white" style={{ background: st.color }}>{g}</span>
                <span className="text-blue-50">{st.label}</span>
                <b className="text-white">{summary.byGrade[g]}</b>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
