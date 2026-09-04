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
  'Line Balancing',
  'Operator Movement',
  'Re work',
  'Idle',
  'Style Changeover',
  'Break',
  'Meeting',
  'Bobbin',
  'No Line Feeding',
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

  return (
    <div className="w-full bg-white shadow-xs border border-slate-300 rounded-sm overflow-hidden">
      {/* Section Ribbon Bar */}
      <div className="bg-[#184e68] text-white px-2.5 py-1 flex items-center justify-between text-xs font-black tracking-wider uppercase">
        <span>Downtime Summary</span>
        <span className="text-[10px] text-cyan-200 font-semibold tracking-normal lowercase">
          (lost minutes per hour)
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-center table-fixed border-collapse border border-slate-300 text-[10px] lg:text-[11px]">
          <thead>
            <tr className="bg-[#1b435b] text-white font-bold tracking-wide">
              {/* Shrunk Category section */}
              <th className="w-[110px] px-2 py-1 text-left border-r border-slate-400/40 font-bold">
                Category
              </th>
              {Array.from({ length: 10 }, (_, i) => {
                const hourNum = i + 1;
                let suffix = 'th';
                if (hourNum === 1) suffix = 'st';
                else if (hourNum === 2) suffix = 'nd';
                else if (hourNum === 3) suffix = 'rd';

                return (
                  <th key={hourNum} className="px-0.5 py-1 border-r border-slate-400/40 font-bold">
                    {hourNum}{suffix}
                  </th>
                );
              })}
              <th className="w-[65px] px-1 py-1 bg-[#0d344d] text-cyan-300 font-black tracking-wider uppercase">
                TOTAL
              </th>
            </tr>
          </thead>
          <tbody className="text-slate-800 font-medium">
            {ORDERED_CATEGORIES.map((cat, rowIndex) => {
              const hoursObj = dataMap[cat] || {};
              let rowTotal = 0;
              for (let h = 1; h <= 10; h++) {
                rowTotal += hoursObj[h] || 0;
              }

              return (
                <tr
                  key={cat}
                  className={`border-b border-slate-200 ${
                    rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                  } hover:bg-slate-100/60 transition-colors`}
                >
                  {/* Category with color indicator */}
                  <td className="px-1.5 py-1 text-left border-r border-slate-200">
                    <div className="flex items-center gap-1.5 truncate">
                      <CategoryDot category={cat} size="sm" />
                      <span className="font-bold text-slate-800 tracking-tight text-[10px] truncate" title={cat}>
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
                        className="px-0.5 py-1 border-r border-slate-200 text-center font-bold text-slate-700 industrial-digits"
                      >
                        {hasValue ? (
                          <span className="text-slate-900 font-bold bg-amber-50 px-1 py-0.5 rounded border border-amber-200/60 text-[10px]">
                            {formatDuration(mins, 'short')}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-normal">-</span>
                        )}
                      </td>
                    );
                  })}

                  {/* Category Row Total */}
                  <td className="px-1 py-1 font-black text-slate-900 bg-slate-100/90 border-l border-slate-200 industrial-digits">
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
