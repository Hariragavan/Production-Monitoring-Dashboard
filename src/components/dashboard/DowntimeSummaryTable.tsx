import React from 'react';
import type { DowntimeSummaryItem, DowntimeCategory } from '../../types';
import { CategoryDot } from '../common/StatusBadge';
import { formatDuration } from '../../lib/dataService';

interface DowntimeSummaryTableProps {
  downtimeSummary: DowntimeSummaryItem[];
}

const ORDERED_CATEGORIES: DowntimeCategory[] = [
  'Machine Breakdown',
  'Line Unbalancing',
  'Operator Movement',
  'Re work',
  'Idle',
  'Style Changeover',
];

export const DowntimeSummaryTable: React.FC<DowntimeSummaryTableProps> = ({ downtimeSummary }) => {
  // Map category & hour to minutes
  const dataMap: Record<string, Record<number, number>> = {};
  ORDERED_CATEGORIES.forEach((cat) => {
    dataMap[cat] = {};
  });

  downtimeSummary.forEach((item) => {
    if (!dataMap[item.category]) {
      dataMap[item.category] = {};
    }
    dataMap[item.category][item.hour] = item.minutes;
  });

  // Calculate overall downtime minutes
  let grandTotalMinutes = 0;

  return (
    <div className="w-full bg-white shadow-sm border border-slate-300 rounded-sm overflow-hidden mt-3">
      {/* Section Ribbon Bar */}
      <div className="bg-[#184e68] text-white px-3 py-1.5 flex items-center justify-between text-xs lg:text-sm font-black tracking-wider uppercase">
        <span>Downtime Summary</span>
        <span className="text-[11px] text-cyan-200 font-semibold tracking-normal lowercase">
          (minutes of lost production per hour)
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-center table-fixed border-collapse border border-slate-300">
          <thead>
            <tr className="bg-[#1b435b] text-white text-[11px] lg:text-xs font-bold tracking-wide">
              {/* Vertical section label space */}
              <th className="w-[36px] bg-[#123043] border-r border-slate-400/40 p-1"></th>
              <th className="w-[212px] min-w-[180px] px-3 py-1.5 text-left border-r border-slate-400/40 font-bold">
                Category
              </th>
              {Array.from({ length: 10 }, (_, i) => {
                const hourNum = i + 1;
                let suffix = 'th';
                if (hourNum === 1) suffix = 'st';
                else if (hourNum === 2) suffix = 'nd';
                else if (hourNum === 3) suffix = 'rd';

                return (
                  <th key={hourNum} className="px-1 py-1.5 border-r border-slate-400/40 text-[11px] lg:text-xs font-bold">
                    {hourNum}{suffix} Hr.
                  </th>
                );
              })}
              <th className="w-[110px] px-2 py-1.5 bg-[#0d344d] text-cyan-300 font-black text-xs lg:text-sm tracking-wider uppercase">
                TOTAL
              </th>
            </tr>
          </thead>
          <tbody className="text-slate-800 text-xs font-medium">
            {ORDERED_CATEGORIES.map((cat, rowIndex) => {
              const isFirstRow = rowIndex === 0;
              const hoursObj = dataMap[cat] || {};
              let rowTotal = 0;
              for (let h = 1; h <= 10; h++) {
                rowTotal += hoursObj[h] || 0;
              }
              grandTotalMinutes += rowTotal;

              return (
                <tr
                  key={cat}
                  className={`border-b border-slate-300 ${
                    rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                  } hover:bg-slate-100/60 transition-colors`}
                >
                  {/* Left vertical banner */}
                  {isFirstRow && (
                    <td
                      rowSpan={ORDERED_CATEGORIES.length}
                      className="bg-[#123043] text-cyan-200 font-black text-[11px] uppercase tracking-widest text-center border-r border-slate-300 p-1 select-none"
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                    >
                      Downtime
                    </td>
                  )}

                  {/* Category with color indicator */}
                  <td className="px-3 py-2 text-left border-r border-slate-300">
                    <div className="flex items-center gap-2">
                      <CategoryDot category={cat} size="md" />
                      <span className="font-bold text-slate-800 tracking-tight text-[11px] lg:text-xs">
                        {cat}
                      </span>
                    </div>
                  </td>

                  {/* 10 Hourly Cells */}
                  {Array.from({ length: 10 }, (_, i) => {
                    const hourNum = i + 1;
                    const mins = hoursObj[hourNum];
                    const hasValue = mins !== undefined && mins !== null && mins > 0;

                    return (
                      <td
                        key={hourNum}
                        className="px-1 py-2 border-r border-slate-300 text-center font-bold text-slate-700 industrial-digits text-[11px] lg:text-xs"
                      >
                        {hasValue ? (
                          <span className="text-slate-900 font-bold bg-amber-50/60 px-1 py-0.5 rounded border border-amber-200/50">
                            {formatDuration(mins, 'short')}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-normal">-</span>
                        )}
                      </td>
                    );
                  })}

                  {/* Category Row Total */}
                  <td className="px-2 py-2 font-black text-slate-900 bg-slate-100/90 border-l border-slate-300 industrial-digits text-xs lg:text-sm">
                    {rowTotal > 0 ? (
                      <span className="text-rose-700 font-black">{formatDuration(rowTotal, 'short')}</span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
