import React from 'react';
import type { HourlyProduction } from '../../types';
import { DeviationIndicator } from '../common/DeviationIndicator';

interface HourlyProductionEditorProps {
  hourly: HourlyProduction[];
  onChange: (updatedHourly: HourlyProduction[]) => void;
}

export const HourlyProductionEditor: React.FC<HourlyProductionEditorProps> = ({
  hourly,
  onChange,
}) => {
  // Ensure array has 10 hours
  const hoursData = Array.from({ length: 10 }, (_, index) => {
    const hourNum = index + 1;
    const existing = hourly.find(h => h.hour === hourNum);
    return existing || {
      hour: hourNum,
      input_available: 200,
      target: 150,
      actual: 0,
    };
  });

  const handleCellChange = (hourNum: number, field: 'input_available' | 'target' | 'actual', val: string) => {
    const num = val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0);
    const updated = hoursData.map(row => {
      if (row.hour === hourNum) {
        return { ...row, [field]: num };
      }
      return row;
    });
    onChange(updated);
  };

  // Row totals
  const totalInput = hoursData.reduce((sum, r) => sum + r.input_available, 0);
  const totalTarget = hoursData.reduce((sum, r) => sum + r.target, 0);
  const totalActual = hoursData.reduce((sum, r) => sum + r.actual, 0);
  const totalDeviation = totalActual - totalTarget;

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-200 mb-4 gap-2">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Hourly Production Schedule</h3>
          <p className="text-xs text-slate-500">
            Edit Input Available, Target, and Actual for hours 1 through 10. Deviations are computed in real time.
          </p>
        </div>
        <div className="text-xs font-semibold px-2.5 py-1 rounded bg-sky-50 text-sky-800 border border-sky-200">
          Auto-Calculation Active
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse border border-slate-300">
          <thead>
            <tr className="bg-[#134665] text-white text-xs font-bold uppercase tracking-wider">
              <th className="px-4 py-2.5 border-r border-slate-400/40">Hour</th>
              <th className="px-4 py-2.5 border-r border-slate-400/40">Input Available</th>
              <th className="px-4 py-2.5 border-r border-slate-400/40">Target</th>
              <th className="px-4 py-2.5 border-r border-slate-400/40">Actual Output</th>
              <th className="px-4 py-2.5 border-r border-slate-400/40 text-center">Deviation (+/-)</th>
              <th className="px-4 py-2.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm font-medium">
            {hoursData.map((row) => {
              const dev = row.actual - row.target;
              let suffix = 'th';
              if (row.hour === 1) suffix = 'st';
              else if (row.hour === 2) suffix = 'nd';
              else if (row.hour === 3) suffix = 'rd';

              return (
                <tr key={row.hour} className="hover:bg-slate-50 transition-colors">
                  {/* Hour */}
                  <td className="px-4 py-2.5 font-bold text-slate-900 bg-slate-100/70 border-r border-slate-200">
                    {row.hour}{suffix} Hr.
                  </td>

                  {/* Input Available */}
                  <td className="px-4 py-2 border-r border-slate-200">
                    <input
                      type="number"
                      min="0"
                      value={row.input_available === 0 ? '' : row.input_available}
                      placeholder="0"
                      onChange={(e) => handleCellChange(row.hour, 'input_available', e.target.value)}
                      className="w-28 px-2.5 py-1.5 bg-white border border-slate-300 rounded font-semibold text-slate-800 industrial-digits focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                    />
                  </td>

                  {/* Target */}
                  <td className="px-4 py-2 border-r border-slate-200">
                    <input
                      type="number"
                      min="0"
                      value={row.target === 0 ? '' : row.target}
                      placeholder="0"
                      onChange={(e) => handleCellChange(row.hour, 'target', e.target.value)}
                      className="w-28 px-2.5 py-1.5 bg-white border border-slate-300 rounded font-semibold text-slate-800 industrial-digits focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                    />
                  </td>

                  {/* Actual */}
                  <td className="px-4 py-2 border-r border-slate-200">
                    <input
                      type="number"
                      min="0"
                      value={row.actual === 0 ? '' : row.actual}
                      placeholder="0"
                      onChange={(e) => handleCellChange(row.hour, 'actual', e.target.value)}
                      className="w-28 px-2.5 py-1.5 bg-white border border-slate-300 rounded font-bold text-slate-950 industrial-digits focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                    />
                  </td>

                  {/* Calculated Deviation */}
                  <td className="px-4 py-2 border-r border-slate-200 text-center bg-slate-50/50">
                    <DeviationIndicator value={dev} size="md" />
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-2 text-center">
                    {dev > 0 ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Ahead
                      </span>
                    ) : dev < 0 ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        Behind
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        On Target
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}

            {/* Total Row */}
            <tr className="bg-slate-200 text-slate-900 font-extrabold text-sm border-t-2 border-slate-400">
              <td className="px-4 py-3 uppercase tracking-wider">TOTAL</td>
              <td className="px-4 py-3 industrial-digits text-slate-800">{totalInput.toLocaleString()}</td>
              <td className="px-4 py-3 industrial-digits text-slate-800">{totalTarget.toLocaleString()}</td>
              <td className="px-4 py-3 industrial-digits text-slate-950 text-base">{totalActual.toLocaleString()}</td>
              <td className="px-4 py-3 text-center">
                <DeviationIndicator value={totalDeviation} size="lg" />
              </td>
              <td className="px-4 py-3 text-center text-xs uppercase">
                {totalDeviation >= 0 ? (
                  <span className="text-emerald-700 font-black">Satisfactory</span>
                ) : (
                  <span className="text-rose-700 font-black">Deficit (-{Math.abs(totalDeviation)})</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
