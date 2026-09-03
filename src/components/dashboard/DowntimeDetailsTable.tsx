import React from 'react';
import type { DowntimeDetailItem } from '../../types';
import { CategoryDot } from '../common/StatusBadge';
import { formatDuration } from '../../lib/dataService';

interface DowntimeDetailsTableProps {
  downtimeDetails: DowntimeDetailItem[];
}

interface GroupedIncidentRow {
  key: string;
  reason: string;
  hours: Record<number, { workerName: string; minutes: number }>;
}

export const DowntimeDetailsTable: React.FC<DowntimeDetailsTableProps> = ({ downtimeDetails }) => {
  // Group downtime details into incident rows by reason
  const rowGroups: GroupedIncidentRow[] = [];

  const reasonBuckets: Record<string, DowntimeDetailItem[]> = {};
  downtimeDetails.forEach(item => {
    if (!reasonBuckets[item.reason]) reasonBuckets[item.reason] = [];
    reasonBuckets[item.reason].push(item);
  });

  Object.keys(reasonBuckets).forEach(reason => {
    const items = reasonBuckets[reason];
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
    <div className="w-full bg-white shadow-xs border border-slate-300 rounded-sm overflow-hidden">
      {/* Section Ribbon Bar */}
      <div className="bg-[#184e68] text-white px-2.5 py-1 flex items-center justify-between text-xs font-black tracking-wider uppercase">
        <span>Operator Downtime Incident Log</span>
        <span className="text-[10px] text-cyan-200 font-semibold tracking-normal lowercase">
          (operator assigned &bull; lost time)
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-center table-fixed border-collapse border border-slate-300 text-[10px] lg:text-[11px]">
          <thead>
            <tr className="bg-[#1b435b] text-white font-bold tracking-wide">
              {/* Shrunk Reason / Category Column */}
              <th className="w-[110px] px-2 py-1 text-left border-r border-slate-400/40 font-bold">
                Reason
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
              {/* Added TOTAL column at the end */}
              <th className="w-[65px] px-1 py-1 bg-[#0d344d] text-cyan-300 font-black tracking-wider uppercase">
                TOTAL
              </th>
            </tr>
          </thead>
          <tbody className="text-slate-800 font-medium">
            {rowGroups.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-4 text-center text-slate-500 font-semibold italic text-xs">
                  No downtime incident logs recorded for this shift.
                </td>
              </tr>
            ) : (
              rowGroups.map((row, rowIndex) => {
                // Calculate row total across all 10 hours
                let rowTotal = 0;
                for (let h = 1; h <= 10; h++) {
                  rowTotal += row.hours[h]?.minutes || 0;
                }

                return (
                  <tr
                    key={row.key}
                    className={`border-b border-slate-200 ${
                      rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                    } hover:bg-slate-100/60 transition-colors`}
                  >
                    {/* Reason with Dot (Shrunk to 110px) */}
                    <td className="px-1.5 py-1 text-left border-r border-slate-200">
                      <div className="flex items-center gap-1.5 truncate">
                        <CategoryDot category={row.reason} size="sm" />
                        <span className="font-bold text-slate-800 tracking-tight text-[10px] truncate" title={row.reason}>
                          {row.reason}
                        </span>
                      </div>
                    </td>

                    {/* 10 Hourly Cells: Worker Name + Lost Minutes */}
                    {Array.from({ length: 10 }, (_, i) => {
                      const hourNum = i + 1;
                      const entry = row.hours[hourNum];

                      if (!entry || !entry.workerName) {
                        return (
                          <td key={hourNum} className="px-0.5 py-1 border-r border-slate-200 text-slate-300">
                            -
                          </td>
                        );
                      }

                      return (
                        <td
                          key={hourNum}
                          className="px-0.5 py-0.5 border-r border-slate-200 text-center leading-tight"
                        >
                          <div className="flex flex-col items-center justify-center">
                            <span className="text-[9px] lg:text-[10px] font-bold text-slate-800 tracking-wider uppercase truncate max-w-full">
                              {entry.workerName}
                            </span>
                            <span className="text-[10px] lg:text-[11px] font-black text-rose-700 industrial-digits">
                              {formatDuration(entry.minutes, 'short')}
                            </span>
                          </div>
                        </td>
                      );
                    })}

                    {/* Row Total Added in Last Column */}
                    <td className="px-1 py-1 font-black text-slate-900 bg-slate-100/90 border-l border-slate-200 industrial-digits text-center">
                      {rowTotal > 0 ? (
                        <span className="text-rose-700 font-black">{formatDuration(rowTotal, 'short')}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
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
