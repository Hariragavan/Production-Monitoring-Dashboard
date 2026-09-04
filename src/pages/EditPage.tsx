import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchDashboardData,
  saveDashboardData,
  getAvailableLanes,
  addAvailableLane,
  deleteAvailableLane,
  renameAvailableLane,
  syncLanesFromSupabase,
  getAvailableUnits,
  addAvailableUnit,
  deleteAvailableUnit,
  syncUnitsFromSupabase,
  syncWorkersFromSupabase,
  getAvailableSupervisors,
  getLaneSupervisor,
  setLaneSupervisor,
  getTodayDateString,
  type SupervisorItem,
} from '../lib/dataService';
import type { DashboardData } from '../types';
import { INITIAL_DEMO_DATA } from '../lib/seedData';
import { BasicInfoEditor } from '../components/editor/BasicInfoEditor';
import { WorkersEditor } from '../components/editor/WorkersEditor';
import { HourlyProductionEditor } from '../components/editor/HourlyProductionEditor';
import { CriticalOperationsEditor } from '../components/editor/CriticalOperationsEditor';
import { DowntimeSummaryEditor } from '../components/editor/DowntimeSummaryEditor';
import { DowntimeDetailsEditor } from '../components/editor/DowntimeDetailsEditor';
import {
  Tv,
  Save,
  LogOut,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Layers,
  UserCheck,
  Building2,
  Users,
} from 'lucide-react';

type TabKey = 'basic' | 'workers' | 'hourly' | 'operations' | 'downtime-summary' | 'downtime-details';

