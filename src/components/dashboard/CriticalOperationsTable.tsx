import React from 'react';
import type { CriticalOperation } from '../../types';

interface CriticalOperationsTableProps {
  operations: CriticalOperation[];
}

interface GroupedRow {
  operationNo: number;
  operationName: string;
  hours: Record<number, { workerName: string; production: number; target: number }>;
}

export const CriticalOperationsTable: React.FC<CriticalOperationsTableProps> = ({ operations }) => {
  // Group operations by operation_no
  const rowsMap = new Map<number, GroupedRow>();

  // Ensure default structure if operations are provided or empty
  operations.forEach((op) => {
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
    <div className="w-full bg-white shadow-sm border border-slate-300 rounded-sm overflow-hidden mt-3">
      {/* Section Ribbon Bar */}
      <div className="bg-[#184e68] text-white px-3 py-1.5 flex items-center justify-between text-xs lg:text-sm font-black tracking-wider uppercase">
        <span>Critical Operations Performance</span>
        <span className="text-[11px] text-cyan-200 font-semibold lowercase tracking-normal">
          (green: met/exceeded target &bull; red: below target)
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-center table-fixed border-collapse border border-slate-300">
          <thead>
            <tr className="bg-[#1b435b] text-white text-[11px] lg:text-xs font-bold tracking-wide">
              {/* Vertical section label space */}
              <th className="w-[36px] bg-[#123043] border-r border-slate-400/40 p-1"></th>
              <th className="w-[42px] px-1 py-1.5 border-r border-slate-400/40 font-bold">No.</th>
              <th className="w-[170px] min-w-[140px] px-2 py-1.5 text-left border-r border-slate-400/40 font-bold">
                Operation
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
            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan={13} className="py-6 text-center text-slate-500 font-semibold italic">
                  No critical operations logged for this shift. Click "Edit Data" to add operations.
                </td>
              </tr>
            ) : (
              sortedRows.map((row, rowIndex) => {
                const isFirstRow = rowIndex === 0;
                return (
                  <tr
                    key={row.operationNo}
                    className={`border-b border-slate-300 ${
                      rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                    } hover:bg-cyan-50/40 transition-colors`}
                  >
                    {/* Left vertical banner spanning all rows */}
                    {isFirstRow && (
                      <td
                        rowSpan={sortedRows.length}
                        className="bg-[#123043] text-cyan-200 font-black text-[11px] uppercase tracking-widest text-center border-r border-slate-300 p-1 select-none"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      >
                        Critical Operations
                      </td>
                    )}

                    {/* Row No. */}
                    <td className="px-1 py-2 font-bold text-slate-700 bg-slate-100/60 border-r border-slate-300">
                      {row.operationNo}
                    </td>

                    {/* Operation Name */}
                    <td className="px-2 py-2 text-left font-extrabold text-slate-900 border-r border-slate-300 uppercase tracking-tight truncate text-[11px] lg:text-xs">
                      {row.operationName}
                    </td>

                    {/* 10 Hourly Cells */}
                    {Array.from({ length: 10 }, (_, i) => {
                      const hourNum = i + 1;
                      const cell = row.hours[hourNum];

                      if (!cell || !cell.workerName) {
                        return (
                          <td key={hourNum} className="px-1 py-2 border-r border-slate-200 text-slate-300">
                            -
                          </td>
                        );
                      }

                      const metTarget = cell.production >= cell.target;

                      return (
                        <td
                          key={hourNum}
                          className="px-1 py-1.5 border-r border-slate-300 text-center leading-tight"
                        >
                          <div className="flex flex-col items-center justify-center">
                            <span className="text-[10px] lg:text-[11px] font-bold text-slate-800 tracking-wider truncate max-w-full">
                              {cell.workerName}
                            </span>
                            <div className="mt-0.5 text-xs font-black industrial-digits flex items-center gap-0.5">
                              <span className={metTarget ? 'text-emerald-600 font-extrabold' : 'text-rose-600 font-extrabold'}>
                                {cell.production}
                              </span>
                              <span className="text-slate-400 font-normal">/</span>
                              <span className="text-slate-600 font-bold">{cell.target}</span>
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
