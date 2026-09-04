import React, { useState, useEffect } from 'react';
import type { ProductionDay } from '../../types';
import {
  Building2,
  Calendar,
  UserCheck,
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  Users,
  ShieldCheck,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import {
  getAvailableWorkers,
  getAvailableSupervisors,
  addAvailableSupervisor,
  deleteAvailableSupervisor,
  getLaneSupervisor,
  setLaneSupervisor,
  type WorkerItem,
  type SupervisorItem,
} from '../../lib/dataService';

interface BasicInfoEditorProps {
  unitName: string;
  availableUnits?: string[];
  onUnitChange?: (unit: string) => void;
  onAddUnit?: (newUnit: string) => void;
  onDeleteUnit?: (unit: string) => void;
  day: ProductionDay;
  availableLanes: string[];
  selectedLane: string;
  onLaneChange: (lane: string) => void;
  onAddLane: (newLane: string) => void;
  onDeleteLane: (lane: string) => void;
  onRenameLane?: (oldName: string, newName: string) => Promise<void> | void;
  onChange: (updatedDay: Partial<ProductionDay>) => void;
  onDateChange: (newDate: string) => void;
  onNavigateToWorkers?: () => void;
}

export const BasicInfoEditor: React.FC<BasicInfoEditorProps> = ({
  unitName,
  availableUnits = ['Unit 01'],
  onUnitChange,
  onAddUnit,
  onDeleteUnit,
  day,
  availableLanes,
  selectedLane,
  onLaneChange,
  onAddLane,
  onDeleteLane,
  onRenameLane,
  onChange,
  onDateChange,
  onNavigateToWorkers,
}) => {
  // Manufacturing Unit form state
  const [newUnitInput, setNewUnitInput] = useState('');
  const [unitError, setUnitError] = useState('');
  const [unitFeedback, setUnitFeedback] = useState<string | null>(null);
  const [showAddUnitForm, setShowAddUnitForm] = useState(false);

  // Production Lane form state
  const [newLaneInput, setNewLaneInput] = useState('');
  const [laneError, setLaneError] = useState('');

  // Lane renaming state
  const [editingLane, setEditingLane] = useState<string | null>(null);
  const [renamedLaneInput, setRenamedLaneInput] = useState('');
  const [isRenamingLane, setIsRenamingLane] = useState(false);

  // Employee / Worker Directory state (scoped to unitName)
  const [workers, setWorkers] = useState<WorkerItem[]>(() => getAvailableWorkers(unitName));

  // Supervisor Directory state
  const [supervisors, setSupervisors] = useState<SupervisorItem[]>(getAvailableSupervisors);
  const [newSupervisorName, setNewSupervisorName] = useState('');
  const [newSupervisorId, setNewSupervisorId] = useState('');
  const [supervisorFeedback, setSupervisorFeedback] = useState<string | null>(null);

  // Listen to workers update event and reload when unitName changes
  useEffect(() => {
    setWorkers(getAvailableWorkers(unitName));
    const handleWorkersUpdated = (e: any) => {
      if (e.detail?.workers && (!e.detail?.unitName || e.detail?.unitName === unitName)) {
        setWorkers(e.detail.workers);
      }
    };
    window.addEventListener('production-workers-updated', handleWorkersUpdated);
  }, [unitName]);

  // Listen to supervisors update event
  useEffect(() => {
    const handleSupervisorsUpdated = (e: any) => {
      if (e.detail?.supervisors) setSupervisors(e.detail.supervisors);
    };
    window.addEventListener('production-supervisors-updated', handleSupervisorsUpdated);
    return () => window.removeEventListener('production-supervisors-updated', handleSupervisorsUpdated);
  }, []);

  // Manufacturing Unit Handler
  const handleAddNewUnit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newUnitInput.trim();
    if (!trimmed) {
      setUnitError('Please enter a unit name');
      return;
    }
    const currentUnits = availableUnits || ['Unit 01'];
    if (currentUnits.some((u) => u.toLowerCase() === trimmed.toLowerCase())) {
      setUnitError('This unit already exists');
      return;
    }
    if (onAddUnit) {
      onAddUnit(trimmed);
    }
    if (onUnitChange) {
      onUnitChange(trimmed);
    }
    setNewUnitInput('');
    setUnitError('');
    setShowAddUnitForm(false);
    setUnitFeedback(`✓ Unit "${trimmed}" created successfully`);
    setTimeout(() => setUnitFeedback(null), 3500);
  };

  // Lane Handlers
  const handleAddNewLane = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newLaneInput.trim();
    if (!trimmed) {
      setLaneError('Please enter a lane name');
      return;
    }
    if (availableLanes.includes(trimmed)) {
      setLaneError('This lane already exists');
      return;
    }
    onAddLane(trimmed);
    onLaneChange(trimmed);
    onChange({ lane_name: trimmed });
    setNewLaneInput('');
    setLaneError('');
  };

  const handleStartRenameLane = (lane: string) => {
    setEditingLane(lane);
    setRenamedLaneInput(lane);
    setLaneError('');
  };

  const handleSaveRenameLane = async (oldName: string) => {
    const trimmed = renamedLaneInput.trim();
    if (!trimmed) {
      setLaneError('Lane name cannot be empty');
      return;
    }
    if (trimmed === oldName) {
      setEditingLane(null);
      return;
    }
    if (availableLanes.includes(trimmed)) {
      setLaneError(`Lane "${trimmed}" already exists`);
      return;
    }

    if (onRenameLane) {
      setIsRenamingLane(true);
      try {
        await onRenameLane(oldName, trimmed);
      } finally {
        setIsRenamingLane(false);
      }
    }
    setEditingLane(null);
  };

  // Supervisor Add Handler
  const handleAddSupervisor = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newSupervisorName.trim();
    const id = newSupervisorId.trim().toUpperCase();
    if (!name || !id) return;

    const updated = addAvailableSupervisor({ name, id });
    setSupervisors(updated);
    setNewSupervisorName('');
    setNewSupervisorId('');
    setSupervisorFeedback(`✓ Registered supervisor ${name} (${id})`);
    setTimeout(() => setSupervisorFeedback(null), 3000);
  };

  // Supervisor Delete Handler
  const handleDeleteSupervisor = (id: string) => {
    const updated = deleteAvailableSupervisor(id);
    setSupervisors(updated);
  };

  // Lane-Specific Supervisor Selection Handler
  const handleAssignSupervisorToLane = (supName: string) => {
    const found = supervisors.find((s) => s.name === supName);
    const supId = found ? found.id : day.supervisor_id || 'SUP-01';

    // 1. Assign in current day state
    onChange({
      supervisor_name: supName,
      supervisor_id: supId,
    });

    // 2. Persist specifically for this lane
    setLaneSupervisor(selectedLane, { name: supName, id: supId });
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm max-w-4xl mx-auto space-y-6">
      {/* 1. BASIC INFORMATION: Manufacturing Unit & Production Date */}
      <div>
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-700" />
            <span>Manufacturing Unit &amp; Production Date</span>
          </h3>
          {unitFeedback && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-300 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{unitFeedback}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Manufacturing Unit Section */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Manufacturing Unit:
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowAddUnitForm(!showAddUnitForm);
                  setUnitError('');
                }}
                id="btn-toggle-create-unit"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-700 hover:bg-cyan-800 text-white rounded-md text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddUnitForm ? 'Close Form' : '+ Create Unit'}</span>
              </button>
            </div>

            {/* Active Unit Selector Chips */}
            <div className="flex flex-wrap gap-2">
              {availableUnits.map((unit) => {
                const isSelected = (unitName || 'Unit 01') === unit;
                return (
                  <div
                    key={unit}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
                      isSelected
                        ? 'bg-[#134665] text-white border-[#0f3852] shadow-sm ring-2 ring-cyan-500/50'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onUnitChange && onUnitChange(unit)}
                      className="flex items-center gap-1.5 cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300 flex-shrink-0" />
                      ) : (
                        <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      )}
                      <span className="font-black">{unit}</span>
                    </button>

                    {/* Delete custom unit button */}
                    {availableUnits.length > 1 && unit !== 'Unit 01' && onDeleteUnit && (
                      <button
                        type="button"
                        onClick={() => onDeleteUnit(unit)}
                        title={`Delete ${unit}`}
                        className="ml-1 text-slate-400 hover:text-rose-500 transition cursor-pointer p-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Create Unit Inline Form */}
            {showAddUnitForm && (
              <form onSubmit={handleAddNewUnit} className="bg-slate-50 p-3 rounded-lg border border-slate-200 animate-in fade-in space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                      <Building2 className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      id="input-create-unit-name"
                      value={newUnitInput}
                      onChange={(e) => {
                        setNewUnitInput(e.target.value);
                        setUnitError('');
                      }}
                      placeholder="e.g. Unit 02 or Unit 02 - Assembly"
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <button
                    type="submit"
                    id="btn-submit-create-unit"
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Unit</span>
                  </button>
                </div>
                {unitError && <p className="text-xs text-rose-600 font-semibold">{unitError}</p>}
                <span className="text-[10px] text-slate-400 block">
                  New manufacturing units will be available across the editor and dashboard.
                </span>
              </form>
            )}
            <span className="text-[11px] text-slate-400 block">
              Active factory manufacturing unit for production operations.
            </span>
          </div>

          {/* Production Date */}
          <div className="lg:col-span-5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Production Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-4 h-4 text-cyan-700" />
              </div>
              <input
                type="date"
                value={day.production_date}
                onChange={(e) => e.target.value && onDateChange(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-bold focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Select date for recording production metrics.</span>
          </div>
        </div>
      </div>

      {/* 2. PRODUCTION LANE SECTION: With Dedicated Supervisor */}
      <div className="pt-2">
        <h3 className="text-base font-bold text-slate-900 mb-3 pb-2 border-b border-slate-200 flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-700" />
          <span>Production Lane Management &amp; Lane Supervisor</span>
        </h3>

        {/* Active Lane Selector Chips */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Select Active Lane to Configure:
          </label>
          <div className="flex flex-wrap gap-2">
            {availableLanes.map((lane) => {
              const isSelected = selectedLane === lane;
              const isEditing = editingLane === lane;
              const laneSup = getLaneSupervisor(lane);

              if (isEditing) {
                return (
                  <div
                    key={lane}
                    className="inline-flex items-center gap-1.5 p-1 bg-white rounded-lg border-2 border-cyan-500 shadow-sm"
                  >
                    <input
                      type="text"
                      value={renamedLaneInput}
                      onChange={(e) => setRenamedLaneInput(e.target.value)}
                      className="w-28 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-bold text-slate-900 outline-none focus:ring-1 focus:ring-cyan-500"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRenameLane(lane);
                        if (e.key === 'Escape') setEditingLane(null);
                      }}
                    />
                    <button
                      type="button"
                      disabled={isRenamingLane}
                      onClick={() => handleSaveRenameLane(lane)}
                      className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition cursor-pointer disabled:opacity-50"
                      title="Save Lane Name"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={isRenamingLane}
                      onClick={() => setEditingLane(null)}
                      className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded transition cursor-pointer"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={lane}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold transition ${
                    isSelected
                      ? 'bg-[#134665] text-white border-[#0f3852] shadow-sm ring-2 ring-cyan-500/50'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onLaneChange(lane);
                      onChange({
                        lane_name: lane,
                        supervisor_name: laneSup.name,
                        supervisor_id: laneSup.id,
                      });
                    }}
                    className="flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300 flex-shrink-0" />}
                    <div>
                      <span className="block font-black">{lane}</span>
                      <span className={`text-[10px] block ${isSelected ? 'text-cyan-200' : 'text-slate-400'}`}>
                        {laneSup.name} ({laneSup.id})
                      </span>
                    </div>
                  </button>

                  <div className="flex items-center gap-0.5 ml-1 border-l border-slate-300/40 pl-1">
                    {/* Rename Lane button */}
                    <button
                      type="button"
                      onClick={() => handleStartRenameLane(lane)}
                      title={`Rename ${lane}`}
                      className={`p-1 rounded transition cursor-pointer ${
                        isSelected
                          ? 'text-cyan-200 hover:text-white hover:bg-white/10'
                          : 'text-slate-400 hover:text-cyan-700 hover:bg-slate-200'
                      }`}
                    >
                      <Pencil className="w-3 h-3" />
                    </button>

                    {/* Remove lane button for custom lanes */}
                    {availableLanes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteLane(lane)}
                        title={`Remove ${lane}`}
                        className={`p-1 rounded transition cursor-pointer ${
                          isSelected
                            ? 'text-rose-300 hover:text-rose-100 hover:bg-rose-500/20'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add New Lane Form */}
        <form onSubmit={handleAddNewLane} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center gap-2">
          <div className="flex-1">
            <input
              type="text"
              value={newLaneInput}
              onChange={(e) => {
                setNewLaneInput(e.target.value);
                setLaneError('');
              }}
              placeholder="e.g. Lane 05 or Line B - Stitching"
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-cyan-700 hover:bg-cyan-800 text-white rounded-md text-xs font-bold transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Lane</span>
          </button>
        </form>
        {laneError && <p className="text-xs text-rose-600 mt-1 font-semibold">{laneError}</p>}

        {/* ASSIGN SUPERVISOR FOR ACTIVE LANE */}
        <div className="mt-4 p-3.5 bg-cyan-50/60 rounded-xl border border-cyan-200">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="w-4 h-4 text-cyan-800" />
            <span className="text-xs font-black text-[#0f3852] uppercase tracking-wider">
              Dedicated Supervisor Assigned to {selectedLane}:
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1">
              <select
                value={day.supervisor_name || ''}
                onChange={(e) => handleAssignSupervisorToLane(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-cyan-400 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-cyan-500 outline-none cursor-pointer"
              >
                {supervisors.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.id})
                  </option>
                ))}
                {!supervisors.some((s) => s.name === day.supervisor_name) && day.supervisor_name && (
                  <option value={day.supervisor_name}>
                    {day.supervisor_name} ({day.supervisor_id || 'SUP-01'})
                  </option>
                )}
              </select>
            </div>

            <div className="w-40 flex items-center gap-1 px-3 py-2 bg-white border border-slate-300 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-cyan-700" />
              <span className="text-xs font-mono font-black text-cyan-900 uppercase">
                {day.supervisor_id || 'SUP-01'}
              </span>
            </div>
          </div>
          <span className="text-[11px] text-slate-500 mt-1.5 block">
            This supervisor will only manage <strong>{selectedLane}</strong>. Each lane has its own independent supervisor.
          </span>
        </div>
      </div>

      {/* 3. REGISTER NEW SUPERVISOR & SUPERVISOR DIRECTORY */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-700" />
              <span>Supervisor Master Directory</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Add and manage shift supervisors. Each registered supervisor can be assigned to manage a specific lane.
            </p>
          </div>

          {supervisorFeedback && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-300 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{supervisorFeedback}</span>
            </div>
          )}
        </div>

        {/* Add New Supervisor Form */}
        <form onSubmit={handleAddSupervisor} className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 mb-4 flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              New Supervisor Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <input
                type="text"
                required
                placeholder="e.g. M. K. PATEL"
                value={newSupervisorName}
                onChange={(e) => setNewSupervisorName(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-bold text-slate-900 uppercase outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="w-44">
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Supervisor ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <input
                type="text"
                required
                placeholder="e.g. SUP-05"
                value={newSupervisorId}
                onChange={(e) => setNewSupervisorId(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-bold text-slate-900 uppercase font-mono outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-md text-xs font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Supervisor</span>
          </button>
        </form>

        {/* Registered Supervisors List */}
        <div>
          <span className="text-xs font-bold text-slate-600 uppercase mb-2 block">
            Registered Supervisors ({supervisors.length})
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
            {supervisors.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs"
              >
                <div className="truncate">
                  <span className="font-bold text-slate-800 block truncate uppercase">{s.name}</span>
                  <span className="text-[10px] font-mono text-cyan-800 font-bold">{s.id}</span>
                </div>
                {supervisors.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteSupervisor(s.id)}
                    title={`Delete supervisor ${s.name}`}
                    className="p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer ml-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. WORKER / OPERATOR DIRECTORY LINK */}
      <div className="pt-2">
        <div className="p-4 bg-gradient-to-r from-slate-50 to-cyan-50/40 rounded-xl border border-cyan-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-700 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5 sm:mt-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Workers &amp; Factory Operators Directory</span>
                <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 text-[10px] font-black rounded-full uppercase">
                  {workers.length} Registered
                </span>
              </h4>
              <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
                Manage factory workers, operators, roles (Stitching, Quality, Ironing), and departments in the dedicated tab. All registered operators seamlessly sync with Critical Operations and Downtime dropdowns.
              </p>
            </div>
          </div>

          {onNavigateToWorkers && (
            <button
              type="button"
              onClick={onNavigateToWorkers}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-xs whitespace-nowrap"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Open Workers Tab &rarr;</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
