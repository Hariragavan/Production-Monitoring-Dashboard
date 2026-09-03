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
} from 'recharts';

interface HourlyProductionChartProps {
  hourly: HourlyProduction[];
  selectedHour?: number;
}

export const HourlyProductionChart: React.FC<HourlyProductionChartProps> = ({ hourly, selectedHour = 1 }) => {
  let cumTarget = 0;
  let cumActual = 0;

  const chartData = Array.from({ length: 10 }, (_, index) => {
    const hourNum = index + 1;
    const found = hourly.find(h => h.hour === hourNum) || {
      hour: hourNum,
      input_available: 200,
      target: 150,
      actual: 0,
    };

    const target = Number(found.target) || 0;
    const actual = Number(found.actual) || 0;
    const input = Number(found.input_available) || 0;
    const deviation = actual - target;

    cumTarget += target;
    cumActual += actual;

    let suffix = 'th';
    if (hourNum === 1) suffix = 'st';
    else if (hourNum === 2) suffix = 'nd';
    else if (hourNum === 3) suffix = 'rd';

    return {
      hourLabel: `${hourNum}${suffix} Hr`,
      hour: hourNum,
      target,
      actual,
      input,
      deviation,
      cumTarget,
      cumActual,
      isPositive: deviation >= 0,
    };
  });

  // Custom SVG Label for Target Bars (Permanently displayed above bar, no hover needed)
  const renderTargetLabel = (props: any) => {
    const { x, y, width, value } = props;
    if (!value) return null;
    return (
      <text
        x={x + width / 2}
        y={y - 4}
        fill="#0284c7"
        textAnchor="middle"
        fontSize={10}
        fontWeight={800}
        fontFamily="JetBrains Mono, monospace"
      >
        {value}
      </text>
    );
  };

  // Custom SVG Label for Actual Bars (Output Number + Deviation Chip permanently visible)
  const renderActualLabel = (props: any) => {
    const { x, y, width, value, index } = props;
    const item = chartData[index];
    if (!item) return null;
    const dev = item.deviation;
    const isPos = dev > 0;
    const isZero = dev === 0;
    const devText = isPos ? `▲+${dev}` : isZero ? `▬ 0` : `▼${dev}`;
    const devColor = isPos ? '#059669' : isZero ? '#d97706' : '#dc2626';

    return (
      <g>
        {/* Output Quantity */}
        <text
          x={x + width / 2}
          y={y - 14}
          fill="#0f172a"
          textAnchor="middle"
          fontSize={11}
          fontWeight={900}
          fontFamily="JetBrains Mono, monospace"
        >
          {value}
        </text>
        {/* Deviation Chip Badge */}
        <text
          x={x + width / 2}
          y={y - 3}
          fill={devColor}
          textAnchor="middle"
          fontSize={9}
          fontWeight={900}
          fontFamily="JetBrains Mono, monospace"
        >
          {devText}
        </text>
      </g>
    );
  };

  return (
    <div className="w-full h-full bg-white rounded-xl border border-slate-300 shadow-xs px-3.5 py-2.5 flex flex-col justify-between min-h-0">
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-700"></span>
          <h3 className="text-xs lg:text-sm font-black text-slate-900 uppercase tracking-wide">
            Hourly Output vs. Target (Shift Production)
          </h3>
          <span className="text-[10px] text-cyan-800 font-bold bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
            Active: Hour {selectedHour}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-bold">
          <span className="inline-flex items-center gap-1 text-sky-700">
            <span className="w-2.5 h-2.5 bg-sky-300 rounded-xs inline-block"></span> Target (150)
          </span>
          <span className="inline-flex items-center gap-1 text-emerald-700">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs inline-block"></span> Met Target
          </span>
          <span className="inline-flex items-center gap-1 text-rose-700">
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-xs inline-block"></span> Under Target
          </span>
          <span className="inline-flex items-center gap-1 text-amber-700">
            <span className="w-3 h-1 bg-amber-500 inline-block"></span> Cumulative
          </span>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0 pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 26, right: 20, bottom: 0, left: -15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="hourLabel"
              tick={{ fill: '#334155', fontSize: 10, fontWeight: 800 }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
              domain={[0, 220]}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#d97706', fontSize: 10, fontWeight: 800 }}
              axisLine={{ stroke: '#f59e0b' }}
              tickLine={false}
              domain={[0, 'dataMax + 100']}
            />

            {/* Target Reference Line */}
            <ReferenceLine yAxisId="left" y={150} stroke="#0284c7" strokeDasharray="3 3" opacity={0.5} />

            {/* Target Bar with permanent label */}
            <Bar yAxisId="left" dataKey="target" name="Target" fill="#bae6fd" radius={[3, 3, 0, 0]} maxBarSize={28}>
              <LabelList dataKey="target" content={renderTargetLabel} />
            </Bar>

            {/* Actual Output Bar with permanent numbers & deviations (NO HOVER) */}
            <Bar yAxisId="left" dataKey="actual" name="Actual Output" radius={[3, 3, 0, 0]} maxBarSize={28}>
              {chartData.map((entry, index) => {
                const isSelected = entry.hour === selectedHour;
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.actual >= entry.target ? '#10b981' : '#f43f5e'}
                    stroke={isSelected ? '#0284c7' : 'none'}
                    strokeWidth={isSelected ? 3 : 0}
                  />
                );
              })}
              <LabelList dataKey="actual" content={renderActualLabel} />
            </Bar>

            {/* Cumulative Progression Line */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumActual"
              name="Cum. Actual"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 3, fill: '#f59e0b' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
