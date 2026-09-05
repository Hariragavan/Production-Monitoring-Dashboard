import React from 'react';
import type { CriticalOperation } from '../../types';
import { Activity } from 'lucide-react';

interface CriticalOperationsTableProps {
  operations?: CriticalOperation[];
}

interface GroupedRow {
  operationNo: number;
  operationName: string;
  workerName: string;
  hours: Record<number, { workerName: string; production: number; target: number }>;
}

export function getCriticalOpPerformanceStyle(production: number, target: number) {
  // 1. Operators output is 0 -> Keep the color white
  if (production <= 0) {
    return {
      boxClass: 'bg-white border-slate-300 text-slate-700',
      prodColor: 'text-slate-500 font-black',
      pct: 0,
    };
  }

  if (target <= 0) {
    return {
      boxClass: 'bg-emerald-100/90 border-emerald-400 text-emerald-950',
      prodColor: 'text-emerald-700 font-black',
      pct: 100,
    };
  }

  const pct = Math.round((production / target) * 100);

  // 2. Hit target or over target -> Green
  if (production >= target) {
    return {
      boxClass: 'bg-emerald-100/90 border-emerald-400 text-emerald-950',
      prodColor: 'text-emerald-700 font-black',
      pct,
    };
  }

  // 3. 80% to <100% -> Light Yellow
  if (pct >= 80) {
    return {
      boxClass: 'bg-amber-100/90 border-amber-300 text-amber-950',
      prodColor: 'text-amber-800 font-black',
      pct,
    };
  }

  // 4. Drops below 80% (60% to <80%) -> Light Red
  if (pct >= 60) {
    return {
      boxClass: 'bg-rose-100/80 border-rose-300 text-rose-900',
      prodColor: 'text-rose-700 font-black',
      pct,
    };
  }

  // 5. Below 60% (40% to <60%) -> Increase little red
  if (pct >= 40) {
    return {
      boxClass: 'bg-rose-200 border-rose-400 text-rose-950',
      prodColor: 'text-rose-900 font-black',
      pct,
    };
  }

  // 6. Below 40% (and >0) -> Increase more red color (Deep Red)
  return {
    boxClass: 'bg-red-500 border-red-600 text-white',
    prodColor: 'text-white font-black',
    pct,
  };
}

