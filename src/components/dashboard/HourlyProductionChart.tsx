import React from 'react';
import type { HourlyProduction } from '../../types';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Cell,
  LabelList,
  Tooltip,
} from 'recharts';

interface HourlyProductionChartProps {
  hourly: HourlyProduction[];
  selectedHour?: number;
}

export const HourlyProductionChart: React.FC<HourlyProductionChartProps> = ({ hourly, selectedHour = 1 }) => {
  // 1. Calculate cumulative progression
  let runningTarget = 0;
  let runningActual = 0;

  // Identify the highest hour that has recorded output
  let highestLoggedHour = 0;
  for (let h = 10; h >= 1; h--) {
    const found = hourly.find(row => row.hour === h);
    if (found && Number(found.actual) > 0) {
      highestLoggedHour = h;
      break;
    }
  }
  if (highestLoggedHour === 0) highestLoggedHour = 10;

  const chartData = Array.from({ length: 10 }, (_, index) => {
    const hourNum = index + 1;
    const found = hourly.find(h => h.hour === hourNum) || {
      hour: hourNum,
      input_available: 0,
      target: 0,
      actual: 0,
    };

    const target = Number(found.target) || 0;
    const actual = Number(found.actual) || 0;
    const input = Number(found.input_available) || 0;
    const deviation = actual - target;

    runningTarget += target;
    runningActual += actual;

    let suffix = 'th';
    if (hourNum === 1) suffix = 'st';
    else if (hourNum === 2) suffix = 'nd';
    else if (hourNum === 3) suffix = 'rd';

    // Plot cumulative point only for completed/active hours
    const isLoggedHour = hourNum <= highestLoggedHour;

    return {
      hourLabel: `${hourNum}${suffix}`,
      hour: hourNum,
      target,
      actual,
      input,
      deviation,
      cumTarget: runningTarget,
      cumActual: isLoggedHour ? runningActual : null,
      isPositive: deviation >= 0,
    };
  });

  const totalActualShift = runningActual;
  const totalTargetShift = runningTarget;
  const shiftEfficiency = totalTargetShift > 0 ? Math.round((totalActualShift / totalTargetShift) * 100) : 0;

  // Custom SVG Label for Target Bars
  const renderTargetLabel = (props: any) => {
    const { x, y, width, value } = props;
    if (!value) return null;
    return (
      <text
        x={x + width / 2}
        y={y - 3}
        fill="#0284c7"
        textAnchor="middle"
        fontSize={9}
        fontWeight={800}
        fontFamily="JetBrains Mono, monospace"
      >
        {value}
      </text>
    );
  };

  // Custom SVG Label for Actual Bars
  const renderActualLabel = (props: any) => {
    const { x, y, width, value, index } = props;
    const item = chartData[index];
    if (!item || value === undefined || value === null) return null;

    const dev = item.deviation;
    const isAhead = dev > 0;
    const isEqual = dev === 0;
    const devText = isEqual ? '0' : isAhead ? `+${dev}` : `${dev}`;
    const badgeColor = isEqual ? '#d97706' : isAhead ? '#059669' : '#e11d48';

    return (
      <g>
        <text
          x={x + width / 2}
          y={y - 12}
          fill="#0f172a"
          textAnchor="middle"
          fontSize={10}
          fontWeight={900}
          fontFamily="JetBrains Mono, monospace"
        >
          {value}
        </text>
        <text
          x={x + width / 2}
          y={y - 3}
          fill={badgeColor}
          textAnchor="middle"
          fontSize={8.5}
          fontWeight={900}
          fontFamily="JetBrains Mono, monospace"
        >
          {devText}
        </text>
      </g>
    );
  };


  return (
    <div className="w-full h-full bg-white rounded-xl border border-slate-300 shadow-xs px-3 py-1.5 flex flex-col justify-between min-h-0">
      <div className="flex items-center justify-between pb-1 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-700"></span>
          <h3 className="text-xs lg:text-sm font-black text-slate-900 uppercase tracking-wide">
            Hourly Output vs. Target (Shift Production)
          </h3>
          <span className="text-[10px] text-amber-900 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
            Shift Total: <strong>{totalActualShift} PCS</strong> ({shiftEfficiency}% of {totalTargetShift})
          </span>
        </div>

        <div className="flex items-center gap-3 text-[10px] lg:text-[11px] font-bold">
          <span className="inline-flex items-center gap-1 text-sky-700">
            <span className="w-2 h-2 bg-sky-300 rounded-xs inline-block"></span> Target (150)
          </span>
          <span className="inline-flex items-center gap-1 text-emerald-700">
            <span className="w-2 h-2 bg-emerald-500 rounded-xs inline-block"></span> Met Target
          </span>
          <span className="inline-flex items-center gap-1 text-rose-700">
            <span className="w-2 h-2 bg-rose-500 rounded-xs inline-block"></span> Under Target
          </span>
          <span className="inline-flex items-center gap-1 text-amber-700">
            <span className="w-2.5 h-0.5 bg-amber-500 inline-block"></span> Cumulative Line
          </span>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0 pt-0.5">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 22, right: 24, bottom: 0, left: -15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="hourLabel"
              tick={{ fill: '#334155', fontSize: 9.5, fontWeight: 800 }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
            />
            {/* Left YAxis: Hourly Production Output (0 - 220) */}
            <YAxis
              yAxisId="left"
              tick={{ fill: '#64748b', fontSize: 9.5, fontWeight: 700 }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
              domain={[0, 220]}
            />
            {/* Right YAxis: Cumulative Total Production (0 - 1500+) */}
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#d97706', fontSize: 9.5, fontWeight: 800 }}
              axisLine={{ stroke: '#f59e0b' }}
              tickLine={false}
              domain={[0, (dataMax: number) => Math.max(Math.ceil((dataMax || 1500) * 1.15), 1500)]}
              tickFormatter={(val) => `${val}`}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-slate-900/95 text-white p-2 rounded shadow-lg border border-slate-700 text-xs">
                    <p className="font-bold text-cyan-300 border-b border-slate-700 pb-1 mb-1">
                      {d.hourLabel} Hour Production
                    </p>
                    <p className="flex justify-between gap-3 text-slate-300">
                      <span>Target:</span> <strong className="text-sky-300">{d.target} PCS</strong>
                    </p>
                    <p className="flex justify-between gap-3 text-slate-300">
                      <span>Actual Output:</span> <strong className="text-white">{d.actual} PCS</strong>
                    </p>
                    <p className="flex justify-between gap-3 text-slate-300">
                      <span>Deviation:</span>{' '}
                      <strong className={d.deviation >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {d.deviation >= 0 ? `+${d.deviation}` : d.deviation} PCS
                      </strong>
                    </p>
                    {d.cumActual !== null && (
                      <p className="flex justify-between gap-3 text-amber-300 border-t border-slate-700 pt-1 mt-1 font-extrabold">
                        <span>Cumulative Output:</span> <strong>{d.cumActual} PCS</strong>
                      </p>
                    )}
                  </div>
                );
              }}
            />

            {/* Target Reference Line at 150 */}
            <ReferenceLine yAxisId="left" y={150} stroke="#0284c7" strokeDasharray="3 3" opacity={0.4} />

            {/* Target Bar */}
            <Bar yAxisId="left" dataKey="target" name="Target" fill="#bae6fd" radius={[2, 2, 0, 0]} maxBarSize={26}>
              <LabelList dataKey="target" content={renderTargetLabel} />
            </Bar>

            {/* Actual Output Bar */}
            <Bar yAxisId="left" dataKey="actual" name="Actual Output" radius={[2, 2, 0, 0]} maxBarSize={26}>
              {chartData.map((entry, index) => {
                const isSelected = entry.hour === selectedHour;
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.actual >= entry.target ? '#10b981' : '#f43f5e'}
                    stroke={isSelected ? '#0284c7' : 'none'}
                    strokeWidth={isSelected ? 2.5 : 0}
                  />
                );
              })}
              <LabelList dataKey="actual" content={renderActualLabel} />
            </Bar>

            {/* Cumulative Progression Line (Clean dots, no count labels) */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumActual"
              name="Cum. Actual"
              stroke="#d97706"
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: '#f59e0b', stroke: '#78350f', strokeWidth: 1.5 }}
              activeDot={{ r: 5, fill: '#f59e0b' }}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
