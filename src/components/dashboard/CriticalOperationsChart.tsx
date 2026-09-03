import React from 'react';
import type { CriticalOperation } from '../../types';
import { Award, AlertCircle } from 'lucide-react';

interface CriticalOperationsChartProps {
  operations: CriticalOperation[];
  selectedHour: number;
}

export const CriticalOperationsChart: React.FC<CriticalOperationsChartProps> = ({ operations, selectedHour }) => {
  let suffix = 'th';
  if (selectedHour === 1) suffix = 'st';
  else if (selectedHour === 2) suffix = 'nd';
  else if (selectedHour === 3) suffix = 'rd';

  // Filter operations for the selected hour
  const hourOps = operations.filter(op => op.hour === selectedHour);

  // If no operations specifically tagged with this hour, show all unique operations
  const displayList = hourOps.length > 0 ? hourOps : operations.filter(op => op.hour === 1 || !op.hour);

  const sortedList = [...displayList].sort((a, b) => a.operation_no - b.operation_no);

  return (
    <div className="w-full h-full bg-white rounded-xl border border-slate-300 shadow-xs p-3 flex flex-col justify-between min-h-0">
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 mb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
          <h3 className="text-xs lg:text-sm font-black text-slate-900 uppercase tracking-wide">
            Critical Operations &bull; {selectedHour}{suffix} Hour Performance
          </h3>
        </div>
        <span className="text-[10px] font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
          {sortedList.length} Active Operators
        </span>
      </div>

      {sortedList.length === 0 ? (
        <div className="py-6 text-center text-slate-400 font-medium italic text-xs">
          No critical operations logged for {selectedHour}{suffix} Hour.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 flex-1 min-h-0 overflow-hidden">
          {sortedList.slice(0, 8).map((item, idx) => {
            const target = item.target || 35;
            const production = item.production || 0;
            const efficiency = target > 0 ? Math.round((production / target) * 100) : 0;
            const isMet = production >= target;

            return (
              <div
                key={item.id || idx}
                className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex flex-col justify-between min-h-0"
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
                    className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-black industrial-digits flex-shrink-0 ${
                      isMet
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {isMet ? <Award className="w-2.5 h-2.5 text-emerald-600" /> : <AlertCircle className="w-2.5 h-2.5 text-rose-600" />}
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
                      className={`h-full rounded-full transition-all duration-500 ${
                        isMet ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
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
