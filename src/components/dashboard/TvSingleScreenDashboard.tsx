import React from 'react';
import type { DashboardData, DowntimeCategory } from '../../types';
import { formatDuration } from '../../lib/dataService';
import { Target, TrendingUp, Activity, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface TvSingleScreenDashboardProps {
  data: DashboardData;
  theme?: 'dark' | 'light';
}

const CATEGORY_COLORS: Record<DowntimeCategory, string> = {
  'Machine Breakdown': '#facc15',   // Yellow
  'Line Unbalancing': '#f472b6',    // Pink
  'Line Balancing': '#ec4899',      // Pink
  'Operator Movement': '#0d9488',   // Deep Teal
  'Re work': '#4ade80',             // Green
  'Idle': '#ef4444',                // Red
  'Style Changeover': '#f97316',    // Orange
  'Break': '#3b82f6',               // Blue
  'Meeting': '#a855f7',             // Purple
  'Bobbin': '#6366f1',              // Indigo
  'No Line Feeding': '#f97316',     // Amber/Orange
};

export const TvSingleScreenDashboard: React.FC<TvSingleScreenDashboardProps> = ({
  data,
  theme = 'light',
}) => {
  const { hourly, criticalOperations, downtimeSummary } = data;

  // 1. Calculations
  const totalTarget = hourly.reduce((sum, h) => sum + (Number(h.target) || 0), 0);
  const totalActual = hourly.reduce((sum, h) => sum + (Number(h.actual) || 0), 0);
  const totalDeviation = totalActual - totalTarget;
  const efficiency = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;
  const totalDowntimeMinutes = downtimeSummary.reduce((sum, d) => sum + (Number(d.minutes) || 0), 0);

  // 2. 10-Hour Array
  const hours = Array.from({ length: 10 }, (_, i) => {
    const hourNum = i + 1;
    const found = hourly.find(h => h.hour === hourNum) || {
      hour: hourNum,
      input_available: 200,
      target: 150,
      actual: 0,
    };
    const target = Number(found.target) || 150;
    const actual = Number(found.actual) || 0;
    const dev = actual - target;

    let suffix = 'th';
    if (hourNum === 1) suffix = 'st';
    else if (hourNum === 2) suffix = 'nd';
    else if (hourNum === 3) suffix = 'rd';

    return {
      hour: hourNum,
      label: `${hourNum}${suffix}`,
      target,
      actual,
      dev,
      pct: target > 0 ? Math.round((actual / target) * 100) : 0,
      isMet: actual >= target,
    };
  });

  // 3. Downtime Categories Aggregated
  const categoryTotals: Record<string, number> = {
    'Machine Breakdown': 0,
    'Line Unbalancing': 0,
    'Line Balancing': 0,
    'Operator Movement': 0,
    'Re work': 0,
    'Idle': 0,
    'Style Changeover': 0,
    'Break': 0,
    'Meeting': 0,
    'Bobbin': 0,
    'No Line Feeding': 0,
  };
  downtimeSummary.forEach((item) => {
    if (categoryTotals[item.category] !== undefined) {
      categoryTotals[item.category] += Number(item.minutes) || 0;
    }
  });

  const pieData = Object.keys(categoryTotals)
    .map((cat) => ({
      name: cat,
      value: categoryTotals[cat],
      color: CATEGORY_COLORS[cat as DowntimeCategory] || '#94a3b8',
    }))
    .filter((d) => d.value > 0);

  // 4. Critical Operations Summary
  const opsList: {
    opNo: number;
    name: string;
    worker: string;
    workerId: string;
    prod: number;
    target: number;
    isMet: boolean;
    pct: number;
  }[] = [];

  const seenOps = new Map<number, typeof opsList[0]>();
  criticalOperations.forEach((op) => {
    if (!seenOps.has(op.operation_no)) {
      const item = {
        opNo: op.operation_no,
        name: op.operation_name,
        worker: op.worker_name,
        workerId: op.worker_id,
        prod: op.production,
        target: op.target,
        isMet: op.production >= op.target,
        pct: op.target > 0 ? Math.round((op.production / op.target) * 100) : 0,
      };
      seenOps.set(op.operation_no, item);
      opsList.push(item);
    } else {
      const existing = seenOps.get(op.operation_no)!;
      existing.prod += op.production;
      existing.target += op.target;
      existing.pct = existing.target > 0 ? Math.round((existing.prod / existing.target) * 100) : 0;
      existing.isMet = existing.prod >= existing.target;
    }
  });

  // Clean Light Theme Styling Tokens
  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-300/90 shadow-xs';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-600';
  const headerBorder = isDark ? 'border-slate-800' : 'border-slate-200';

  return (
    <div className="w-full h-full flex flex-col gap-2.5 min-h-0 overflow-hidden select-none">
      {/* ROW 1: TOP 4 METRIC GAUGES (Fixed Height) */}
      <div className="grid grid-cols-4 gap-2.5 flex-shrink-0">
        {/* 1. Planned Target */}
        <div className={`${cardBg} px-3.5 py-2.5 rounded-xl border flex items-center justify-between`}>
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted} block`}>
              Shift Target Output
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-xl lg:text-2xl font-black industrial-digits ${textPrimary}`}>
                {totalTarget.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">PCS</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700">
            <Target className="w-5 h-5" />
          </div>
        </div>

        {/* 2. Actual Produced */}
        <div className={`${cardBg} px-3.5 py-2.5 rounded-xl border flex items-center justify-between`}>
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted} block`}>
              Actual Output Produced
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl lg:text-2xl font-black industrial-digits text-[#0f4c6e]">
                {totalActual.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">PCS</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-cyan-100 border border-cyan-200 flex items-center justify-center text-cyan-800">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* 3. Line Efficiency */}
        <div className={`${cardBg} px-3.5 py-2.5 rounded-xl border flex items-center justify-between`}>
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted} block`}>
              Shift Line Efficiency
            </span>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-xl lg:text-2xl font-black industrial-digits ${
                  efficiency >= 90 ? 'text-emerald-600' : efficiency >= 75 ? 'text-amber-600' : 'text-rose-600'
                }`}
              >
                {efficiency}%
              </span>
              <span
                className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                  totalDeviation >= 0
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                {totalDeviation >= 0 ? `+${totalDeviation}` : totalDeviation} PCS
              </span>
            </div>
          </div>
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              efficiency >= 90
                ? 'bg-emerald-100 border border-emerald-200 text-emerald-700'
                : 'bg-rose-100 border border-rose-200 text-rose-700'
            }`}
          >
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* 4. Total Downtime Stoppage */}
        <div className={`${cardBg} px-3.5 py-2.5 rounded-xl border flex items-center justify-between`}>
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted} block`}>
              Lost Time (Stoppages)
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl lg:text-2xl font-black industrial-digits text-rose-700">
                {formatDuration(totalDowntimeMinutes, 'short')}
              </span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ROW 2: HOURLY PRODUCTION 10-COLUMN BAR MATRIX */}
      <div className={`${cardBg} rounded-xl border p-3 flex flex-col min-h-0 flex-[1.1]`}>
        <div className={`flex items-center justify-between pb-2 border-b ${headerBorder} mb-2 flex-shrink-0`}>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-700"></span>
            <h3 className={`text-xs lg:text-sm font-black uppercase tracking-wider ${textPrimary}`}>
              10-Hour Shift Output Matrix (Target: 150 PCS / Hour)
            </h3>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-bold">
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Met / Ahead (▲)
            </span>
            <span className="inline-flex items-center gap-1 text-rose-700">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Deficit (▼)
            </span>
            <span className="inline-flex items-center gap-1 text-amber-700">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> On Target (▬)
            </span>
          </div>
        </div>

        {/* 10 Equal Visual Hourly Columns */}
        <div className="grid grid-cols-10 gap-2 flex-1 min-h-0 items-stretch">
          {hours.map((h) => {
            const maxVal = 200;
            const barHeightPct = Math.min(Math.round((h.actual / maxVal) * 100), 100);
            const targetLinePct = Math.round((h.target / maxVal) * 100);

            return (
              <div
                key={h.hour}
                className={`flex flex-col justify-between rounded-lg p-2 border transition-all ${
                  h.isMet
                    ? 'bg-emerald-50/70 border-emerald-300'
                    : h.dev === 0
                    ? 'bg-amber-50/60 border-amber-300'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                {/* Header */}
                <div className="text-center flex-shrink-0">
                  <span className={`text-[11px] font-extrabold uppercase ${textMuted} block`}>
                    {h.label} Hr
                  </span>
                </div>

                {/* Visual Bar Column */}
                <div className="flex-1 my-1.5 flex items-end justify-center relative min-h-[65px]">
                  {/* Target reference line */}
                  <div
                    className="absolute w-full border-b-2 border-sky-400 border-dashed z-10 pointer-events-none"
                    style={{ bottom: `${targetLinePct}%` }}
                    title={`Target: ${h.target}`}
                  />

                  {/* Background Track */}
                  <div className="w-8 h-full rounded-md bg-slate-200/80 relative flex items-end justify-center overflow-hidden border border-slate-300/60">
                    {/* Actual Value Bar */}
                    <div
                      className={`w-full rounded-b-md transition-all duration-700 flex flex-col justify-end items-center pb-1 ${
                        h.isMet
                          ? 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                          : h.dev === 0
                          ? 'bg-gradient-to-t from-amber-500 to-amber-400'
                          : 'bg-gradient-to-t from-rose-600 to-rose-400'
                      }`}
                      style={{ height: `${barHeightPct}%` }}
                    >
                      <span className="text-[10px] font-black text-white industrial-digits leading-none drop-shadow">
                        {h.actual}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Deviation & Target Chip */}
                <div className="text-center flex-shrink-0 pt-1 border-t border-slate-200">
                  <div className="flex items-center justify-center gap-0.5">
                    {h.dev > 0 ? (
                      <span className="text-xs font-black text-emerald-700 industrial-digits flex items-center">
                        ▲+{h.dev}
                      </span>
                    ) : h.dev < 0 ? (
                      <span className="text-xs font-black text-rose-700 industrial-digits flex items-center">
                        ▼{h.dev}
                      </span>
                    ) : (
                      <span className="text-xs font-black text-amber-600 industrial-digits flex items-center">
                        ▬ 0
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 block mt-0.5">
                    T: {h.target}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ROW 3: CRITICAL OPERATIONS (LEFT) & DOWNTIME METRICS (RIGHT) */}
      <div className="grid grid-cols-12 gap-2.5 flex-1 min-h-0">
        {/* LEFT: Critical Operations Efficiency Cards (Col 1 to 7) */}
        <div className={`col-span-7 ${cardBg} rounded-xl border p-3 flex flex-col min-h-0`}>
          <div className={`flex items-center justify-between pb-1.5 border-b ${headerBorder} mb-2 flex-shrink-0`}>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <h3 className={`text-xs lg:text-sm font-black uppercase tracking-wider ${textPrimary}`}>
                Critical Operations &bull; Worker Performance
              </h3>
            </div>
            <span className="text-[10px] font-bold text-slate-500">
              Live Target Index
            </span>
          </div>

          {/* 2x4 Operations Grid */}
          <div className="grid grid-cols-2 gap-2 flex-1 min-h-0 overflow-hidden">
            {opsList.slice(0, 8).map((op) => (
              <div
                key={op.opNo}
                className="p-2 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-[#134665] text-white font-black text-[9px] flex items-center justify-center flex-shrink-0">
                        {op.opNo}
                      </span>
                      <span className={`text-[11px] font-black uppercase truncate ${textPrimary}`}>
                        {op.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 ml-5 block truncate">
                      {op.worker} {op.workerId && <span className="font-mono text-[9px] text-slate-500">({op.workerId})</span>}
                    </span>
                  </div>

                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-black industrial-digits flex-shrink-0 ${
                      op.isMet
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {op.pct}%
                  </span>
                </div>

                {/* Progress bar + Output Numbers */}
                <div className="mt-1">
                  <div className="flex justify-between text-[9px] font-bold text-slate-500 mb-0.5">
                    <span>Progress</span>
                    <span className="industrial-digits font-extrabold text-slate-800">
                      {op.prod} / {op.target} PCS
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${op.isMet ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${Math.min(op.pct, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Downtime Donut & Loss Categories (Col 8 to 12) */}
        <div className={`col-span-5 ${cardBg} rounded-xl border p-3 flex flex-col min-h-0 justify-between`}>
          <div className={`flex items-center justify-between pb-1.5 border-b ${headerBorder} mb-1.5 flex-shrink-0`}>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
              <h3 className={`text-xs lg:text-sm font-black uppercase tracking-wider ${textPrimary}`}>
                Downtime Categories Breakdown
              </h3>
            </div>
            <span className="text-[10px] font-black text-rose-800 bg-rose-100 px-2 py-0.5 rounded border border-rose-300 industrial-digits">
              {totalDowntimeMinutes}m Lost
            </span>
          </div>

          <div className="flex items-center gap-3 flex-1 min-h-0">
            {/* Donut Chart */}
            <div className="w-[120px] h-[120px] relative flex-shrink-0 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={36}
                    outerRadius={56}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-base font-black text-slate-900 industrial-digits leading-none">
                  {formatDuration(totalDowntimeMinutes, 'short')}
                </span>
                <span className="text-[8px] font-extrabold uppercase text-slate-500 leading-none mt-0.5">LOST</span>
              </div>
            </div>

            {/* Category Progress Bars */}
            <div className="flex-1 grid grid-cols-1 gap-1 min-h-0 overflow-hidden pr-1">
              {Object.keys(CATEGORY_COLORS).map((cat) => {
                const mins = categoryTotals[cat] || 0;
                const pct = totalDowntimeMinutes > 0 ? Math.round((mins / totalDowntimeMinutes) * 100) : 0;
                return (
                  <div key={cat} className="flex flex-col justify-center">
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0 border border-black/10"
                          style={{ backgroundColor: CATEGORY_COLORS[cat as DowntimeCategory] }}
                        />
                        <span className={`truncate font-bold ${textMuted}`}>{cat}</span>
                      </div>
                      <span className="font-extrabold industrial-digits text-slate-800 ml-1">
                        {formatDuration(mins, 'short')} <span className="text-slate-400 font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden mt-0.5">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: CATEGORY_COLORS[cat as DowntimeCategory],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
