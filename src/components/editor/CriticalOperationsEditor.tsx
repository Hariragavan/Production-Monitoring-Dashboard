import React, { useState, useEffect } from 'react';
import type { CriticalOperation } from '../../types';
import { Plus, Trash2, Users, Copy, CheckCircle2, Clock } from 'lucide-react';
import { getAvailableWorkers, type WorkerItem } from '../../lib/dataService';

interface CriticalOperationsEditorProps {
  operations: CriticalOperation[];
  onChange: (ops: CriticalOperation[]) => void;
  unitName?: string;
}

const STANDARD_OPERATIONS = [
  'SLEEVE ATTACH',
  'SIDE SEAM',
  'NECK RIB ATTACH',
  'BOTTOM HEM',
  'COLLAR ATTACH',
  'CUFF ATTACH',
  'POCKET ATTACH',
  'BUTTON STITCH',
  'SHOULDER JOIN',
  'LABEL ATTACH',
  'OVERLOCK',
  'FLATLOCK',
];

export const CriticalOperationsEditor: React.FC<CriticalOperationsEditorProps> = ({
  operations,
  onChange,
  unitName = 'Unit 01',
}) => {
  const [activeHour, setActiveHour] = useState<number>(1);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [availableWorkers, setAvailableWorkers] = useState<WorkerItem[]>(() => getAvailableWorkers(unitName));

  useEffect(() => {
    setAvailableWorkers(getAvailableWorkers(unitName));
    const handleWorkersUpdated = (e: any) => {
      if (e.detail?.workers && (!e.detail?.unitName || e.detail?.unitName === unitName)) {
        setAvailableWorkers(e.detail.workers);
      }
    };
    window.addEventListener('production-workers-updated', handleWorkersUpdated);
    return () => window.removeEventListener('production-workers-updated', handleWorkersUpdated);
  }, [unitName]);

  // Suffix helper
  const getSuffix = (h: number) => {
    if (h === 1) return 'st';
    if (h === 2) return 'nd';
    if (h === 3) return 'rd';
    return 'th';
  };

  // Filter operations for current active hour
  const currentHourOps = operations
    .filter((op) => op.hour === activeHour)
    .sort((a, b) => a.operation_no - b.operation_no);

  // Compute total output and target for this hour
  const hourTotalActual = currentHourOps.reduce((sum, op) => sum + (Number(op.production) || 0), 0);
  const hourTotalTarget = currentHourOps.reduce((sum, op) => sum + (Number(op.target) || 0), 0);
  const hourEfficiency = hourTotalTarget > 0 ? Math.round((hourTotalActual / hourTotalTarget) * 100) : 0;

  // Handlers for modifying operations for this specific hour
  const handleUpdateField = (
    opId: string | undefined,
    field: keyof CriticalOperation,
    value: any
  ) => {
    const updated = operations.map((op) => {
      if (op.id === opId) {
        const changed = { ...op, [field]: value };
        if (field === 'production' || field === 'target') {
          const prod = field === 'production' ? Number(value) : op.production;
          const tgt = field === 'target' ? Number(value) : op.target;
          changed.completed = prod >= tgt;
          changed.status = prod >= tgt ? 'completed' : 'in_progress';
        }
        if (field === 'worker_name') {
          const foundWorker = availableWorkers.find((w) => w.name === value);
          if (foundWorker) {
            changed.worker_id = foundWorker.id;
          }
        }
        return changed;
      }
      return op;
    });
    onChange(updated);
  };

  // Add new operation for this hour
  const handleAddOpForHour = () => {
    const nextNo =
      currentHourOps.length > 0
        ? Math.max(...currentHourOps.map((o) => o.operation_no)) + 1
        : 1;

    const defaultWorker = availableWorkers[(nextNo - 1) % availableWorkers.length] || { name: 'WORKER', id: 'EMP-01' };
    const defaultOp = STANDARD_OPERATIONS[(nextNo - 1) % STANDARD_OPERATIONS.length];

    const newOp: CriticalOperation = {
      id: `co-${nextNo}-${activeHour}-${Date.now()}`,
      operation_no: nextNo,
      operation_name: defaultOp,
      worker_name: defaultWorker.name,
      worker_id: defaultWorker.id,
      hour: activeHour,
      production: 40,
      target: 40,
      completed: true,
      status: 'completed',
    };

    onChange([...operations, newOp]);
  };

  // Delete operation from this hour
  const handleDeleteOp = (opId: string | undefined) => {
    const updated = operations.filter((op) => op.id !== opId);
    onChange(updated);
  };

  // Copy operations roster from previous hour (or Hour 1) to activeHour
  const handleCopyFromHour = (sourceHour: number) => {
    const sourceOps = operations.filter((op) => op.hour === sourceHour);
    if (sourceOps.length === 0) return;

    // Remove existing ops for activeHour
    const otherOps = operations.filter((op) => op.hour !== activeHour);

    // Clone source ops with activeHour and initial production
    const clonedOps: CriticalOperation[] = sourceOps.map((op) => ({
      ...op,
      id: `co-${op.operation_no}-${activeHour}-${Date.now()}`,
      hour: activeHour,
      production: op.production,
      target: op.target,
      completed: op.production >= op.target,
    }));

    onChange([...otherOps, ...clonedOps]);
    setCopyFeedback(`✓ Copied ${clonedOps.length} operators from ${sourceHour}${getSuffix(sourceHour)} Hour!`);
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  // Copy active hour roster to ALL future hours
  const handleApplyToAllHours = () => {
    if (currentHourOps.length === 0) return;

    // Filter out all hours from activeHour + 1 through 10
    const remainingOps = operations.filter((op) => op.hour <= activeHour);

    const futureOps: CriticalOperation[] = [];
    for (let h = activeHour + 1; h <= 10; h++) {
      currentHourOps.forEach((op) => {
        futureOps.push({
          ...op,
          id: `co-${op.operation_no}-${h}-${Date.now()}`,
          hour: h,
        });
      });
    }

    onChange([...remainingOps, ...futureOps]);
    setCopyFeedback(`✓ Applied ${activeHour}${getSuffix(activeHour)} Hour roster to all remaining hours!`);
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm space-y-5">
      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-700" />
            <span>Hourly Critical Operations &amp; Worker Assignments</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Workers can change between sections hourly. Select any hour below to assign workers and log pieces produced.
          </p>
        </div>

        {copyFeedback && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-300 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{copyFeedback}</span>
          </div>
        )}
      </div>

      {/* 10-HOUR SELECTOR BUTTON STRIP */}
      <div>
        <span className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
          Select Shift Hour to View &amp; Edit:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-1.5">
          {Array.from({ length: 10 }, (_, i) => {
            const hourNum = i + 1;
            const suffix = getSuffix(hourNum);
            const isSelected = activeHour === hourNum;
            const hourOpsCount = operations.filter((op) => op.hour === hourNum).length;
            const hourOutput = operations
              .filter((op) => op.hour === hourNum)
              .reduce((s, op) => s + (Number(op.production) || 0), 0);

            return (
              <button
                key={hourNum}
                type="button"
                onClick={() => setActiveHour(hourNum)}
                className={`px-2 py-2 rounded-lg border text-center transition cursor-pointer flex flex-col items-center justify-between ${
                  isSelected
                    ? 'bg-[#134665] text-white border-[#0f3852] shadow-sm ring-2 ring-cyan-500/50'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Clock className={`w-3 h-3 ${isSelected ? 'text-cyan-300' : 'text-slate-400'}`} />
                  <span className="font-extrabold text-xs">{hourNum}{suffix} Hr</span>
                </div>
                <div className="mt-1 text-[10px] font-semibold">
                  <span className={isSelected ? 'text-cyan-200' : 'text-slate-500'}>
                    {hourOpsCount} Ops &bull; {hourOutput} pcs
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTIVE HOUR SUMMARY BAR & ACTION CONTROLS */}
      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-[10px] font-black text-cyan-800 uppercase tracking-wider block">
              Currently Editing
            </span>
            <span className="text-base font-black text-slate-900">
              {activeHour}{getSuffix(activeHour)} Shift Hour
            </span>
          </div>

          <div className="h-8 w-px bg-slate-300 hidden sm:block"></div>

          <div className="flex items-center gap-4 text-xs font-bold text-slate-700">
            <div>
              <span className="text-slate-400 text-[10px] block uppercase">Hour Target:</span>
              <span className="industrial-digits font-black text-slate-900">{hourTotalTarget} PCS</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block uppercase">Actual Output:</span>
              <span className="industrial-digits font-black text-[#0f4c6e]">{hourTotalActual} PCS</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block uppercase">Efficiency:</span>
              <span
                className={`industrial-digits font-black px-1.5 py-0.2 rounded text-[11px] ${
                  hourEfficiency >= 100
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                {hourEfficiency}%
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Copy from previous hour */}
          {activeHour > 1 && (
            <button
              type="button"
              onClick={() => handleCopyFromHour(activeHour - 1)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs"
              title={`Copy operators from ${activeHour - 1}${getSuffix(activeHour - 1)} Hour`}
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Copy from {activeHour - 1}{getSuffix(activeHour - 1)} Hr</span>
            </button>
          )}

          {/* Copy from Hour 1 if activeHour is not 1 and currently empty */}
          {activeHour > 1 && currentHourOps.length === 0 && (
            <button
              type="button"
              onClick={() => handleCopyFromHour(1)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-sky-600" />
              <span>Copy from 1st Hr</span>
            </button>
          )}

          {/* Apply this roster to subsequent hours */}
          {currentHourOps.length > 0 && activeHour < 10 && (
            <button
              type="button"
              onClick={handleApplyToAllHours}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer"
              title="Apply this exact operator roster to all remaining hours"
            >
              <Copy className="w-3.5 h-3.5 text-amber-600" />
              <span>Apply to Next Hours</span>
            </button>
          )}

          {/* Add Operation for this Hour */}
          <button
            type="button"
            onClick={handleAddOpForHour}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-xs font-black uppercase tracking-wider shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Operator</span>
          </button>
        </div>
      </div>

      {/* OPERATIONS TABLE FOR THE ACTIVE HOUR */}
      {currentHourOps.length === 0 ? (
        <div className="p-10 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center flex flex-col items-center justify-center gap-3">
          <Users className="w-10 h-10 text-slate-300" />
          <div>
            <h4 className="text-sm font-bold text-slate-800">
              No operators assigned for {activeHour}{getSuffix(activeHour)} Hour yet
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Add operations from scratch or copy the assigned operators from Hour 1 with a single click.
            </p>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={() => handleCopyFromHour(1)}
              className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
            >
              📋 Copy Roster from 1st Hour
            </button>
            <button
              type="button"
              onClick={handleAddOpForHour}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              + Add New Operation
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-slate-300 text-xs">
            <thead>
              <tr className="bg-[#134665] text-white font-bold uppercase tracking-wider">
                <th className="px-3 py-2.5 border-r border-slate-400/40 text-center w-12">#</th>
                <th className="px-3 py-2.5 border-r border-slate-400/40 min-w-[180px]">Operation Name</th>
                <th className="px-3 py-2.5 border-r border-slate-400/40 min-w-[160px]">Assigned Worker</th>
                <th className="px-3 py-2.5 border-r border-slate-400/40 text-center min-w-[90px]">Worker ID</th>
                <th className="px-3 py-2.5 border-r border-slate-400/40 text-center min-w-[100px] bg-[#0d344d] text-cyan-200">
                  Target Op. (PCS)
                </th>
                <th className="px-3 py-2.5 border-r border-slate-400/40 text-center min-w-[120px] bg-[#0d344d] text-emerald-300">
                  Actual Output / How Many (PCS)
                </th>
                <th className="px-3 py-2.5 border-r border-slate-400/40 text-center min-w-[100px]">Achievement</th>
                <th className="px-2 py-2.5 text-center w-10">Del</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 font-medium">
              {currentHourOps.map((op, index) => {
                const target = Number(op.target) || 40;
                const prod = Number(op.production) || 0;
                const efficiency = target > 0 ? Math.round((prod / target) * 100) : 0;
                const isMet = prod >= target;
                const dev = prod - target;

                return (
                  <tr key={op.id || index} className="hover:bg-slate-50 transition-colors">
                    {/* Operation Number */}
                    <td className="px-3 py-2.5 border-r border-slate-200 text-center font-black bg-slate-50">
                      <span className="w-5 h-5 rounded-full bg-[#134665] text-white text-[10px] font-black inline-flex items-center justify-center">
                        {op.operation_no}
                      </span>
                    </td>

                    {/* Operation Name Dropdown */}
                    <td className="px-3 py-2.5 border-r border-slate-200">
                      <select
                        value={op.operation_name}
                        onChange={(e) => handleUpdateField(op.id, 'operation_name', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-bold text-slate-900 text-xs focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none cursor-pointer"
                      >
                        {STANDARD_OPERATIONS.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                        {!STANDARD_OPERATIONS.includes(op.operation_name) && (
                          <option value={op.operation_name}>{op.operation_name}</option>
                        )}
                      </select>
                    </td>

                    {/* Worker / Operator Dropdown */}
                    <td className="px-3 py-2.5 border-r border-slate-200">
                      <select
                        value={op.worker_name}
                        onChange={(e) => handleUpdateField(op.id, 'worker_name', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-bold text-slate-900 text-xs focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none cursor-pointer"
                      >
                        {availableWorkers.map((w) => (
                          <option key={w.id} value={w.name}>
                            {w.name} ({w.id})
                          </option>
                        ))}
                        {!availableWorkers.some((w) => w.name === op.worker_name) && (
                          <option value={op.worker_name}>{op.worker_name}</option>
                        )}
                      </select>
                    </td>

                    {/* Worker ID (editable/auto-filled) */}
                    <td className="px-3 py-2.5 border-r border-slate-200 text-center font-mono text-slate-600">
                      <input
                        type="text"
                        value={op.worker_id || ''}
                        onChange={(e) => handleUpdateField(op.id, 'worker_id', e.target.value)}
                        className="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-center text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-cyan-500 outline-none"
                      />
                    </td>

                    {/* Target Op. Input */}
                    <td className="px-3 py-2.5 border-r border-slate-200 text-center bg-cyan-50/40">
                      <input
                        type="number"
                        min="0"
                        value={op.target === 0 ? '' : op.target}
                        placeholder="0"
                        onChange={(e) =>
                          handleUpdateField(op.id, 'target', e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0))
                        }
                        className="w-16 px-2 py-1.5 text-center bg-white border border-cyan-400 rounded-md font-black text-cyan-900 industrial-digits text-xs focus:ring-2 focus:ring-cyan-500 outline-none"
                      />
                    </td>

                    {/* Actual Output / How Many Input */}
                    <td className="px-3 py-2.5 border-r border-slate-200 text-center bg-emerald-50/40">
                      <input
                        type="number"
                        min="0"
                        value={op.production === 0 ? '' : op.production}
                        placeholder="0"
                        onChange={(e) =>
                          handleUpdateField(op.id, 'production', e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0))
                        }
                        className={`w-20 px-2.5 py-1.5 text-center rounded-md font-black text-sm industrial-digits outline-none transition-all ${
                          prod === 0
                            ? 'bg-white border border-slate-300 text-slate-400'
                            : isMet
                            ? 'bg-emerald-100 border border-emerald-500 text-emerald-950'
                            : 'bg-rose-100 border border-rose-400 text-rose-950'
                        } focus:ring-2 focus:ring-cyan-500`}
                      />
                    </td>

                    {/* Achievement % Badge */}
                    <td className="px-3 py-2.5 border-r border-slate-200 text-center">
                      <div className="flex flex-col items-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-black industrial-digits ${
                            isMet
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {efficiency}%
                        </span>
                        <span
                          className={`text-[9px] font-bold mt-0.5 ${
                            dev >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {dev >= 0 ? `▲+${dev}` : `▼${dev}`}
                        </span>
                      </div>
                    </td>

                    {/* Delete Row */}
                    <td className="px-2 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteOp(op.id)}
                        title={`Remove Operation #${op.operation_no} from ${activeHour}${getSuffix(activeHour)} Hour`}
                        className="p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Table Footer Summary for Active Hour */}
            <tfoot>
              <tr className="bg-slate-100 font-black border-t-2 border-slate-300 text-slate-900">
                <td colSpan={4} className="px-3 py-2.5 text-right font-black uppercase text-xs text-slate-700">
                  {activeHour}{getSuffix(activeHour)} Hour Total:
                </td>
                <td className="px-3 py-2.5 text-center font-black industrial-digits text-xs text-cyan-900 bg-cyan-100/50 border-r border-slate-300">
                  {hourTotalTarget} PCS
                </td>
                <td className="px-3 py-2.5 text-center font-black industrial-digits text-sm text-[#0f4c6e] bg-emerald-100/50 border-r border-slate-300">
                  {hourTotalActual} PCS
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-black industrial-digits ${
                      hourEfficiency >= 100
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {hourEfficiency}%
                  </span>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};
