import React from 'react';
import type { HourlyProduction, DowntimeSummaryItem } from '../../types';
import { formatDuration } from '../../lib/dataService';
import { TrendingUp, Target, AlertTriangle, Activity } from 'lucide-react';

interface ProductionSummaryKpiProps {
  hourly: HourlyProduction[];
  downtimeSummary: DowntimeSummaryItem[];
  selectedHour: number;
}

export const ProductionSummaryKpi: React.FC<ProductionSummaryKpiProps> = ({
  hourly,
  downtimeSummary,
  selectedHour,
}) => {
  // 1. Current Hour Specific Metrics
  const currentHourData = hourly.find(h => h.hour === selectedHour) || {
    hour: selectedHour,
    input_available: 200,
    target: 150,
    actual: 0,
  };

  const hourTarget = Number(currentHourData.target) || 150;
  const hourActual = Number(currentHourData.actual) || 0;
  const hourDeviation = hourActual - hourTarget;
  const hourEfficiency = hourTarget > 0 ? Math.round((hourActual / hourTarget) * 100) : 0;
  const hourDowntimeMinutes = downtimeSummary
    .filter(d => d.hour === selectedHour)
    .reduce((sum, d) => sum + (Number(d.minutes) || 0), 0);

  // 2. Full Shift Context
  const shiftTotalTarget = hourly.reduce((sum, h) => sum + (Number(h.target) || 0), 0);
  const shiftTotalActual = hourly.reduce((sum, h) => sum + (Number(h.actual) || 0), 0);
  const shiftTotalDowntime = downtimeSummary.reduce((sum, d) => sum + (Number(d.minutes) || 0), 0);

  let suffix = 'th';
  if (selectedHour === 1) suffix = 'st';
  else if (selectedHour === 2) suffix = 'nd';
  else if (selectedHour === 3) suffix = 'rd';

  const isEfficiencyGood = hourEfficiency >= 100;
  const isEfficiencyMid = hourEfficiency >= 80 && hourEfficiency < 100;

  return (
    <div className="grid grid-cols-4 gap-2.5 flex-shrink-0">
      {/* 1. Hour Target */}
      <div className="bg-white px-3.5 py-1.5 rounded-xl border border-slate-300 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-black text-cyan-800 uppercase tracking-wider block">
              {selectedHour}{suffix} Hr Target
            </span>
            <span className="text-[9px] font-semibold text-slate-400">/ 1h</span>
          </div>
          <span className="text-lg lg:text-xl font-black text-slate-900 industrial-digits leading-tight">
            {hourTarget.toLocaleString()} <span className="text-[10px] font-semibold text-slate-500">PCS</span>
          </span>
          <span className="text-[9px] text-slate-400 font-semibold block">
            Shift Quota: {shiftTotalTarget.toLocaleString()} PCS
          </span>
        </div>
        <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
          <Target className="w-4 h-4" />
        </div>
      </div>

      {/* 2. Hour Actual Output */}
      <div className="bg-white px-3.5 py-1.5 rounded-xl border border-slate-300 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-black text-[#0f4c6e] uppercase tracking-wider block">
              {selectedHour}{suffix} Hr Output
            </span>
            <span className="text-[9px] font-semibold text-slate-400">/ 1h</span>
          </div>
          <span className="text-lg lg:text-xl font-black text-[#0f4c6e] industrial-digits leading-tight">
            {hourActual.toLocaleString()} <span className="text-[10px] font-semibold text-slate-500">PCS</span>
          </span>
          <span className="text-[9px] text-slate-500 font-semibold block">
            Shift Total: <strong className="text-slate-700">{shiftTotalActual.toLocaleString()}</strong> PCS
          </span>
        </div>
        <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center">
          <TrendingUp className="w-4 h-4" />
        </div>
      </div>

      {/* 3. Hour Line Efficiency */}
      <div className="bg-white px-3.5 py-1.5 rounded-xl border border-slate-300 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
            {selectedHour}{suffix} Hr Efficiency
          </span>
          <div className="flex items-baseline gap-1.5 leading-tight">
            <span
              className={`text-lg lg:text-xl font-black industrial-digits ${
                isEfficiencyGood
                  ? 'text-emerald-600'
                  : isEfficiencyMid
                  ? 'text-amber-600'
                  : 'text-rose-600'
              }`}
            >
              {hourEfficiency}%
            </span>
            <span
              className={`text-[9px] font-black uppercase px-1 py-0.2 rounded ${
                hourDeviation >= 0
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {hourDeviation >= 0 ? `▲+${hourDeviation}` : `▼${hourDeviation}`}
            </span>
          </div>
          <span className="text-[9px] text-slate-400 font-semibold block">
            {hourDeviation >= 0 ? 'Ahead of hourly target' : 'Behind hourly target'}
          </span>
        </div>
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isEfficiencyGood
              ? 'bg-emerald-100 text-emerald-700'
              : isEfficiencyMid
              ? 'bg-amber-100 text-amber-700'
              : 'bg-rose-100 text-rose-700'
          }`}
        >
          <Activity className="w-4 h-4" />
        </div>
      </div>

      {/* 4. Hour Downtime Lost */}
      <div className="bg-white px-3.5 py-1.5 rounded-xl border border-slate-300 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black text-rose-700 uppercase tracking-wider block">
            {selectedHour}{suffix} Hr Downtime
          </span>
          <span className="text-lg lg:text-xl font-black text-rose-700 industrial-digits leading-tight">
            {formatDuration(hourDowntimeMinutes, 'short')}
          </span>
          <span className="text-[9px] text-slate-400 font-semibold block">
            Shift Total: {formatDuration(shiftTotalDowntime, 'short')}
          </span>
        </div>
        <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
