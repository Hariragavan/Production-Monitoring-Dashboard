import React from 'react';
import type { CriticalOperation } from '../../types';
import { Award, AlertCircle, Check } from 'lucide-react';

interface CriticalOperationsChartProps {
  operations: CriticalOperation[];
  selectedHour: number;
}

export const CriticalOperationsChart: React.FC<CriticalOperationsChartProps> = ({ operations, selectedHour }) => {
  let suffix = 'th';
  if (selectedHour === 1) suffix = 'st';
  else if (selectedHour === 2) suffix = 'nd';
  else if (selectedHour === 3) suffix = 'rd';

  // Filter operations for selected hour
  const hourOps = operations.filter((op) => op.hour === selectedHour);

  // If no operations found for this hour, show fallback from any hour or dummy list
  const displayOps = hourOps.length > 0 ? hourOps : operations.slice(0, 6);

  // Sort by operation number
  const sortedList = [...displayOps].sort((a, b) => a.operation_no - b.operation_no);

  return (
    <div className="bg-white rounded-xl border border-slate-300 p-3 flex flex-col h-full shadow-xs">
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 mb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-700"></span>
          <h3 className="text-xs lg:text-sm font-black text-slate-900 uppercase tracking-wider">
            Critical Operations Output ({selectedHour}{suffix} Hour)
          </h3>
        </div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          {sortedList.length} Monitored
        </span>
      </div>

      {sortedList.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-xs text-slate-400 font-semibold italic">
          No critical operations logged for {selectedHour}{suffix} Hour.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 flex-1 min-h-0 overflow-hidden">
          {sortedList.slice(0, 8).map((item, idx) => {
            const target = item.target || 35;
            const production = item.production || 0;
            const efficiency = target > 0 ? Math.round((production / target) * 100) : 0;
            const isAhead = production > target;
            const isEqual = production === target;

            let cardBg = 'bg-rose-50/90 border-rose-300';
            let badgeBg = 'bg-rose-100 text-rose-800 border-rose-300';
            let barColor = 'bg-rose-500';

            if (isAhead) {
              cardBg = 'bg-emerald-50/90 border-emerald-300';
              badgeBg = 'bg-emerald-100 text-emerald-800 border-emerald-300';
              barColor = 'bg-emerald-500';
            } else if (isEqual) {
              cardBg = 'bg-amber-50/90 border-amber-300';
              badgeBg = 'bg-amber-100 text-amber-800 border-amber-300';
              barColor = 'bg-amber-500';
            }

            return (
              <div
                key={item.id || idx}
                className={`${cardBg} border rounded-lg p-2 flex flex-col justify-between min-h-0 transition-colors`}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-[#134665] text-white text-[9px] font-black flex items-center justify-center flex-shrink-0">
                        {item.operation_no}
                      </span>
                      <span className="text-[11px] font-black text-slate-900 tracking-tight uppercase truncate">
                        {item.operation_name}
                      </span>
                    </div>
                    <div className="text-[10px] font-bold text-slate-600 ml-5 truncate">
                      <span className="uppercase">{item.worker_name}</span>{' '}
                      {item.worker_id && <span className="text-slate-400 font-mono text-[9px]">({item.worker_id})</span>}
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-black industrial-digits flex-shrink-0 ${badgeBg}`}
                  >
                    {isAhead ? (
                      <Award className="w-2.5 h-2.5 text-emerald-600" />
                    ) : isEqual ? (
                      <Check className="w-2.5 h-2.5 text-amber-600" />
                    ) : (
                      <AlertCircle className="w-2.5 h-2.5 text-rose-600" />
                    )}
                    {efficiency}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-1">
                  <div className="flex justify-between text-[9px] font-bold text-slate-500 mb-0.5">
                    <span>{selectedHour}{suffix} Hr Output</span>
                    <span className="industrial-digits font-extrabold text-slate-800">
                      {production} / {target} PCS
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${Math.min(efficiency, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
