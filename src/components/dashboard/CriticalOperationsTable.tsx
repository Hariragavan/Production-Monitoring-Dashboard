import React from 'react';
import type { CriticalOperation } from '../../types';
import { Activity } from 'lucide-react';

interface CriticalOperationsTableProps {
  operations?: CriticalOperation[];
}

interface GroupedRow {
  operationNo: number;
  operationName: string;
  hours: Record<number, { workerName: string; production: number; target: number }>;
}

export const CriticalOperationsTable: React.FC<CriticalOperationsTableProps> = ({ operations }) => {
  const effectiveOps = operations || [];

  if (effectiveOps.length === 0) {
    return (
      <div className="w-full bg-white shadow-xs border border-slate-300 rounded-sm overflow-hidden">
        <div className="bg-[#184e68] text-white px-2.5 py-1 flex items-center justify-between text-xs font-black tracking-wider uppercase">
          <span>Critical Operations Performance</span>
          <span className="text-[10px] text-cyan-200 font-semibold lowercase tracking-normal">
            (green: ahead &bull; yellow: on target &bull; red: below target)
          </span>
        </div>
        <div className="p-5 text-center text-slate-400 font-bold text-xs flex flex-col items-center justify-center gap-1.5">
          <Activity className="w-5 h-5 text-slate-300" />
          <span>No critical operations recorded yet. Go to Edit Page to add operation entries.</span>
        </div>
      </div>
    );
  }

  // Group operations by operation_no
  const rowsMap = new Map<number, GroupedRow>();

  effectiveOps.forEach((op) => {
    if (!rowsMap.has(op.operation_no)) {
      rowsMap.set(op.operation_no, {
        operationNo: op.operation_no,
        operationName: op.operation_name,
        hours: {},
      });
    }
    const row = rowsMap.get(op.operation_no)!;
    row.hours[op.hour] = {
      workerName: op.worker_name,
      production: op.production,
      target: op.target,
    };
  });

  const sortedRows = Array.from(rowsMap.values()).sort((a, b) => a.operationNo - b.operationNo);

  return (
    <div className="w-full bg-white shadow-xs border border-slate-300 rounded-sm overflow-hidden">
      {/* Section Ribbon Bar */}
      <div className="bg-[#184e68] text-white px-2.5 py-1 flex items-center justify-between text-xs font-black tracking-wider uppercase">
        <span>Critical Operations Performance</span>
        <span className="text-[10px] text-cyan-200 font-semibold lowercase tracking-normal">
          (green: ahead &bull; yellow: on target &bull; red: below target)
        </span>
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
            </tr>
          </thead>
          <tbody className="text-slate-800 font-medium">
            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-4 text-center text-slate-500 font-semibold italic text-xs">
                  No critical operations logged for this shift.
                </td>
              </tr>
            ) : (
              sortedRows.map((row, rowIndex) => {
                return (
                  <tr
                    key={row.operationNo}
                    className={`border-b border-slate-200 ${
                      rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                    } hover:bg-cyan-50/40 transition-colors`}
                  >
                    {/* Row No. */}
                    <td className="px-1 py-1 font-bold text-slate-700 bg-slate-100/60 border-r border-slate-200">
                      {row.operationNo}
                    </td>

                    {/* Operation Name (Compact) */}
                    <td className="px-1.5 py-1 text-left font-extrabold text-slate-900 border-r border-slate-200 uppercase tracking-tight truncate text-[10px]" title={row.operationName}>
                      {row.operationName}
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

                      const isAhead = cell.production > cell.target;
                      const isEqual = cell.production === cell.target;

                      let boxClass = 'bg-rose-100/90 border-rose-300 text-rose-950';
                      let prodColor = 'text-rose-700 font-black';

                      if (isAhead) {
                        boxClass = 'bg-emerald-100/90 border-emerald-300 text-emerald-950';
                        prodColor = 'text-emerald-700 font-black';
                      } else if (isEqual) {
                        boxClass = 'bg-amber-100/90 border-amber-300 text-amber-950';
                        prodColor = 'text-amber-800 font-black';
                      }

                      return (
                        <td
                          key={hourNum}
                          className="p-0.5 border-r border-slate-200 text-center leading-tight"
                        >
                          <div className={`flex flex-col items-center justify-center p-0.5 rounded border shadow-2xs transition-colors ${boxClass}`}>
                            <span className="text-[9px] font-black uppercase tracking-tight truncate max-w-full">
                              {cell.workerName}
                            </span>
                            <div className="mt-0.2 text-[10px] font-black industrial-digits flex items-center gap-0.5">
                              <span className={prodColor}>
                                {cell.production}
                              </span>
                              <span className="opacity-40 font-normal">/</span>
                              <span className="opacity-75 font-bold">{cell.target}</span>
                            </div>
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
