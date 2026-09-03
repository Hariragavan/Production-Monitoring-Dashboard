import React from 'react';
import type { DowntimeDetailItem } from '../../types';
import { CategoryDot } from '../common/StatusBadge';

interface DowntimeDetailsTableProps {
  downtimeDetails: DowntimeDetailItem[];
}

interface GroupedIncidentRow {
  key: string;
  reason: string;
  hours: Record<number, { workerName: string; minutes: number }>;
}

export const DowntimeDetailsTable: React.FC<DowntimeDetailsTableProps> = ({ downtimeDetails }) => {
  // Group downtime details into incident rows by reason + line index
  // For the reference image, there are 2 Machine Breakdown rows, 1 Operator Movement, 1 Rework, 1 Idle
  const rowGroups: GroupedIncidentRow[] = [];

  // Group by (reason + occurrence index within hour)
  // Let's bucket details cleanly
  const reasonBuckets: Record<string, DowntimeDetailItem[]> = {};
  downtimeDetails.forEach(item => {
    if (!reasonBuckets[item.reason]) reasonBuckets[item.reason] = [];
    reasonBuckets[item.reason].push(item);
  });

  // Convert bucketed items into neat display rows
  Object.keys(reasonBuckets).forEach(reason => {
    const items = reasonBuckets[reason];
    // Separate by distinct hours or index
    // Let's distribute into rows
    const hourItems: Record<number, DowntimeDetailItem[]> = {};
    items.forEach(it => {
      if (!hourItems[it.hour]) hourItems[it.hour] = [];
      hourItems[it.hour].push(it);
    });

    const maxRowsForReason = Math.max(
      ...Object.values(hourItems).map(list => list.length),
      1
    );

    for (let r = 0; r < maxRowsForReason; r++) {
      const rowHours: Record<number, { workerName: string; minutes: number }> = {};
      for (let h = 1; h <= 10; h++) {
        if (hourItems[h] && hourItems[h][r]) {
          rowHours[h] = {
            workerName: hourItems[h][r].worker_name,
            minutes: hourItems[h][r].minutes,
          };
        }
      }
      rowGroups.push({
        key: `${reason}-${r}`,
        reason,
        hours: rowHours,
      });
    }
  });

  return (
    <div className="w-full bg-white shadow-sm border border-slate-300 rounded-sm overflow-hidden mt-3 mb-6">
      {/* Section Ribbon Bar */}
      <div className="bg-[#184e68] text-white px-3 py-1.5 flex items-center justify-between text-xs lg:text-sm font-black tracking-wider uppercase">
        <span>Downtime Details &amp; Operator Incident Log</span>
        <span className="text-[11px] text-cyan-200 font-semibold tracking-normal lowercase">
          (operator assigned &bull; downtime lost)
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-center table-fixed border-collapse border border-slate-300">
          <thead>
            <tr className="bg-[#1b435b] text-white text-[11px] lg:text-xs font-bold tracking-wide">
              {/* Vertical section label space */}
              <th className="w-[36px] bg-[#123043] border-r border-slate-400/40 p-1"></th>
              <th className="w-[212px] min-w-[180px] px-3 py-1.5 text-left border-r border-slate-400/40 font-bold">
                Reason
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
            </tr>
          </thead>
          <tbody className="text-slate-800 text-xs font-medium">
            {rowGroups.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-5 text-center text-slate-500 font-semibold italic">
                  No specific downtime incident logs recorded for this day.
                </td>
              </tr>
            ) : (
              rowGroups.map((row, rowIndex) => {
                const isFirstRow = rowIndex === 0;

                return (
                  <tr
                    key={row.key}
                    className={`border-b border-slate-300 ${
                      rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                    } hover:bg-slate-100/60 transition-colors`}
                  >
                    {/* Left vertical banner */}
                    {isFirstRow && (
                      <td
                        rowSpan={rowGroups.length}
                        className="bg-[#123043] text-cyan-200 font-black text-[11px] uppercase tracking-widest text-center border-r border-slate-300 p-1 select-none"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      >
                        Downtime
                      </td>
                    )}

                    {/* Reason with Dot */}
                    <td className="px-3 py-2 text-left border-r border-slate-300">
                      <div className="flex items-center gap-2">
                        <CategoryDot category={row.reason} size="md" />
                        <span className="font-bold text-slate-900 tracking-tight text-[11px] lg:text-xs">
                          {row.reason}
                        </span>
                      </div>
                    </td>

                    {/* 10 Hourly Cells: Worker Name + Minutes */}
                    {Array.from({ length: 10 }, (_, i) => {
                      const hourNum = i + 1;
                      const entry = row.hours[hourNum];

                      if (!entry || !entry.workerName) {
                        return (
                          <td key={hourNum} className="px-1 py-2 border-r border-slate-200 text-slate-300">
                            -
                          </td>
                        );
                      }

                      return (
                        <td
                          key={hourNum}
                          className="px-1 py-1.5 border-r border-slate-300 text-center leading-tight"
                        >
                          <div className="flex flex-col items-center justify-center">
                            <span className="text-[10px] lg:text-[11px] font-bold text-slate-800 tracking-wider uppercase">
                              {entry.workerName}
                            </span>
                            <span className="text-[11px] lg:text-xs font-black text-rose-700 industrial-digits">
                              {entry.minutes < 10 ? `0${entry.minutes}` : entry.minutes} Min.
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
