import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const PEA_PIE_COLORS = {
  passed: '#10b981',
  failed: '#ef4444',
  pending: '#f59e0b',
};

export default function ComparisonChart({ comparisonData }) {
  if (!comparisonData || comparisonData.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center text-gray-400 border border-gray-200">
        ไม่พบข้อมูลสำหรับแสดงกราฟ
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-gray-700">
          สัดส่วนผลการประเมิน
        </h3>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
          {comparisonData.length} รายการ
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 max-h-[600px] overflow-y-auto pr-1">
        {comparisonData.map((entry) => {
          const label = entry.pea || entry.group || entry.name || '-';
          const passed = entry.passed ?? 0;
          const failed = entry.failed ?? 0;
          const pending = entry.pending ?? 0;
          const passRate = entry.passRate ?? 0;
          const total = passed + failed + pending;
          const pieData = [
            { name: 'ผ่าน', value: passed, key: 'passed' },
            { name: 'ไม่ผ่าน', value: failed, key: 'failed' },
            { name: 'รอผล', value: pending, key: 'pending' },
          ].filter((d) => d.value > 0);

          return (
            <div key={label} className="text-center">
              <p className="text-xs font-semibold text-gray-700 mb-2 truncate" title={label}>
                {label}
              </p>
              {total > 0 ? (
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={50}
                      paddingAngle={2}
                      dataKey="value"
                      isAnimationActive={false}
                      label={({ value }) => value}
                      labelLine={false}
                    >
                      {pieData.map((item) => (
                        <Cell key={item.key} fill={PEA_PIE_COLORS[item.key]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value} ข้อ`, name]}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[140px] flex items-center justify-center text-gray-400 text-xs">
                  ไม่มีข้อมูล
                </div>
              )}
              <p className="text-[11px] text-gray-500 mt-1">
                {total} ข้อ | <span className="font-semibold text-emerald-600">{passRate}%</span> ผ่าน
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-5 mt-5 pt-4 border-t border-gray-100 flex-wrap">
        <LegendItem color={PEA_PIE_COLORS.passed} label="ผ่านเกณฑ์" />
        <LegendItem color={PEA_PIE_COLORS.failed} label="ไม่ผ่าน" />
        <LegendItem color={PEA_PIE_COLORS.pending} label="รอผล" />
      </div>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: color }} />
      <span className="text-xs text-gray-600">{label}</span>
    </div>
  );
}