// Local date formatter avoiding UTC shifts
const formatLocalDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const EditPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>('basic');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString);
  const [selectedUnit, setSelectedUnit] = useState<string>('Unit 01');
  const [availableUnits, setAvailableUnits] = useState<string[]>(getAvailableUnits);
  const [selectedLane, setSelectedLane] = useState<string>(() => {
    const lanes = getAvailableLanes('Unit 01');
    return lanes[0] || 'Lane 01';
  });
  const [availableLanes, setAvailableLanes] = useState<string[]>(() => getAvailableLanes('Unit 01'));
  const [availableSupervisors, setAvailableSupervisors] = useState<SupervisorItem[]>(getAvailableSupervisors);
  const [data, setData] = useState<DashboardData>(INITIAL_DEMO_DATA);
  const [loading, setLoading] = useState<boolean>(true);

  // Save feedback state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState<string>('');

  // Redirect if unauthenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Sync lanes, units, and workers for selectedUnit from Supabase across all devices
  useEffect(() => {
    syncLanesFromSupabase(selectedUnit).then((lanes) => {
      if (lanes && lanes.length > 0) setAvailableLanes(lanes);
    });
    syncUnitsFromSupabase().then((units) => {
      if (units && units.length > 0) setAvailableUnits(units);
    });
    syncWorkersFromSupabase(selectedUnit);
  }, [selectedUnit]);

  // Real-time listener for units update
  useEffect(() => {
    const handleUnitsUpdated = (e: any) => {
      if (e.detail?.units) {
        setAvailableUnits(e.detail.units);
      }
    };
    window.addEventListener('production-units-updated', handleUnitsUpdated);
    return () => window.removeEventListener('production-units-updated', handleUnitsUpdated);
  }, []);

  // Real-time listener for lanes update (scoped to selectedUnit)
  useEffect(() => {
    const handleLanesUpdated = (e: any) => {
      if (e.detail?.lanes && (!e.detail?.unitName || e.detail?.unitName === selectedUnit)) {
        setAvailableLanes(e.detail.lanes);
      }
    };
    window.addEventListener('production-lanes-updated', handleLanesUpdated);
    return () => window.removeEventListener('production-lanes-updated', handleLanesUpdated);
  }, [selectedUnit]);

  // Unit switch handler ensuring unit-scoped lanes & workers are loaded
  const handleUnitChange = (newUnit: string) => {
    setSelectedUnit(newUnit);
    const lanesForUnit = getAvailableLanes(newUnit);
    setAvailableLanes(lanesForUnit);
    const nextLane = lanesForUnit.includes(selectedLane) ? selectedLane : (lanesForUnit[0] || 'Lane 01');
    setSelectedLane(nextLane);
    syncLanesFromSupabase(newUnit).then((lanes) => {
      if (lanes && lanes.length > 0) {
        setAvailableLanes(lanes);
        if (!lanes.includes(nextLane)) {
          setSelectedLane(lanes[0]);
        }
      }
    });
    syncWorkersFromSupabase(newUnit);
    setData((prev) => ({
      ...prev,
      unit: {
        id: `unit-${newUnit.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        unit_name: newUnit,
      },
      day: {
        ...prev.day,
        lane_name: nextLane,
      },
    }));
  };

  const handleAddLane = async (newLane: string) => {
    const result = await addAvailableLane(newLane, selectedUnit);
    setAvailableLanes(result.lanes);
    setSelectedLane(newLane);
    if (!result.success && result.error) {
      setSaveMessage(`Notice: Added locally, database returned: ${result.error}`);
      setSaveStatus('error');
    } else {
      setSaveMessage(`✓ Added lane "${newLane}" to ${selectedUnit} in database`);
      setSaveStatus('success');
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 4000);
    }
  };

  const handleDeleteLane = async (laneToDelete: string) => {
    const result = await deleteAvailableLane(laneToDelete, selectedUnit);
    setAvailableLanes(result.lanes);
    if (selectedLane === laneToDelete && result.lanes.length > 0) {
      setSelectedLane(result.lanes[0]);
    }
    if (!result.success && result.error) {
      setSaveMessage(`Notice: Removed locally, database returned: ${result.error}`);
      setSaveStatus('error');
    } else {
      setSaveMessage(`✓ Deleted lane "${laneToDelete}" from ${selectedUnit} and database`);
      setSaveStatus('success');
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 4000);
    }
  };

  const handleRenameLane = async (oldName: string, newName: string) => {
    const result = await renameAvailableLane(oldName, newName, selectedUnit);
    if (result.success) {
      setAvailableLanes(result.lanes);
      if (selectedLane === oldName) {
        setSelectedLane(newName);
        setData((prev) => ({
          ...prev,
          day: {
            ...prev.day,
            lane_name: newName,
          },
        }));
      }
      setSaveMessage(`✓ Renamed "${oldName}" to "${newName}" in ${selectedUnit}`);
      setSaveStatus('success');
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 4000);
    } else {
      setSaveMessage(`Failed to rename lane: ${result.error}`);
      setSaveStatus('error');
    }
  };

  // Real-time listener for supervisors update
  useEffect(() => {
    const handleSupervisorsUpdated = (e: any) => {
      if (e.detail?.supervisors) {
        setAvailableSupervisors(e.detail.supervisors);
      }
    };
    window.addEventListener('production-supervisors-updated', handleSupervisorsUpdated);
    return () => window.removeEventListener('production-supervisors-updated', handleSupervisorsUpdated);
  }, []);

  // Fetch data whenever selectedDate, selectedLane, or selectedUnit changes
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const fetched = await fetchDashboardData(selectedDate, selectedLane, selectedUnit);
        if (isMounted) {
          if (fetched.unit) {
            fetched.unit.unit_name = selectedUnit;
          }
          setData(fetched);
        }
      } catch (err) {
        console.error('Failed to load data for edit:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [selectedDate, selectedLane, selectedUnit]);

  // Date Navigation Stepper (Excludes Sunday)
  const handleStepDate = (direction: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d, 12, 0, 0);
    dateObj.setDate(dateObj.getDate() + direction);
    if (dateObj.getDay() === 0) {
      dateObj.setDate(dateObj.getDate() + (direction > 0 ? 1 : -1));
    }
    const cleanDate = formatLocalDate(dateObj);
    setSelectedDate(cleanDate);
  };

  // Direct Date Picker Select (Excludes Sunday)
  const handleDateSelect = (val: string) => {
    if (!val) return;
    const [y, m, d] = val.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d, 12, 0, 0);
    if (dateObj.getDay() === 0) {
      dateObj.setDate(dateObj.getDate() + 1);
    }
    const cleanDate = formatLocalDate(dateObj);
    setSelectedDate(cleanDate);
  };

  const handleToday = () => {
    const today = new Date();
    if (today.getDay() === 0) {
      today.setDate(today.getDate() + 1);
    }
    setSelectedDate(formatLocalDate(today));
  };

  // Handle Save
  const handleSave = async () => {
    setSaveStatus('saving');
    setSaveMessage(`Saving data for ${selectedUnit} - ${selectedLane} (${selectedDate})...`);

    try {
      const dataToSave: DashboardData = {
        ...data,
        unit: {
          id: data.unit?.id || `unit-${selectedUnit.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          unit_name: selectedUnit,
        },
        day: {
          ...data.day,
          production_date: selectedDate, // GUARANTEES IT SAVES IN THAT EXACT DATE!
          lane_name: selectedLane,
        },
      };
      const result = await saveDashboardData(dataToSave);
      if (result.success) {
        setSaveStatus('success');
        setSaveMessage(result.warning || `✓ Changes saved successfully for ${selectedUnit} - ${selectedLane} on ${selectedDate}`);
        setTimeout(() => {
          setSaveStatus('idle');
          setSaveMessage('');
        }, 5000);
      } else {
        setSaveStatus('error');
        setSaveMessage(`✕ Failed to save changes: ${result.error}`);
      }
    } catch (err: any) {
      setSaveStatus('error');
      setSaveMessage(`✕ Failed to save changes: ${err.message || 'Unknown error'}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (authLoading || (!isAuthenticated && !authLoading)) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-[#0f3852] text-white px-6 py-3.5 shadow-md border-b border-cyan-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-600/30 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight">Production Data Editor</h1>
            <p className="text-xs text-cyan-200/80">
              Manage shift targets, hourly output, operations, lanes, and floor downtime
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Back to Live Dashboard */}
          <button
            onClick={() => navigate('/dashboard')}
            id="btn-nav-dashboard"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold border border-slate-600 transition active:scale-95 cursor-pointer"
          >
            <Tv className="w-4 h-4 text-cyan-400" />
            <span>Dashboard</span>
          </button>

          {/* Save Changes Button */}
          <button
            onClick={handleSave}
            id="btn-save-changes"
            disabled={saveStatus === 'saving'}
            className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black uppercase tracking-wider shadow-md hover:shadow-emerald-600/30 transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {saveStatus === 'saving' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-white" />
                <span>Save Changes</span>
              </>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            id="btn-logout"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-900/80 hover:bg-rose-800 text-rose-200 hover:text-white rounded-lg text-xs font-bold border border-rose-700 transition active:scale-95 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Save Notification Banner */}
      {saveStatus === 'success' && (
        <div className="bg-emerald-600 text-white px-6 py-2.5 text-xs font-black flex items-center justify-center gap-2 shadow-inner animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveMessage}</span>
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="bg-rose-600 text-white px-6 py-2.5 text-xs font-black flex items-center justify-center gap-2 shadow-inner animate-in fade-in duration-200">
          <XCircle className="w-4 h-4" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Editor Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-4">
        {/* ALL-TABS PERSISTENT SELECTOR: Select Unit, Lane, Date, & Supervisor Across All Tabs */}
        <div className="bg-white border border-slate-300 rounded-xl p-3.5 shadow-xs space-y-2.5">
          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3">
            {/* 1. Left: Unit and Lane Selectors */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Unit Dropdown */}
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 text-xs font-black text-[#0f3852] uppercase tracking-wider">
                  <Building2 className="w-4 h-4 text-cyan-700" />
                  <span>Unit:</span>
                </div>
                <select
                  id="header-unit-select"
                  value={selectedUnit}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-cyan-500 outline-none cursor-pointer"
                >
                  {availableUnits.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="h-5 w-px bg-slate-300 hidden sm:block" />

              {/* Lane Buttons */}
              <div className="flex items-center gap-1.5 text-xs font-black text-[#0f3852] uppercase tracking-wider">
                <Layers className="w-4 h-4 text-cyan-700" />
                <span>Lane:</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {availableLanes.map((lane) => {
                  const isSelected = selectedLane === lane;
                  const laneSup = getLaneSupervisor(lane);

                  return (
                    <button
                      key={lane}
                      type="button"
                      onClick={() => {
                        setSelectedLane(lane);
                        setData((prev) => ({
                          ...prev,
                          day: {
                            ...prev.day,
                            lane_name: lane,
                            supervisor_name: laneSup.name,
                            supervisor_id: laneSup.id,
                          },
                        }));
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#134665] text-white shadow-xs ring-2 ring-cyan-500/50'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300" />}
                      <span>{lane}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Center: Dedicated Date Selection Controls (Excludes Sunday) */}
            <div className="flex items-center gap-1.5 bg-[#0f3852] text-white px-3 py-1.5 rounded-lg border border-cyan-500/50 shadow-inner">
              <Calendar className="w-4 h-4 text-cyan-300 flex-shrink-0" />
              <span className="text-xs font-black text-cyan-300 uppercase tracking-wider">Date:</span>
              <button
                type="button"
                onClick={() => handleStepDate(-1)}
                title="Previous Working Day (Skips Sunday)"
                className="p-1 hover:bg-slate-800 text-white rounded transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateSelect(e.target.value)}
                className="bg-slate-900 text-white font-black text-xs rounded px-2 py-0.5 border border-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer [color-scheme:dark]"
                title="Select Date to Edit & Save"
              />
              <button
                type="button"
                onClick={() => handleStepDate(1)}
                title="Next Working Day (Skips Sunday)"
                className="p-1 hover:bg-slate-800 text-white rounded transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleToday}
                title="Set to Current Working Day"
                className="px-2 py-0.5 text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded border border-slate-600 transition cursor-pointer ml-1"
              >
                Today
              </button>
            </div>

            {/* 3. Right: Dedicated Supervisor for Selected Lane */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 uppercase tracking-wider">
                <UserCheck className="w-4 h-4 text-cyan-700" />
                <span>Supervisor:</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={data.day?.supervisor_name || 'Supervisor'}
                  onChange={(e) => {
                    const supName = e.target.value;
                    const found = availableSupervisors.find((s) => s.name === supName);
                    const supId = found ? found.id : data.day?.supervisor_id || 'SUP-01';

                    setLaneSupervisor(selectedLane, { name: supName, id: supId });

                    setData((prev) => ({
                      ...prev,
                      day: {
                        ...prev.day,
                        supervisor_name: supName,
                        supervisor_id: supId,
                      },
                    }));
                  }}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-cyan-500 outline-none cursor-pointer"
                >
                  {availableSupervisors.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.id})
                    </option>
                  ))}
                  {!availableSupervisors.some((s) => s.name === data.day?.supervisor_name) && data.day?.supervisor_name && (
                    <option value={data.day.supervisor_name}>
                      {data.day.supervisor_name} ({data.day.supervisor_id || 'SUP-01'})
                    </option>
                  )}
                </select>
                <span className="text-xs font-mono font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 px-2 py-1 rounded">
                  {data.day?.supervisor_id || 'SUP-01'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl border border-slate-300 p-1.5 shadow-xs flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('basic')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'basic'
                ? 'bg-cyan-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Basic Info</span>
          </button>
          <button
            onClick={() => setActiveTab('workers')}
            id="tab-btn-workers"
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'workers'
                ? 'bg-cyan-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Workers Directory</span>
          </button>
          <button
            onClick={() => setActiveTab('hourly')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'hourly'
                ? 'bg-cyan-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Hourly Schedule</span>
          </button>
          <button
            onClick={() => setActiveTab('operations')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'operations'
                ? 'bg-cyan-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Critical Operations</span>
          </button>
          <button
            onClick={() => setActiveTab('downtime-summary')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'downtime-summary'
                ? 'bg-cyan-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Downtime Matrix</span>
          </button>
          <button
            onClick={() => setActiveTab('downtime-details')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'downtime-details'
                ? 'bg-cyan-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Downtime Incidents</span>
          </button>
        </div>

        {/* Tab Content Panels */}
        {loading ? (
          <div className="bg-white p-12 rounded-xl border border-slate-300 shadow-xs flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
            <span className="text-sm font-bold text-slate-500">
              Loading {selectedUnit} - {selectedLane} data for {selectedDate}...
            </span>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === 'basic' && (
              <BasicInfoEditor
                unitName={selectedUnit}
                availableUnits={availableUnits}
                onUnitChange={handleUnitChange}
                onAddUnit={(unit) => {
                  const updated = addAvailableUnit(unit);
                  setAvailableUnits(updated);
                  handleUnitChange(unit);
                }}
                onDeleteUnit={(unit) => {
                  const updated = deleteAvailableUnit(unit);
                  setAvailableUnits(updated);
                  if (selectedUnit === unit && updated.length > 0) {
                    handleUnitChange(updated[0]);
                  }
                }}
                day={data.day}
                availableLanes={availableLanes}
                selectedLane={selectedLane}
                onLaneChange={setSelectedLane}
                onAddLane={handleAddLane}
                onDeleteLane={handleDeleteLane}
                onRenameLane={handleRenameLane}
                onChange={(updatedDay) => {
                  setData((prev) => ({
                    ...prev,
                    day: { ...prev.day, ...updatedDay },
                  }));
                }}
                onDateChange={handleDateSelect}
                onNavigateToWorkers={() => setActiveTab('workers')}
              />
            )}

            {activeTab === 'workers' && <WorkersEditor unitName={selectedUnit} />}

            {activeTab === 'hourly' && (
              <HourlyProductionEditor
                hourly={data.hourly}
                onChange={(updatedHourly) => {
                  setData((prev) => ({
                    ...prev,
                    hourly: updatedHourly,
                  }));
                }}
                onSave={handleSave}
                isSaving={saveStatus === 'saving'}
              />
            )}

            {activeTab === 'operations' && (
              <CriticalOperationsEditor
                operations={data.criticalOperations}
                onChange={(updatedOps) => {
                  setData((prev) => ({
                    ...prev,
                    criticalOperations: updatedOps,
                  }));
                }}
                unitName={selectedUnit}
              />
            )}

            {activeTab === 'downtime-summary' && (
              <DowntimeSummaryEditor
                downtimeSummary={data.downtimeSummary}
                onChange={(updatedSummary) => {
                  setData((prev) => ({
                    ...prev,
                    downtimeSummary: updatedSummary,
                  }));
                }}
              />
            )}

            {activeTab === 'downtime-details' && (
              <DowntimeDetailsEditor
                downtimeDetails={data.downtimeDetails}
                onChange={(updatedDetails) => {
                  setData((prev) => ({
                    ...prev,
                    downtimeDetails: updatedDetails,
                  }));
                }}
                unitName={selectedUnit}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
};
