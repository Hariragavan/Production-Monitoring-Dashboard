import React, { useState, useEffect } from 'react';
import type { CriticalOperation } from '../../types';
import { Plus, Trash2, Users, Copy, CheckCircle2, Clock, X, Check } from 'lucide-react';
import {
  getAvailableWorkers,
  syncWorkersFromSupabase,
  getAvailableOperations,
  addCustomOperation,
  syncOperationsFromSupabase,
  type WorkerItem,
} from '../../lib/dataService';
import { getCriticalOpPerformanceStyle } from '../dashboard/CriticalOperationsTable';

interface CriticalOperationsEditorProps {
  operations: CriticalOperation[];
  onChange: (ops: CriticalOperation[]) => void;
  unitName?: string;
}

const DEFAULT_OP_SEQUENCE = [
  'SHOULDER TOP STITCH',
  'BOTTOM RIB ATTACH',
  'SLEEVE ATTACH',
  'SLEEVE ATTACH',
  'SIDE SEAM',
  'SHOULDER ATTACH',
  'SHOULDER ATTACH',
  'BOTTOM RIB TOP STITCH',
  'SLEEVE TOP STITCH',
  'NECK TOP STITCH',
];

export const CriticalOperationsEditor: React.FC<CriticalOperationsEditorProps> = ({
  operations,
  onChange,
  unitName = 'Unit 01',
}) => {
  const [activeHour, setActiveHour] = useState<number>(1);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [opFeedback, setOpFeedback] = useState<string | null>(null);
  const [availableWorkers, setAvailableWorkers] = useState<WorkerItem[]>(() => getAvailableWorkers(unitName));
  const [availableOperations, setAvailableOperations] = useState<string[]>(getAvailableOperations);
  const [showNewOpModal, setShowNewOpModal] = useState<boolean>(false);
  const [newOpInput, setNewOpInput] = useState<string>('');
  const [targetOpIdForNew, setTargetOpIdForNew] = useState<string | null>(null);
  const [isSavingOp, setIsSavingOp] = useState<boolean>(false);

  useEffect(() => {
    // 1. Sync Workers
    setAvailableWorkers(getAvailableWorkers(unitName));
    syncWorkersFromSupabase(unitName).then((synced) => {
      if (synced && synced.length > 0) {
        setAvailableWorkers(synced);
      }
    });
    const handleWorkersUpdated = (e: any) => {
      if (e.detail?.workers && e.detail.workers.length > 0) {
        setAvailableWorkers(e.detail.workers);
      }
    };
    window.addEventListener('production-workers-updated', handleWorkersUpdated);

    // 2. Sync Custom Operations
    setAvailableOperations(getAvailableOperations());
    syncOperationsFromSupabase().then((synced) => {
      if (synced && synced.length > 0) {
        setAvailableOperations(synced);
      }
    });
    const handleOperationsUpdated = (e: any) => {
      if (e.detail?.operations && e.detail.operations.length > 0) {
        setAvailableOperations(e.detail.operations);
      }
    };
    window.addEventListener('production-operations-updated', handleOperationsUpdated);

    return () => {
      window.removeEventListener('production-workers-updated', handleWorkersUpdated);
      window.removeEventListener('production-operations-updated', handleOperationsUpdated);
    };
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

  // Enforce unique table numbers in activeHour so no two operations ever share the same table number
  useEffect(() => {
    const opsInHour = operations.filter((op) => op.hour === activeHour);
    const seen = new Set<number>();
    let hasDuplicate = false;
    for (const op of opsInHour) {
      if (seen.has(op.operation_no)) {
        hasDuplicate = true;
        break;
      }
      seen.add(op.operation_no);
    }

    if (hasDuplicate) {
      const used = new Set<number>();
      let changed = false;
      const fixedOps = operations.map((op) => {
        if (op.hour !== activeHour) return op;
        if (!used.has(op.operation_no)) {
          used.add(op.operation_no);
          return op;
        }
        // Assign next lowest unused table number
        let nextNo = 1;
        while (used.has(nextNo)) nextNo++;
        used.add(nextNo);
        changed = true;
        return { ...op, operation_no: nextNo };
      });
      if (changed) {
        onChange(fixedOps);
      }
    }
  }, [activeHour, operations]);

  // Update Table # with automatic swapping: No two operations in this hour can ever have the same table number!
  const handleUpdateTableNo = (opId: string | undefined, newTableNo: number) => {
    const currentOp = operations.find((o) => o.id === opId);
    if (!currentOp) return;
    const oldTableNo = currentOp.operation_no;
    if (oldTableNo === newTableNo) return;

    // Check if another operation in this active hour already uses newTableNo
    const conflictingOp = operations.find(
      (o) => o.id !== opId && o.hour === activeHour && o.operation_no === newTableNo
    );

    const updated = operations.map((o) => {
      if (o.id === opId) {
        return { ...o, operation_no: newTableNo };
      }
      if (conflictingOp && o.id === conflictingOp.id) {
        // Swap: Give conflicting op the old table number so both operations have unique numbers
        return { ...o, operation_no: oldTableNo };
      }
      return o;
    });

    onChange(updated);

    if (conflictingOp) {
      setOpFeedback(
        `✓ Swapped: Table #${newTableNo} (${currentOp.operation_name || 'Op'}) ⇄ Table #${oldTableNo} (${conflictingOp.operation_name || 'Op'})`
      );
    } else {
      setOpFeedback(`✓ Assigned Table #${newTableNo} to ${currentOp.operation_name || 'Operation'}`);
    }
    setTimeout(() => setOpFeedback(null), 3500);
  };

  // Add & Save new operation to Supabase & localStorage
  const handleSaveNewOperation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newOpInput.trim();
    if (!trimmed) return;

    setIsSavingOp(true);
    try {
      const res = await addCustomOperation(trimmed);
      if (res.success) {
        setAvailableOperations(res.operations);
        // If a specific row triggered the creation, set that row's operation_name to the new op
        if (targetOpIdForNew) {
          handleUpdateField(targetOpIdForNew, 'operation_name', trimmed.toUpperCase());
        }
        setOpFeedback(`✓ Operation "${trimmed.toUpperCase()}" added & saved to database!`);
        setTimeout(() => setOpFeedback(null), 3500);
        setShowNewOpModal(false);
        setNewOpInput('');
        setTargetOpIdForNew(null);
      } else if (res.error) {
        alert(res.error);
      }
    } catch (err: any) {
      console.error('Error adding operation:', err);
    } finally {
      setIsSavingOp(false);
    }
  };

  // Add new operation for this hour with guaranteed unique Table Number
  const handleAddOpForHour = () => {
    // 1. Collect all table numbers currently used in this active hour
    const currentHourTableNumbers = new Set(
      operations.filter((o) => o.hour === activeHour).map((o) => o.operation_no)
    );

    // 2. Find the lowest unused table number starting from 1 (Guarantees no two operations share table number)
    let nextTableNo = 1;
    while (currentHourTableNumbers.has(nextTableNo)) {
      nextTableNo++;
    }

    // 3. Pre-fill template details if this slot exists in other hours
    const templateOp = operations.find((o) => o.operation_no === nextTableNo);
    const defaultWorker = availableWorkers[(nextTableNo - 1) % availableWorkers.length] || { name: 'WORKER', id: 'EMP-01' };
    const opPool = availableOperations.length > 0 ? availableOperations : DEFAULT_OP_SEQUENCE;
    const defaultOp = templateOp?.operation_name || opPool[(nextTableNo - 1) % opPool.length];
    const defaultTarget = templateOp?.target !== undefined ? templateOp.target : 40;
    const defaultWorkerName = templateOp?.worker_name || defaultWorker.name;
    const defaultWorkerId = templateOp?.worker_id || defaultWorker.id;

    const newOp: CriticalOperation = {
      id: `co-${nextTableNo}-${activeHour}-${Date.now()}`,
      operation_no: nextTableNo,
      operation_name: defaultOp,
      worker_name: defaultWorkerName,
      worker_id: defaultWorkerId,
      hour: activeHour,
      production: 0,
      target: defaultTarget,
      completed: false,
      status: 'in_progress',
    };

    onChange([...operations, newOp]);
    setOpFeedback(`✓ Added Operation at Table #${nextTableNo}`);
    setTimeout(() => setOpFeedback(null), 3000);
  };

  // Reconcile and align rows without merging different workers into the same table
  const handleAutoAlignRows = () => {
    // Base roster is keyed by BOTH operation_name AND worker_name!
    const baseRoster: { operation_no: number; operation_name: string; worker_name: string }[] = [];
    for (let h = 1; h <= 10; h++) {
      const opsAtHour = operations.filter((o) => o.hour === h).sort((a, b) => a.operation_no - b.operation_no);
      opsAtHour.forEach((op) => {
        if (!baseRoster.some((b) => b.operation_no === op.operation_no)) {
          baseRoster.push({
            operation_no: op.operation_no,
            operation_name: op.operation_name,
            worker_name: op.worker_name,
          });
        }
      });
    }

    baseRoster.sort((a, b) => a.operation_no - b.operation_no);

    let changedCount = 0;
    const aligned = operations.map((op) => {
      // If op.operation_no already matches base slot with same operation AND same worker name, keep it
      const exactBase = baseRoster.find((b) => b.operation_no === op.operation_no);
      if (
        exactBase &&
        exactBase.operation_name.trim().toUpperCase() === op.operation_name.trim().toUpperCase() &&
        (!op.worker_name || exactBase.worker_name.trim().toUpperCase() === op.worker_name.trim().toUpperCase())
      ) {
        return op;
      }

      // Look for a base slot with matching operation_name AND matching worker where this hour is vacant
      const targetSlot = baseRoster.find((b) => {
        if (b.operation_name.trim().toUpperCase() !== op.operation_name.trim().toUpperCase()) return false;
        // User rule: Only merge if SAME worker name; different worker names must NEVER share table number!
        if (op.worker_name && b.worker_name && b.worker_name.trim().toUpperCase() !== op.worker_name.trim().toUpperCase()) {
          return false;
        }
        const isTaken = operations.some((other) => other.id !== op.id && other.hour === op.hour && other.operation_no === b.operation_no);
        return !isTaken;
      });

      if (targetSlot && targetSlot.operation_no !== op.operation_no) {
        changedCount++;
        return { ...op, operation_no: targetSlot.operation_no };
      }

      return op;
    });

    if (changedCount > 0) {
      onChange(aligned);
      setOpFeedback(`✓ Successfully aligned ${changedCount} operation(s) into their matching tables!`);
      setTimeout(() => setOpFeedback(null), 4000);
    } else {
      setOpFeedback(`✓ All operations are already properly aligned with their tables.`);
      setTimeout(() => setOpFeedback(null), 3000);
    }
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

        <div className="flex items-center gap-2">
          {opFeedback && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-cyan-100 text-cyan-900 rounded-lg text-xs font-bold border border-cyan-300 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-cyan-600" />
              <span>{opFeedback}</span>
            </div>
          )}
          {copyFeedback && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-300 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{copyFeedback}</span>
            </div>
          )}
        </div>
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

          {/* Auto-Align / Reconcile Operations to Canonical Rows */}
          <button
            type="button"
            onClick={handleAutoAlignRows}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs"
            title="Automatically align and merge any newly added or displaced operators back into their proper line rows"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Align to Rows</span>
          </button>

          {/* Create New Master Operation */}
          <button
            type="button"
            onClick={() => {
              setTargetOpIdForNew(null);
              setNewOpInput('');
              setShowNewOpModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer"
            title="Create a new operation and save to database"
          >
            <Plus className="w-3.5 h-3.5 text-sky-600" />
            <span>+ New Operation</span>
          </button>

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
                <th className="px-3 py-2.5 border-r border-slate-400/40 text-center min-w-[75px]">Table #</th>
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
                const style = getCriticalOpPerformanceStyle(prod, target);
                const dev = prod - target;

                return (
                  <tr key={op.id || index} className="hover:bg-slate-50 transition-colors">
                    {/* Operation Number / Table Number Selector with Unique Swapping */}
                    <td className="px-2 py-2.5 border-r border-slate-200 text-center font-black bg-slate-50">
                      <select
                        value={op.operation_no}
                        onChange={(e) => handleUpdateTableNo(op.id, Number(e.target.value))}
                        className="w-16 px-1 py-1 text-center font-black bg-white border border-slate-300 rounded text-xs text-slate-900 focus:ring-2 focus:ring-cyan-500 outline-none cursor-pointer shadow-2xs"
                        title="Workstation Table # (Each operation must have a unique table number)"
                      >
                        {Array.from({ length: 25 }, (_, i) => i + 1).map((num) => {
                          const otherOp = currentHourOps.find((o) => o.id !== op.id && o.operation_no === num);
                          const isCurrent = op.operation_no === num;
                          return (
                            <option key={num} value={num}>
                              #{num}{isCurrent ? ' (Current)' : otherOp ? ` ⇄ swap ${otherOp.operation_name ? `(${otherOp.operation_name})` : ''}` : ''}
                            </option>
                          );
                        })}
                      </select>
                    </td>

                    {/* Operation Name Dropdown & Add Button */}
                    <td className="px-3 py-2.5 border-r border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <select
                          value={op.operation_name}
                          onChange={(e) => {
                            if (e.target.value === '__CREATE_NEW__') {
                              setTargetOpIdForNew(op.id || null);
                              setNewOpInput('');
                              setShowNewOpModal(true);
                            } else {
                              handleUpdateField(op.id, 'operation_name', e.target.value);
                            }
                          }}
                          className="flex-1 min-w-0 px-2 py-1.5 bg-white border border-slate-300 rounded-md font-bold text-slate-900 text-xs focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none cursor-pointer truncate"
                        >
                          {availableOperations.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                          {op.operation_name && !availableOperations.includes(op.operation_name) && (
                            <option value={op.operation_name}>{op.operation_name}</option>
                          )}
                          <option value="__CREATE_NEW__" className="text-cyan-700 font-bold bg-cyan-50">
                            ➕ + Create New Operation...
                          </option>
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            setTargetOpIdForNew(op.id || null);
                            setNewOpInput('');
                            setShowNewOpModal(true);
                          }}
                          className="p-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-300 hover:border-cyan-400 rounded-md transition shadow-xs cursor-pointer shrink-0"
                          title="Add a new operation type & save to database"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      </div>
                    </td>

                    {/* Worker / Operator Dropdown */}
                    <td className="px-3 py-2.5 border-r border-slate-200">
                      <select
                        value={op.worker_name}
                        onChange={(e) => handleUpdateField(op.id, 'worker_name', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-bold text-slate-900 text-xs focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none cursor-pointer"
                      >
                        <option value="" disabled>-- Select Worker / Operator --</option>
                        {availableWorkers.map((w) => (
                          <option key={w.id} value={w.name}>
                            {w.name} ({w.id})
                          </option>
                        ))}
                        {op.worker_name && !availableWorkers.some((w) => w.name === op.worker_name) && (
                          <option value={op.worker_name}>{op.worker_name} ({op.worker_id || 'Assigned'})</option>
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
                            : `${style.boxClass} font-black`
                        } focus:ring-2 focus:ring-cyan-500`}
                      />
                    </td>

                    {/* Achievement % Badge */}
                    <td className="px-3 py-2.5 border-r border-slate-200 text-center">
                      <div className="flex flex-col items-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-black industrial-digits ${style.boxClass}`}
                        >
                          {efficiency}%
                        </span>
                        <span
                          className={`text-[9px] font-bold mt-0.5 ${
                            dev > 0 ? 'text-emerald-600' : dev === 0 ? 'text-slate-600' : 'text-rose-600'
                          }`}
                        >
                          {dev > 0 ? `▲+${dev}` : dev === 0 ? `✓ 0` : `▼${dev}`}
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

      {/* CREATE NEW OPERATION MODAL */}
      {showNewOpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-[#134665] text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-300" />
                <h4 className="font-bold text-sm tracking-wide">Create New Operation</h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowNewOpModal(false);
                  setNewOpInput('');
                  setTargetOpIdForNew(null);
                }}
                className="text-cyan-200 hover:text-white transition cursor-pointer p-1 rounded hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveNewOperation} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Operation Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newOpInput}
                  onChange={(e) => setNewOpInput(e.target.value)}
                  placeholder="e.g. COLLAR STITCH, POCKET HEM..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 placeholder:text-slate-400 uppercase focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                  This operation will be saved to the database and will permanently appear in all operation dropdowns across all hours.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewOpModal(false);
                    setNewOpInput('');
                    setTargetOpIdForNew(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                  disabled={isSavingOp}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newOpInput.trim() || isSavingOp}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-700 hover:bg-cyan-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                >
                  {isSavingOp ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save &amp; Add Operation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
