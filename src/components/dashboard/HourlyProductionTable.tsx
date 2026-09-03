import React from 'react';
import type { HourlyProduction } from '../../types';
import { DeviationIndicator } from '../common/DeviationIndicator';

interface HourlyProductionTableProps {
  hourly: HourlyProduction[];
}

export const HourlyProductionTable: React.FC<HourlyProductionTableProps> = ({ hourly }) => {
  // Ensure array has 10 hours
  const hoursData = Array.from({ length: 10 }, (_, index) => {
    const hourNum = index + 1;
    const found = hourly.find(h => h.hour === hourNum);
    return found || {
      hour: hourNum,
      input_available: 0,
      target: 0,
      actual: 0,
    };
  });

  // Calculate row totals
  const totalInput = hoursData.reduce((acc, curr) => acc + (Number(curr.input_available) || 0), 0);
  const totalTarget = hoursData.reduce((acc, curr) => acc + (Number(curr.target) || 0), 0);
  const totalActual = hoursData.reduce((acc, curr) => acc + (Number(curr.actual) || 0), 0);
  const totalDeviation = totalActual - totalTarget;

  return (
    <div className="w-full bg-white shadow-sm border border-slate-300 rounded-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-center table-fixed border-collapse border border-slate-300">
          <thead>
            <tr className="bg-[#134665] text-white text-xs lg:text-sm font-bold tracking-wide">
              <th className="w-[180px] min-w-[150px] px-3 py-2 text-left border-r border-slate-400/50 uppercase">
                Hourly Production
              </th>
              {Array.from({ length: 10 }, (_, i) => {
                const hourNum = i + 1;
                let suffix = 'th';
                if (hourNum === 1) suffix = 'st';
                else if (hourNum === 2) suffix = 'nd';
                else if (hourNum === 3) suffix = 'rd';

                return (
                  <th key={hourNum} className="px-2 py-2 border-r border-slate-400/40 text-xs lg:text-sm font-extrabold">
                    {hourNum}{suffix} Hr.
                  </th>
                );
              })}
              <th className="w-[120px] px-3 py-2 bg-[#0d344d] text-cyan-300 font-black text-sm lg:text-base tracking-wider uppercase">
                TOTAL
              </th>
            </tr>
          </thead>
          <tbody className="text-slate-800 text-sm lg:text-base font-semibold">
            {/* 1. Input Available */}
            <tr className="border-b border-slate-300 hover:bg-slate-50 transition-colors">
              <td className="px-3 py-2.5 text-left font-bold text-slate-700 bg-slate-100/90 border-r border-slate-300 text-xs lg:text-sm uppercase tracking-wide">
                Input Available
              </td>
              {hoursData.map((row) => (
                <td key={`input-${row.hour}`} className="px-2 py-2.5 border-r border-slate-300 industrial-digits text-slate-700 font-bold">
                  {row.input_available.toLocaleString()}
                </td>
              ))}
              <td className="px-2 py-2.5 font-black text-slate-900 bg-slate-100/90 industrial-digits text-base lg:text-lg">
                {totalInput.toLocaleString()}
              </td>
            </tr>

            {/* 2. Target */}
            <tr className="border-b border-slate-300 hover:bg-slate-50 transition-colors">
              <td className="px-3 py-2.5 text-left font-bold text-slate-700 bg-slate-100/90 border-r border-slate-300 text-xs lg:text-sm uppercase tracking-wide">
                Target
              </td>
              {hoursData.map((row) => (
                <td key={`target-${row.hour}`} className="px-2 py-2.5 border-r border-slate-300 industrial-digits text-slate-700 font-bold">
                  {row.target.toLocaleString()}
                </td>
              ))}
              <td className="px-2 py-2.5 font-black text-slate-900 bg-slate-100/90 industrial-digits text-base lg:text-lg">
                {totalTarget.toLocaleString()}
              </td>
            </tr>

            {/* 3. Actual */}
            <tr className="border-b border-slate-300 hover:bg-slate-50 transition-colors">
              <td className="px-3 py-2.5 text-left font-extrabold text-slate-900 bg-slate-100/90 border-r border-slate-300 text-xs lg:text-sm uppercase tracking-wide">
                Actual
              </td>
              {hoursData.map((row) => (
                <td key={`actual-${row.hour}`} className="px-2 py-2.5 border-r border-slate-300 industrial-digits text-slate-950 font-black text-base lg:text-lg">
                  {row.actual.toLocaleString()}
                </td>
              ))}
              <td className="px-2 py-2.5 font-black text-slate-950 bg-slate-200/90 industrial-digits text-base lg:text-xl">
                {totalActual.toLocaleString()}
              </td>
            </tr>

            {/* 4. Deviation (+/-) */}
            <tr className="bg-slate-50/80 font-black">
              <td className="px-3 py-3 text-left font-extrabold text-slate-900 bg-slate-200/90 border-r border-slate-300 text-xs lg:text-sm uppercase tracking-wide">
                Deviation (+/-)
              </td>
              {hoursData.map((row) => {
                const dev = row.actual - row.target;
                return (
                  <td key={`dev-${row.hour}`} className="px-1.5 py-3 border-r border-slate-300">
                    <DeviationIndicator value={dev} size="md" />
                  </td>
                );
              })}
              <td className="px-2 py-3 bg-slate-200 border-l border-slate-300">
                <DeviationIndicator value={totalDeviation} size="lg" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