export const CriticalOperationsTable: React.FC<CriticalOperationsTableProps> = ({ operations }) => {
  const effectiveOps = operations || [];

  if (effectiveOps.length === 0) {
    return (
      <div className="w-full bg-white shadow-xs border border-slate-300 rounded-sm overflow-hidden">
        <div className="bg-[#184e68] text-white px-2.5 py-1 flex items-center justify-between text-xs font-black tracking-wider uppercase">
          <span>Critical Operations Performance</span>
          <span className="text-[10px] text-cyan-200 font-semibold lowercase tracking-normal">
            (&ge;100% green &bull; 80-99% yellow &bull; &lt;80% red shades &bull; 0 white)
          </span>
        </div>
        <div className="p-5 text-center text-slate-400 font-bold text-xs flex flex-col items-center justify-center gap-1.5">
          <Activity className="w-5 h-5 text-slate-300" />
          <span>No critical operations recorded yet. Go to Edit Page to add operation entries.</span>
        </div>
      </div>
    );
  }

  // Group operations into rows:
  // - SAME operation and SAME worker name: merged into the SAME row across hours
  // - SAME operation but DIFFERENT worker name: placed into a DIFFERENT row (User requirement)
  const rowsList: GroupedRow[] = [];

  // Sort ops so earlier table numbers and hours are processed first
  const sortedOps = [...effectiveOps].sort((a, b) => {
    if (a.operation_no !== b.operation_no) return a.operation_no - b.operation_no;
    return a.hour - b.hour;
  });

  sortedOps.forEach((op) => {
    const opNameNorm = (op.operation_name || '').trim().toUpperCase();
    const workerNameNorm = (op.worker_name || '').trim().toUpperCase();

    let targetRow: GroupedRow | undefined;

    for (const r of rowsList) {
      const isSameOp = r.operationName.trim().toUpperCase() === opNameNorm;
      const isVacant = !r.hours[op.hour];
      if (!isSameOp || !isVacant) continue;

      const rowWorkerNorm = (r.workerName || '').trim().toUpperCase();

      // Rule: If both have a worker name, only merge if worker names MATCH!
      // If names differ, NEVER merge (put into different row)
      if (workerNameNorm && rowWorkerNorm) {
        if (workerNameNorm === rowWorkerNorm) {
          targetRow = r;
          break;
        }
        // Different person doing same operation -> must be different row!
        continue;
      }

      // If existing row has no worker name yet, match if same table/operation number
      if (!rowWorkerNorm && r.operationNo === op.operation_no) {
        targetRow = r;
        if (workerNameNorm) {
          r.workerName = op.worker_name;
        }
        break;
      }

      // If op has no worker name, match if same table/operation number
      if (!workerNameNorm && (!rowWorkerNorm || r.operationNo === op.operation_no)) {
        targetRow = r;
        break;
      }
    }

    if (targetRow) {
      targetRow.hours[op.hour] = {
        workerName: op.worker_name,
        production: op.production,
        target: op.target,
      };
      if (!targetRow.workerName && op.worker_name) {
        targetRow.workerName = op.worker_name;
      }
    } else {
      rowsList.push({
        operationNo: op.operation_no,
        operationName: op.operation_name,
        workerName: op.worker_name || '',
        hours: {
          [op.hour]: {
            workerName: op.worker_name,
            production: op.production,
            target: op.target,
          },
        },
      });
    }
  });

  const sortedRows = [...rowsList].sort((a, b) => {
    if (a.operationNo !== b.operationNo) return a.operationNo - b.operationNo;
    if (a.operationName !== b.operationName) return a.operationName.localeCompare(b.operationName);
    return a.workerName.localeCompare(b.workerName);
  });

  return (
    <div className="w-full bg-white shadow-xs border border-slate-300 rounded-sm overflow-hidden">
      {/* Section Ribbon Bar with Detailed Color Tiers */}
      <div className="bg-[#184e68] text-white px-2.5 py-1 flex flex-wrap items-center justify-between gap-1.5 text-xs font-black tracking-wider uppercase">
        <span>Critical Operations Performance</span>
        <div className="flex items-center gap-2 text-[10px] font-semibold lowercase tracking-normal flex-wrap">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>&ge;100% green</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-300 inline-block"></span>80-99% yellow</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-300 inline-block"></span>60-79% lt. red</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>40-59% med. red</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-600 inline-block"></span>&lt;40% dark red</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-white border border-slate-400 inline-block"></span>0 white</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-center table-fixed border-collapse border border-slate-300 text-[10px] lg:text-[11px]">
          <thead>
            <tr className="bg-[#1b435b] text-white font-bold tracking-wide">
              <th className="w-[32px] px-1 py-1 border-r border-slate-400/40 font-bold">No.</th>
              <th className="w-[110px] px-2 py-1 text-left border-r border-slate-400/40 font-bold">
                Operation
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
              {/* Total Column Header */}
              <th className="w-[72px] px-0.5 py-1 border-l-2 border-slate-400/70 bg-[#12364c] text-cyan-200 font-black">
                <div className="flex flex-col items-center leading-none py-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider">TOTAL</span>
                  <span className="text-[8px] text-cyan-300/80 font-normal mt-0.5">Act / Tgt</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="text-slate-800 font-medium">
            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan={13} className="py-4 text-center text-slate-500 font-semibold italic text-xs">
                  No critical operations logged for this shift.
                </td>
              </tr>
            ) : (
              sortedRows.map((row, rowIndex) => {
                // Calculate row total across all 10 hours from box data
                let rowTotalProd = 0;
                let rowTotalTarget = 0;
                let hasActiveData = false;

                for (let h = 1; h <= 10; h++) {
                  const cell = row.hours[h];
                  if (cell && (cell.workerName || Number(cell.production) > 0 || Number(cell.target) > 0)) {
                    rowTotalProd += Number(cell.production) || 0;
                    rowTotalTarget += Number(cell.target) || 0;
                    hasActiveData = true;
                  }
                }

                const totalStyle = hasActiveData
                  ? getCriticalOpPerformanceStyle(rowTotalProd, rowTotalTarget)
                  : null;

                return (
                  <tr
                    key={`${row.operationNo}-${row.workerName}-${row.operationName}-${rowIndex}`}
                    className={`border-b border-slate-200 ${
                      rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                    } hover:bg-cyan-50/40 transition-colors`}
                  >
                    {/* Row No. */}
                    <td className="px-1 py-1 font-bold text-slate-700 bg-slate-100/60 border-r border-slate-200">
                      {row.operationNo}
                    </td>

                    {/* Operation Name (Compact) & Worker Name */}
                    <td className="px-1.5 py-1 text-left font-extrabold text-slate-900 border-r border-slate-200 uppercase tracking-tight truncate text-[10px]" title={`${row.operationName}${row.workerName ? ` (${row.workerName})` : ''}`}>
                      <div className="leading-tight">{row.operationName}</div>
                      {row.workerName && (
                        <div className="text-[8px] font-bold text-slate-500 capitalize tracking-normal truncate leading-tight mt-0.5">
                          {row.workerName}
                        </div>
                      )}
                    </td>

                    {/* 10 Hourly Cells */}
                    {Array.from({ length: 10 }, (_, i) => {
                      const hourNum = i + 1;
                      const cell = row.hours[hourNum];

                      if (!cell || !cell.workerName) {
                        return (
                          <td key={hourNum} className="px-0.5 py-1 border-r border-slate-200 text-slate-300">
                            -
                          </td>
                        );
                      }

                      const style = getCriticalOpPerformanceStyle(cell.production, cell.target);

                      return (
                        <td
                          key={hourNum}
                          className="p-0.5 border-r border-slate-200 text-center leading-tight"
                        >
                          <div
                            className={`flex flex-col items-center justify-center p-0.5 rounded border shadow-2xs transition-colors ${style.boxClass}`}
                            title={`${cell.workerName}: ${cell.production}/${cell.target} (${style.pct}%)`}
                          >
                            <span className="text-[9px] font-black uppercase tracking-tight truncate max-w-full">
                              {cell.workerName}
                            </span>
                            <div className="mt-0.2 text-[10px] font-black industrial-digits flex items-center gap-0.5">
                              <span className={style.prodColor}>
                                {cell.production}
                              </span>
                              <span className="opacity-40 font-normal">/</span>
                              <span className="opacity-75 font-bold">{cell.target}</span>
                            </div>
                          </div>
                        </td>
                      );
                    })}

                    {/* Total in Last Column (Complete / Actual Target) */}
                    <td className="p-0.5 border-l-2 border-slate-300 text-center leading-tight bg-slate-100/50">
                      {hasActiveData && totalStyle ? (
                        <div
                          className={`flex flex-col items-center justify-center p-0.5 rounded border shadow-2xs transition-colors ${totalStyle.boxClass}`}
                          title={`Total Output: ${rowTotalProd} completed / ${rowTotalTarget} target (${totalStyle.pct}%)`}
                        >
                          <span className="text-[8px] font-black uppercase tracking-tight truncate max-w-full">
                            {totalStyle.pct}%
                          </span>
                          <div className="mt-0.2 text-[10px] font-black industrial-digits flex items-center gap-0.5">
                            <span className={totalStyle.prodColor}>
                              {rowTotalProd}
                            </span>
                            <span className="opacity-40 font-normal">/</span>
                            <span className="opacity-75 font-bold">{rowTotalTarget}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-300 font-bold text-[10px]">-</span>
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
