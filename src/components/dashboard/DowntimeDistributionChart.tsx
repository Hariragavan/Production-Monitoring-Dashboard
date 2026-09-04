import React from 'react';
import type { DowntimeSummaryItem, DowntimeDetailItem, DowntimeCategory } from '../../types';
import { formatDuration } from '../../lib/dataService';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, CheckCircle2, Clock } from 'lucide-react';

interface DowntimeDistributionChartProps {
  downtimeSummary: DowntimeSummaryItem[];
  downtimeDetails?: DowntimeDetailItem[];
  selectedHour: number;
}

const CATEGORY_COLORS: Record<DowntimeCategory, string> = {
  'Machine Breakdown': '#facc15',   // Yellow
  'Line Unbalancing': '#f472b6',    // Pink
  'Line Balancing': '#ec4899',      // Pink
  'Operator Movement': '#0f766e',   // Deep Teal
  'Re work': '#4ade80',             // Green
  'Idle': '#ef4444',                // Red
  'Style Changeover': '#ea580c',    // Orange
  'Break': '#3b82f6',               // Blue
  'Meeting': '#a855f7',             // Purple
  'Bobbin': '#6366f1',              // Indigo
  'No Line Feeding': '#f97316',     // Amber/Orange
};

export const DowntimeDistributionChart: React.FC<DowntimeDistributionChartProps> = ({
  downtimeSummary,
  downtimeDetails = [],
  selectedHour,
}) => {
  let suffix = 'th';
  if (selectedHour === 1) suffix = 'st';
  else if (selectedHour === 2) suffix = 'nd';
  else if (selectedHour === 3) suffix = 'rd';

  // 1. Aggregate for Selected Hour Categories
  const hourCategoryTotals: Record<string, number> = {
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
    if (item.hour === selectedHour && hourCategoryTotals[item.category] !== undefined) {
      hourCategoryTotals[item.category] += Number(item.minutes) || 0;
    }
  });

  const hourTotalDowntime = Object.values(hourCategoryTotals).reduce((sum, val) => sum + val, 0);

  const pieData = Object.keys(hourCategoryTotals)
    .map((cat) => ({
      name: cat,
      value: hourCategoryTotals[cat],
      color: CATEGORY_COLORS[cat as DowntimeCategory] || '#94a3b8',
    }))
    .filter((d) => d.value > 0);

  // 2. Filter Worker Downtime Incidents for the Selected Hour
  const hourWorkerDowntimes = (downtimeDetails || []).filter(
    (item) => Number(item.hour) === selectedHour && Number(item.minutes) > 0
  );

  const totalWorkerMinutes = hourWorkerDowntimes.reduce((sum, item) => sum + (Number(item.minutes) || 0), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 h-full min-h-0">
      {/* 1. Category Distribution Donut for Selected Hour */}
      <div className="lg:col-span-5 bg-white rounded-xl border border-slate-300 shadow-xs p-3 flex flex-col justify-between min-h-0">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 mb-1 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
            <h3 className="text-xs lg:text-sm font-black text-slate-900 uppercase tracking-wide">
              {selectedHour}{suffix} Hr Lost Time
            </h3>
          </div>
          <span className="text-[10px] font-black text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 industrial-digits">
            {formatDuration(hourTotalDowntime, 'long')}
          </span>
        </div>

        <div className="flex-1 min-h-[110px] relative flex items-center justify-center">
          {pieData.length === 0 ? (
            <div className="text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              ✓ Zero downtime in {selectedHour}{suffix} Hr!
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
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
          )}

          {/* Centered Total Minutes */}
          {pieData.length > 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-sm font-black text-slate-900 industrial-digits leading-none">
                {formatDuration(hourTotalDowntime, 'short')}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                Total
              </span>
            </div>
          )}
        </div>

        {/* Category Legend */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1.5 border-t border-slate-100 text-[10px] flex-shrink-0">
          {Object.keys(hourCategoryTotals).map((cat) => {
            const mins = hourCategoryTotals[cat] || 0;
            return (
              <div key={cat} className="flex items-center justify-between text-slate-700">
                <div className="flex items-center gap-1 truncate">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[cat as DowntimeCategory] }}
                  />
                  <span className="truncate font-semibold">{cat}</span>
                </div>
                <span className={`font-bold industrial-digits ml-1 ${mins > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
                  {formatDuration(mins, 'short')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Worker Downtime Log for Selected Hour (Replaces the BarChart) */}
      <div className="lg:col-span-7 bg-white rounded-xl border border-slate-300 shadow-xs p-3 flex flex-col justify-between min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 mb-1 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-amber-500" />
            <h3 className="text-xs lg:text-sm font-black text-slate-900 uppercase tracking-wide">
              {selectedHour}{suffix} Hr Operator Downtime Impact
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              {hourWorkerDowntimes.length} {hourWorkerDowntimes.length === 1 ? 'Operator' : 'Operators'}
            </span>
            <span className="text-[10px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 industrial-digits">
              {formatDuration(totalWorkerMinutes, 'short')}
            </span>
          </div>
        </div>

        {/* Worker Stoppage Incident List */}
        <div className="flex-1 w-full min-h-[140px] overflow-y-auto pr-0.5 space-y-1.5">
          {hourWorkerDowntimes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 bg-emerald-50/60 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-7 h-7 text-emerald-600 mb-1" />
              <span className="text-xs font-black text-emerald-900 uppercase">
                No Worker Stoppages in {selectedHour}{suffix} Hr
              </span>
              <span className="text-[11px] text-emerald-700 mt-0.5">
                All station operators were fully active without lost stoppage time.
              </span>
            </div>
          ) : (
            hourWorkerDowntimes.map((item, idx) => {
              const categoryColor = CATEGORY_COLORS[item.reason as DowntimeCategory] || '#94a3b8';

              return (
                <div
                  key={item.id || `wd-${idx}`}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 transition"
                >
                  {/* Left: Avatar & Worker Name & Stoppage Category */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[#134665] text-white flex items-center justify-center font-black text-xs flex-shrink-0 shadow-2xs">
                      {item.worker_name ? item.worker_name.charAt(0).toUpperCase() : '?'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs text-slate-900 uppercase tracking-wide truncate">
                          {item.worker_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: categoryColor }}
                        />
                        <span className="text-[11px] font-bold text-slate-700 truncate">
                          {item.reason}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Lost Time Badge & Duration */}
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-black bg-rose-100 text-rose-800 border border-rose-300 industrial-digits shadow-2xs">
                        <Clock className="w-3 h-3 text-rose-600" />
                        <span>{formatDuration(item.minutes, 'short')}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
