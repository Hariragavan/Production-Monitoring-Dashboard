import { supabase, isSupabaseConfigured } from './supabase';
import type { DashboardData, HourlyProduction, CriticalOperation, DowntimeSummaryItem, DowntimeDetailItem } from '../types';
import { getSeedDataForLane } from './seedData';

const LOCAL_STORAGE_KEY_PREFIX = 'sup_tv_dashboard_data_';

// Helper to format date like "1st Sep 2026"
export function formatDisplayDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    const dayNum = date.getDate();
    let suffix = 'th';
    if (dayNum % 10 === 1 && dayNum !== 11) suffix = 'st';
    else if (dayNum % 10 === 2 && dayNum !== 12) suffix = 'nd';
    else if (dayNum % 10 === 3 && dayNum !== 13) suffix = 'rd';

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = monthNames[date.getMonth()];
    
    return `${dayNum}${suffix} ${monthName} ${date.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

// Helper to format minutes into human readable "Xh Ym" if over 1 hour
export function formatDuration(minutes: number, format: 'short' | 'long' = 'short'): string {
  const mins = Math.round(Number(minutes) || 0);
  if (mins === 0) return format === 'long' ? '0 min' : '0m';

  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;

  if (hrs === 0) {
    return format === 'long' ? `${remainingMins} mins` : `${remainingMins}m`;
  }

  if (remainingMins === 0) {
    return format === 'long' ? `${hrs} ${hrs === 1 ? 'hr' : 'hrs'}` : `${hrs}h`;
  }

  return format === 'long'
    ? `${hrs} ${hrs === 1 ? 'hr' : 'hrs'} ${remainingMins} min`
    : `${hrs}h ${remainingMins}m`;
}

export function getTodayDateString(): string {
  const d = new Date();
  // If today is Sunday (factory weekly off day), advance to Monday
  if (d.getDay() === 0) {
    d.setDate(d.getDate() + 1);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DEFAULT_LANES = ['Lane 01', 'Lane 02', 'Lane 03', 'Lane 04'];
const LANES_STORAGE_KEY_PREFIX = 'sup_tv_dashboard_lanes_';

export function getAvailableLanes(unitName: string = 'Unit 01'): string[] {
  try {
    const key = `${LANES_STORAGE_KEY_PREFIX}${unitName}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    // Fallback: If Unit 01, check legacy un-scoped key
    if (unitName === 'Unit 01') {
      const legacy = localStorage.getItem('sup_tv_dashboard_lanes');
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localStorage.setItem(key, JSON.stringify(parsed));
          return parsed;
        }
      }
      return DEFAULT_LANES;
    }
    return ['Lane 01'];
  } catch {
    // ignore
  }
  return unitName === 'Unit 01' ? DEFAULT_LANES : ['Lane 01'];
}

export async function syncLanesFromSupabase(unitName: string = 'Unit 01'): Promise<string[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Fetch unit_id for this unit
      const { data: unitData } = await supabase
        .from('units')
        .select('id')
        .eq('unit_name', unitName)
        .maybeSingle();

      if (unitData?.id) {
        const { data } = await supabase
          .from('production_days')
          .select('lane_name')
          .eq('unit_id', unitData.id);

        if (data && data.length > 0) {
          const lanesFromDb = Array.from(new Set(data.map((d: any) => d.lane_name).filter(Boolean)));
          const key = `${LANES_STORAGE_KEY_PREFIX}${unitName}`;
          localStorage.setItem(key, JSON.stringify(lanesFromDb));
          window.dispatchEvent(
            new CustomEvent('production-lanes-updated', { detail: { lanes: lanesFromDb, unitName } })
          );
          return lanesFromDb;
        }
      }
    } catch (err) {
      console.warn(`Could not sync lanes for ${unitName} from Supabase:`, err);
    }
  }
  return getAvailableLanes(unitName);
}

export async function addAvailableLane(
  newLane: string,
  unitName: string = 'Unit 01'
): Promise<{ success: boolean; lanes: string[]; error?: string }> {
  const current = getAvailableLanes(unitName);
  const trimmed = newLane.trim();
  if (!trimmed) return { success: false, lanes: current, error: 'Lane name cannot be empty' };
  if (current.includes(trimmed)) return { success: false, lanes: current, error: `Lane "${trimmed}" already exists` };

  const updated = [...current, trimmed];
  const key = `${LANES_STORAGE_KEY_PREFIX}${unitName}`;
  localStorage.setItem(key, JSON.stringify(updated));

  let supabaseError: string | undefined;
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: unitData } = await supabase
        .from('units')
        .select('id')
        .eq('unit_name', unitName)
        .maybeSingle();

      if (unitData?.id) {
        const today = new Date().toISOString().split('T')[0];
        const laneSup = getLaneSupervisor(trimmed);
        const { error } = await supabase.from('production_days').insert({
          unit_id: unitData.id,
          production_date: today,
          lane_name: trimmed,
          shift: `Shift 01 (${trimmed})`,
          supervisor_name: laneSup.name,
          supervisor_id: laneSup.id,
          worker_name: '',
          worker_id: '',
        });
        if (error && error.code !== '23505') {
          supabaseError = error.message;
          console.warn(`Could not add lane to Supabase for ${unitName}:`, error);
        }
      }
    } catch (err: any) {
      supabaseError = err.message;
    }
  }

  window.dispatchEvent(
    new CustomEvent('production-lanes-updated', { detail: { lanes: updated, unitName } })
  );
  return { success: !supabaseError, lanes: updated, error: supabaseError };
}

export async function deleteAvailableLane(
  laneToDelete: string,
  unitName: string = 'Unit 01'
): Promise<{ success: boolean; lanes: string[]; error?: string }> {
  const current = getAvailableLanes(unitName);
  if (current.length <= 1) return { success: false, lanes: current, error: 'At least 1 lane is required' };
  const updated = current.filter((l) => l !== laneToDelete);
  const key = `${LANES_STORAGE_KEY_PREFIX}${unitName}`;
  localStorage.setItem(key, JSON.stringify(updated));

  let supabaseError: string | undefined;
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: unitData } = await supabase
        .from('units')
        .select('id')
        .eq('unit_name', unitName)
        .maybeSingle();

      if (unitData?.id) {
        const { error } = await supabase
          .from('production_days')
          .delete()
          .eq('unit_id', unitData.id)
          .eq('lane_name', laneToDelete);

        if (error) {
          supabaseError = error.message;
          console.warn(`Could not delete lane "${laneToDelete}" from Supabase:`, error);
        }
      }
    } catch (err: any) {
      supabaseError = err.message;
    }
  }

  window.dispatchEvent(
    new CustomEvent('production-lanes-updated', { detail: { lanes: updated, unitName } })
  );
  return { success: !supabaseError, lanes: updated, error: supabaseError };
}

export async function renameAvailableLane(
  oldName: string,
  newName: string,
  unitName: string = 'Unit 01'
): Promise<{ success: boolean; lanes: string[]; error?: string }> {
  const trimmedNew = newName.trim();
  const trimmedOld = oldName.trim();
  const current = getAvailableLanes(unitName);

  if (!trimmedNew) return { success: false, lanes: current, error: 'Lane name cannot be empty' };
  if (trimmedNew === trimmedOld) return { success: true, lanes: current };
  if (current.includes(trimmedNew)) {
    return { success: false, lanes: current, error: `Lane "${trimmedNew}" already exists in ${unitName}` };
  }

  const updated = current.map((l) => (l === trimmedOld ? trimmedNew : l));
  const key = `${LANES_STORAGE_KEY_PREFIX}${unitName}`;
  localStorage.setItem(key, JSON.stringify(updated));

  // Migrate supervisor assignment to renamed lane if present
  try {
    const currentSup = getLaneSupervisor(trimmedOld);
    if (currentSup) {
      setLaneSupervisor(trimmedNew, currentSup);
    }
  } catch {
    // ignore
  }

  let supabaseError: string | undefined;
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: unitData } = await supabase
        .from('units')
        .select('id')
        .eq('unit_name', unitName)
        .maybeSingle();

      if (unitData?.id) {
        const { data: updatedRows, error } = await supabase
          .from('production_days')
          .update({ lane_name: trimmedNew })
          .eq('unit_id', unitData.id)
          .eq('lane_name', trimmedOld)
          .select();

        if (error) {
          supabaseError = error.message;
          console.warn(`Could not rename lane in Supabase for ${unitName}:`, error);
        } else if (!updatedRows || updatedRows.length === 0) {
          // If no rows existed for old lane in DB, seed new lane for today
          const today = new Date().toISOString().split('T')[0];
          const laneSup = getLaneSupervisor(trimmedNew);
          await supabase.from('production_days').insert({
            unit_id: unitData.id,
            production_date: today,
            lane_name: trimmedNew,
            shift: `Shift 01 (${trimmedNew})`,
            supervisor_name: laneSup.name,
            supervisor_id: laneSup.id,
            worker_name: '',
            worker_id: '',
          });
        }
      }
    } catch (err: any) {
      supabaseError = err.message;
    }
  }

  window.dispatchEvent(
    new CustomEvent('production-lanes-updated', {
      detail: { lanes: updated, unitName, renamed: { oldName: trimmedOld, newName: trimmedNew } },
    })
  );

  return { success: !supabaseError, lanes: updated, error: supabaseError };
}

// Manufacturing Units Master Directory
const DEFAULT_UNITS = ['Unit 01'];
const UNITS_STORAGE_KEY = 'sup_tv_dashboard_units';

export function getAvailableUnits(): string[] {
  try {
    const stored = localStorage.getItem(UNITS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_UNITS;
}

export async function syncUnitsFromSupabase(): Promise<string[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase.from('units').select('unit_name');
      if (data && data.length > 0) {
        const unitsFromDb = data.map(d => d.unit_name).filter(Boolean);
        const current = getAvailableUnits();
        const merged = Array.from(new Set([...current, ...unitsFromDb]));
        localStorage.setItem(UNITS_STORAGE_KEY, JSON.stringify(merged));
        window.dispatchEvent(new CustomEvent('production-units-updated', { detail: { units: merged } }));
        return merged;
      }
    } catch (err) {
      console.warn('Could not sync units from Supabase:', err);
    }
  }
  return getAvailableUnits();
}

export function addAvailableUnit(newUnit: string): string[] {
  const current = getAvailableUnits();
  const trimmed = newUnit.trim();
  if (!trimmed || current.includes(trimmed)) return current;
  const updated = [...current, trimmed];
  localStorage.setItem(UNITS_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('production-units-updated', { detail: { units: updated, added: trimmed } }));

  // Auto-sync to Supabase units table if configured
  if (isSupabaseConfigured && supabase) {
    supabase.from('units').insert({ unit_name: trimmed }).then(({ error }) => {
      if (error && error.code !== '23505') {
        console.warn('Could not insert unit into Supabase:', error);
      }
    });
  }

  return updated;
}

export function deleteAvailableUnit(unitToDelete: string): string[] {
  const current = getAvailableUnits();
  if (current.length <= 1) return current; // Keep at least 1 unit
  const updated = current.filter(u => u !== unitToDelete);
  localStorage.setItem(UNITS_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('production-units-updated', { detail: { units: updated, deleted: unitToDelete } }));
  return updated;
}

// Workers / Employees Master Directory
export interface WorkerItem {
  name: string;
  id: string;
  role?: string;
  department?: string;
  unit_name?: string;
}

// Clean slate: no demo workers
const DEFAULT_WORKERS: WorkerItem[] = [];
const WORKERS_STORAGE_KEY_PREFIX = 'sup_tv_dashboard_workers_';

// One-time initialization to clear old demo cache in user's browser
if (typeof window !== 'undefined') {
  try {
    if (!localStorage.getItem('sup_tv_dashboard_demo_cleared_v2')) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith(LOCAL_STORAGE_KEY_PREFIX) || key === 'sup_tv_dashboard_workers')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem('sup_tv_dashboard_demo_cleared_v2', 'true');
    }
  } catch {
    // ignore
  }
}

export function clearAllLocalDemoData(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith(LOCAL_STORAGE_KEY_PREFIX) ||
          key.startsWith(WORKERS_STORAGE_KEY_PREFIX) ||
          key === 'sup_tv_dashboard_workers')
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    window.dispatchEvent(new CustomEvent('production-data-updated', { detail: {} }));
    window.dispatchEvent(new CustomEvent('production-workers-updated', { detail: { workers: [] } }));
  } catch (err) {
    console.warn('Error clearing local demo data:', err);
  }
}

export function getAvailableWorkers(unitName: string = 'Unit 01'): WorkerItem[] {
  try {
    const key = `${WORKERS_STORAGE_KEY_PREFIX}${unitName}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
    // Fallback for Unit 01: check legacy un-scoped key
    if (unitName === 'Unit 01') {
      const legacy = localStorage.getItem('sup_tv_dashboard_workers');
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const withUnit = parsed.map((w: any) => ({ ...w, unit_name: 'Unit 01' }));
          localStorage.setItem(key, JSON.stringify(withUnit));
          return withUnit;
        }
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_WORKERS;
}

export async function syncWorkersFromSupabase(unitName: string = 'Unit 01'): Promise<WorkerItem[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Try querying with unit_name filter
      let { data, error } = await supabase
        .from('workers')
        .select('*')
        .eq('unit_name', unitName)
        .order('name');

      // 2. If unit_name column doesn't exist yet on Supabase (error 42703), fallback safely
      if (error && (error.code === '42703' || error.message?.includes('unit_name'))) {
        const fallback = await supabase.from('workers').select('*').order('name');
        if (!fallback.error && fallback.data) {
          if (unitName === 'Unit 01') {
            data = fallback.data;
            error = null;
          } else {
            data = [];
            error = null;
          }
        }
      }

      if (!error && data) {
        const mapped: WorkerItem[] = data.map((d: any) => ({
          id: d.worker_id,
          name: d.name,
          role: d.role,
          department: d.department,
          unit_name: d.unit_name || unitName,
        }));
        const key = `${WORKERS_STORAGE_KEY_PREFIX}${unitName}`;
        localStorage.setItem(key, JSON.stringify(mapped));
        window.dispatchEvent(
          new CustomEvent('production-workers-updated', { detail: { workers: mapped, unitName } })
        );
        return mapped;
      }
    } catch (err) {
      console.warn(`Could not sync workers for ${unitName} from Supabase:`, err);
    }
  }
  return getAvailableWorkers(unitName);
}

export async function addAvailableWorker(
  worker: WorkerItem,
  unitName: string = 'Unit 01'
): Promise<{ success: boolean; workers: WorkerItem[]; error?: string }> {
  const current = getAvailableWorkers(unitName);
  const trimmedName = worker.name.trim().toUpperCase();
  const trimmedId = worker.id.trim().toUpperCase();
  const trimmedRole = worker.role?.trim() || '';
  const trimmedDept = worker.department?.trim() || '';
  if (!trimmedName || !trimmedId) return { success: false, workers: current, error: 'Name and ID are required' };
  if (current.some((w) => w.id === trimmedId)) {
    return { success: false, workers: current, error: `Worker with ID "${trimmedId}" is already registered in ${unitName}` };
  }

  let supabaseError: string | undefined;

  // 1. Insert directly to Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      // Try insert with unit_name
      let { error } = await supabase.from('workers').insert({
        worker_id: trimmedId,
        name: trimmedName,
        role: trimmedRole,
        department: trimmedDept,
        unit_name: unitName,
      });

      // If unit_name column doesn't exist yet, insert without unit_name
      if (error && (error.code === '42703' || error.message?.includes('unit_name'))) {
        const fallback = await supabase.from('workers').insert({
          worker_id: trimmedId,
          name: trimmedName,
          role: trimmedRole,
          department: trimmedDept,
        });
        error = fallback.error;
      }

      if (error && error.code !== '23505') {
        supabaseError = error.message;
        console.warn('Could not insert worker into Supabase:', error);
      }
    } catch (err: any) {
      supabaseError = err.message;
    }
  }

  // 2. Keep local cache updated
  const newWorker: WorkerItem = {
    name: trimmedName,
    id: trimmedId,
    role: trimmedRole,
    department: trimmedDept,
    unit_name: unitName,
  };
  const updated = [...current, newWorker];
  const key = `${WORKERS_STORAGE_KEY_PREFIX}${unitName}`;
  localStorage.setItem(key, JSON.stringify(updated));
  window.dispatchEvent(
    new CustomEvent('production-workers-updated', { detail: { workers: updated, unitName } })
  );

  return { success: !supabaseError, workers: updated, error: supabaseError };
}

export async function updateAvailableWorker(
  originalWorkerId: string,
  updatedData: Partial<WorkerItem>,
  unitName: string = 'Unit 01'
): Promise<{ success: boolean; workers: WorkerItem[]; error?: string }> {
  const current = getAvailableWorkers(unitName);
  const trimmedName = updatedData.name !== undefined ? updatedData.name.trim().toUpperCase() : undefined;
  const newId = updatedData.id !== undefined ? updatedData.id.trim().toUpperCase() : originalWorkerId;
  const trimmedRole = updatedData.role !== undefined ? updatedData.role.trim() : undefined;
  const trimmedDept = updatedData.department !== undefined ? updatedData.department.trim() : undefined;

  if (trimmedName === '') return { success: false, workers: current, error: 'Name cannot be empty' };
  if (newId === '') return { success: false, workers: current, error: 'Worker ID cannot be empty' };

  // Check if changing ID conflicts with another worker in this unit
  if (newId !== originalWorkerId && current.some((w) => w.id === newId)) {
    return { success: false, workers: current, error: `Worker ID "${newId}" is already used by another worker in ${unitName}` };
  }

  const updated = current.map((w) => {
    if (w.id === originalWorkerId) {
      return {
        ...w,
        id: newId,
        name: trimmedName !== undefined ? trimmedName : w.name,
        role: trimmedRole !== undefined ? trimmedRole : w.role,
        department: trimmedDept !== undefined ? trimmedDept : w.department,
        unit_name: unitName,
      };
    }
    return w;
  });

  const key = `${WORKERS_STORAGE_KEY_PREFIX}${unitName}`;
  localStorage.setItem(key, JSON.stringify(updated));

  let supabaseError: string | undefined;
  if (isSupabaseConfigured && supabase) {
    try {
      const payload: any = {};
      if (trimmedName !== undefined) payload.name = trimmedName;
      if (newId !== originalWorkerId) payload.worker_id = newId;
      if (trimmedRole !== undefined) payload.role = trimmedRole;
      if (trimmedDept !== undefined) payload.department = trimmedDept;
      payload.unit_name = unitName;

      let { data: updatedRows, error } = await supabase
        .from('workers')
        .update(payload)
        .eq('worker_id', originalWorkerId.trim())
        .select();

      // If unit_name column doesn't exist, retry update without unit_name
      if (error && (error.code === '42703' || error.message?.includes('unit_name'))) {
        delete payload.unit_name;
        const fallback = await supabase
          .from('workers')
          .update(payload)
          .eq('worker_id', originalWorkerId.trim())
          .select();
        error = fallback.error;
        updatedRows = fallback.data;
      }

      if (error) {
        supabaseError = error.message;
        console.warn('Could not update worker in Supabase:', error);
      } else if (!updatedRows || updatedRows.length === 0) {
        // Worker was not yet in Supabase! Insert it now so it is saved in database!
        const insertPayload: any = {
          worker_id: newId,
          name: trimmedName || '',
          role: trimmedRole || '',
          department: trimmedDept || '',
          unit_name: unitName,
        };
        let { error: insErr } = await supabase.from('workers').insert(insertPayload);
        if (insErr && (insErr.code === '42703' || insErr.message?.includes('unit_name'))) {
          delete insertPayload.unit_name;
          const fb = await supabase.from('workers').insert(insertPayload);
          insErr = fb.error;
        }
        if (insErr) {
          supabaseError = insErr.message;
          console.warn('Could not insert worker into Supabase during update:', insErr);
        }
      }
    } catch (err: any) {
      supabaseError = err.message;
    }
  }

  window.dispatchEvent(
    new CustomEvent('production-workers-updated', { detail: { workers: updated, unitName } })
  );

  return { success: !supabaseError, workers: updated, error: supabaseError };
}

export async function deleteAvailableWorker(
  workerId: string,
  unitName: string = 'Unit 01'
): Promise<{ success: boolean; workers: WorkerItem[]; error?: string }> {
  const current = getAvailableWorkers(unitName);
  const trimmedId = workerId.trim();
  const updated = current.filter((w) => w.id !== trimmedId && w.id !== workerId);
  const key = `${WORKERS_STORAGE_KEY_PREFIX}${unitName}`;
  localStorage.setItem(key, JSON.stringify(updated));
  window.dispatchEvent(
    new CustomEvent('production-workers-updated', { detail: { workers: updated, unitName } })
  );

  let supabaseError: string | undefined;
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('workers')
        .delete()
        .eq('worker_id', trimmedId);

      if (error) {
        supabaseError = error.message;
        console.warn('Could not delete worker from Supabase:', error);
      }
    } catch (err: any) {
      supabaseError = err.message;
    }
  }

  return { success: !supabaseError, workers: updated, error: supabaseError };
}

// Supervisors Directory
export interface SupervisorItem {
  name: string;
  id: string;
}

const DEFAULT_SUPERVISORS: SupervisorItem[] = [
  { name: 'R. K. Sharma', id: 'SUP-01' },
  { name: 'P. Verma', id: 'SUP-02' },
  { name: 'A. K. Das', id: 'SUP-03' },
  { name: 'Supervisor', id: 'SUP-04' },
];

const SUPERVISORS_STORAGE_KEY = 'sup_tv_dashboard_supervisors';

export function getAvailableSupervisors(): SupervisorItem[] {
  try {
    const stored = localStorage.getItem(SUPERVISORS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_SUPERVISORS;
}

export function addAvailableSupervisor(supervisor: SupervisorItem): SupervisorItem[] {
  const current = getAvailableSupervisors();
  const trimmedName = supervisor.name.trim();
  const trimmedId = supervisor.id.trim().toUpperCase();
  if (!trimmedName || !trimmedId) return current;
  if (current.some(s => s.name === trimmedName || s.id === trimmedId)) return current;
  const updated = [...current, { name: trimmedName, id: trimmedId }];
  localStorage.setItem(SUPERVISORS_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('production-supervisors-updated', { detail: { supervisors: updated } }));
  return updated;
}

export function deleteAvailableSupervisor(supervisorId: string): SupervisorItem[] {
  const current = getAvailableSupervisors();
  if (current.length <= 1) return current;
  const updated = current.filter(s => s.id !== supervisorId);
  localStorage.setItem(SUPERVISORS_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('production-supervisors-updated', { detail: { supervisors: updated } }));
  return updated;
}

// Dedicated Lane-to-Supervisor Mapping
const LANE_SUPERVISORS_KEY = 'sup_tv_dashboard_lane_supervisors';

const DEFAULT_LANE_SUPERVISORS: Record<string, SupervisorItem> = {
  'Lane 01': { name: 'R. K. Sharma', id: 'SUP-01' },
  'Lane 02': { name: 'P. Verma', id: 'SUP-02' },
  'Lane 03': { name: 'A. K. Das', id: 'SUP-03' },
  'Lane 04': { name: 'Supervisor', id: 'SUP-04' },
};

export function getLaneSupervisor(lane: string): SupervisorItem {
  try {
    const stored = localStorage.getItem(LANE_SUPERVISORS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed[lane]) return parsed[lane];
    }
  } catch {
    // ignore
  }
  return DEFAULT_LANE_SUPERVISORS[lane] || { name: `Supervisor (${lane})`, id: 'SUP-01' };
}

export function setLaneSupervisor(lane: string, supervisor: SupervisorItem): void {
  try {
    const stored = localStorage.getItem(LANE_SUPERVISORS_KEY);
    const mapping = stored ? JSON.parse(stored) : { ...DEFAULT_LANE_SUPERVISORS };
    mapping[lane] = supervisor;
    localStorage.setItem(LANE_SUPERVISORS_KEY, JSON.stringify(mapping));
    window.dispatchEvent(new CustomEvent('production-lane-supervisor-updated', { detail: { lane, supervisor } }));
  } catch {
    // ignore
  }
}

// Get or initialize local storage data
function getLocalData(date: string, lane = 'Lane 01', unitName = 'Unit 01'): DashboardData {
  const keyWithUnit = `${LOCAL_STORAGE_KEY_PREFIX}${unitName}_${date}_${lane}`;
  const legacyKey = `${LOCAL_STORAGE_KEY_PREFIX}${date}_${lane}`;
  const stored = localStorage.getItem(keyWithUnit) || (unitName === 'Unit 01' ? localStorage.getItem(legacyKey) : null);
  const laneSup = getLaneSupervisor(lane);

  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.day) {
        parsed.day.production_date = date;
        parsed.day.lane_name = lane;
        // Always assign the dedicated supervisor for this lane
        parsed.day.supervisor_name = laneSup.name;
        parsed.day.supervisor_id = laneSup.id;
        if (!parsed.unit || !parsed.unit.unit_name) {
          parsed.unit = {
            id: `unit-${unitName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            unit_name: unitName,
          };
        } else {
          parsed.unit.unit_name = unitName;
        }
      }
      return parsed;
    } catch {
      // ignore
    }
  }

  // Get rich, lane-specific initial data for this lane and date
  const initialData = getSeedDataForLane(lane, date);
  if (initialData && initialData.day) {
    initialData.day.production_date = date;
    initialData.day.lane_name = lane;
    initialData.day.supervisor_name = laneSup.name;
    initialData.day.supervisor_id = laneSup.id;
    initialData.unit = {
      id: `unit-${unitName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      unit_name: unitName,
    };
  }
  localStorage.setItem(keyWithUnit, JSON.stringify(initialData));
  return initialData;
}

// Save local storage data
function saveLocalData(date: string, lane: string, unitName: string, data: DashboardData): void {
  const keyWithUnit = `${LOCAL_STORAGE_KEY_PREFIX}${unitName}_${date}_${lane}`;
  const toStore: DashboardData = {
    ...data,
    unit: {
      id: data.unit?.id || `unit-${unitName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      unit_name: unitName,
    },
    day: {
      ...data.day,
      production_date: date,
      lane_name: lane,
    },
  };
  if (toStore.day?.supervisor_name) {
    setLaneSupervisor(lane, {
      name: toStore.day.supervisor_name,
      id: toStore.day.supervisor_id || 'SUP-01',
    });
  }
  localStorage.setItem(keyWithUnit, JSON.stringify(toStore));
  if (unitName === 'Unit 01') {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${date}_${lane}`, JSON.stringify(toStore));
  }
  // Broadcast change across tabs and inside current window
  window.dispatchEvent(new CustomEvent('production-data-updated', { detail: { date, lane, unit: unitName } }));
}

// Fetch dashboard data (Supabase First, Local Fallback)
export async function fetchDashboardData(date: string, lane = 'Lane 01', unitName = 'Unit 01'): Promise<DashboardData> {
  // 1. If Supabase is configured, prioritize live database data
  if (isSupabaseConfigured && supabase) {
    try {
      // 1a. Resolve or create Unit
      let { data: unit, error: unitError } = await supabase
        .from('units')
        .select('*')
        .eq('unit_name', unitName)
        .maybeSingle();

      if (unitError || !unit) {
        const { data: newUnit, error: insertUnitErr } = await supabase
          .from('units')
          .insert({ unit_name: unitName })
          .select()
          .single();
        if (insertUnitErr) {
          console.warn('Could not insert unit in Supabase:', insertUnitErr);
        } else {
          unit = newUnit;
        }
      }

      if (unit?.id) {
        // 1b. Query production_days by unit_id + production_date + lane_name
        let { data: day } = await supabase
          .from('production_days')
          .select('*')
          .eq('unit_id', unit.id)
          .eq('production_date', date)
          .eq('lane_name', lane)
          .maybeSingle();

        // If not found in database, create the day with clean blank state in Supabase
        if (!day) {
          const laneSup = getLaneSupervisor(lane);
          const shiftVal = lane === 'Lane 01' ? 'Shift 01' : `Shift 01 (${lane})`;
          let { data: newDay, error: insertDayErr } = await supabase
            .from('production_days')
            .insert({
              unit_id: unit.id,
              production_date: date,
              shift: shiftVal,
              supervisor_name: laneSup.name,
              supervisor_id: laneSup.id,
              lane_name: lane,
              worker_name: '',
              worker_id: '',
            })
            .select()
            .single();

          if (insertDayErr && insertDayErr.code === '23505') {
            // Unique conflict retry
            const { data: refound } = await supabase
              .from('production_days')
              .select('*')
              .eq('unit_id', unit.id)
              .eq('production_date', date)
              .eq('lane_name', lane)
              .maybeSingle();
            newDay = refound;
          }

          if (newDay) {
            day = newDay;
            // Pre-populate 10 clean blank hourly rows (0s)
            const blankHourly = Array.from({ length: 10 }, (_, i) => ({
              production_day_id: day.id,
              hour: i + 1,
              input_available: 0,
              target: 0,
              actual: 0,
            }));
            await supabase.from('hourly_production').insert(blankHourly);
          }
        }

        if (day) {
          // 1c. Fetch all child tables in parallel
          const [hourlyRes, opsRes, dtSumRes, dtDetRes] = await Promise.all([
            supabase.from('hourly_production').select('*').eq('production_day_id', day.id).order('hour', { ascending: true }),
            supabase.from('critical_operations').select('*').eq('production_day_id', day.id).order('operation_no', { ascending: true }).order('hour', { ascending: true }),
            supabase.from('downtime_summary').select('*').eq('production_day_id', day.id).order('category', { ascending: true }).order('hour', { ascending: true }),
            supabase.from('downtime_details').select('*').eq('production_day_id', day.id).order('id', { ascending: true }),
          ]);

          let hourly = (hourlyRes.data || []) as HourlyProduction[];
          if (hourly.length < 10) {
            const existingHours = new Set(hourly.map(h => h.hour));
            const missing: any[] = [];
            for (let h = 1; h <= 10; h++) {
              if (!existingHours.has(h)) {
                missing.push({
                  production_day_id: day.id,
                  hour: h,
                  input_available: 0,
                  target: 0,
                  actual: 0,
                });
              }
            }
            if (missing.length > 0) {
              await supabase.from('hourly_production').insert(missing);
              hourly = [...hourly, ...missing].sort((a, b) => a.hour - b.hour);
            }
          }

          const liveData: DashboardData = {
            unit,
            day,
            hourly,
            criticalOperations: (opsRes.data || []) as CriticalOperation[],
            downtimeSummary: (dtSumRes.data || []) as DowntimeSummaryItem[],
            downtimeDetails: (dtDetRes.data || []) as DowntimeDetailItem[],
          };

          // Cache in local storage for offline resiliency
          saveLocalData(date, lane, unitName, liveData);
          return liveData;
        }
      }
    } catch (err) {
      console.warn('Supabase query failed, falling back to local storage cache:', err);
    }
  }

  // 2. Check local storage if Supabase is offline or not configured
  const localKey = `${LOCAL_STORAGE_KEY_PREFIX}${unitName}_${date}_${lane}`;
  const legacyKey = `${LOCAL_STORAGE_KEY_PREFIX}${date}_${lane}`;
  const storedLocal = localStorage.getItem(localKey) || (unitName === 'Unit 01' ? localStorage.getItem(legacyKey) : null);
  if (storedLocal) {
    try {
      const parsed = JSON.parse(storedLocal);
      if (parsed && parsed.day) {
        parsed.day.production_date = date;
        parsed.day.lane_name = lane;
        if (!parsed.unit || !parsed.unit.unit_name) {
          parsed.unit = {
            id: `unit-${unitName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            unit_name: unitName,
          };
        } else {
          parsed.unit.unit_name = unitName;
        }
        return parsed;
      }
    } catch {
      // ignore
    }
  }

  // 3. Clean initial fallback
  return getLocalData(date, lane, unitName);
}

// Save all dashboard data with guaranteed Supabase persistence
export async function saveDashboardData(data: DashboardData): Promise<{ success: boolean; error?: string; warning?: string }> {
  const date = data.day.production_date;
  const lane = data.day.lane_name || 'Lane 01';
  const unitName = data.unit?.unit_name || 'Unit 01';

  // Always keep localStorage updated as immediate local backup
  saveLocalData(date, lane, unitName, data);

  if (!isSupabaseConfigured || !supabase) {
    return { success: true, warning: 'Saved locally. Supabase credentials not configured.' };
  }

  try {
    // 1. Ensure Unit exists in Supabase
    let unitId = data.unit?.id;
    const { data: existingUnit } = await supabase
      .from('units')
      .select('id')
      .eq('unit_name', unitName)
      .maybeSingle();

    if (existingUnit?.id) {
      unitId = existingUnit.id;
    } else {
      const { data: newUnit, error: unitErr } = await supabase
        .from('units')
        .insert({ unit_name: unitName })
        .select('id')
        .single();
      if (unitErr) throw unitErr;
      unitId = newUnit.id;
    }

    if (!unitId) throw new Error(`Could not resolve unit ID for ${unitName}`);

    // 2. Ensure Production Day exists in Supabase with a valid UUID
    let productionDayId: string | null = null;
    const shiftVal = lane === 'Lane 01' ? (data.day.shift || 'Shift 01') : `${data.day.shift || 'Shift 01'} (${lane})`;

    // Check if day already exists for this unit + date + lane
    const { data: existingDay } = await supabase
      .from('production_days')
      .select('id')
      .eq('unit_id', unitId)
      .eq('production_date', date)
      .eq('lane_name', lane)
      .maybeSingle();

    if (existingDay?.id) {
      productionDayId = existingDay.id;
      const { error: updateErr } = await supabase
        .from('production_days')
        .update({
          unit_id: unitId,
          shift: shiftVal,
          supervisor_name: data.day.supervisor_name || 'Supervisor',
          supervisor_id: data.day.supervisor_id || 'SUP-01',
          lane_name: lane,
          worker_name: data.day.worker_name || '',
          worker_id: data.day.worker_id || '',
          updated_at: new Date().toISOString(),
        })
        .eq('id', productionDayId);

      if (updateErr) throw updateErr;
    } else {
      // Insert new production day
      let { data: newDay, error: insertErr } = await supabase
        .from('production_days')
        .insert({
          unit_id: unitId,
          production_date: date,
          shift: shiftVal,
          supervisor_name: data.day.supervisor_name || 'Supervisor',
          supervisor_id: data.day.supervisor_id || 'SUP-01',
          lane_name: lane,
          worker_name: data.day.worker_name || '',
          worker_id: data.day.worker_id || '',
        })
        .select('id')
        .single();

      if (insertErr && insertErr.code === '23505') {
        const { data: refound } = await supabase
          .from('production_days')
          .select('id')
          .eq('unit_id', unitId)
          .eq('production_date', date)
          .eq('lane_name', lane)
          .maybeSingle();
        if (refound) newDay = refound;
      }

      if (insertErr && !newDay) throw insertErr;
      productionDayId = newDay!.id;
    }

    if (!productionDayId) throw new Error('Failed to obtain a valid production day ID in database');

    // Update day.id and unit.id with real Supabase UUIDs
    data.day.id = productionDayId;
    data.day.unit_id = unitId;
    if (data.unit) data.unit.id = unitId;
    saveLocalData(date, lane, unitName, data);

    // 3. Upsert Hourly Production using onConflict: production_day_id,hour
    for (const row of data.hourly) {
      const { error: hErr } = await supabase.from('hourly_production').upsert({
        production_day_id: productionDayId,
        hour: row.hour,
        input_available: Number(row.input_available) || 0,
        target: Number(row.target) || 0,
        actual: Number(row.actual) || 0,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'production_day_id,hour' });
      if (hErr) throw hErr;
    }

    // 4. Sync Critical Operations
    const { error: opDelErr } = await supabase.from('critical_operations').delete().eq('production_day_id', productionDayId);
    if (opDelErr) throw opDelErr;
    if (data.criticalOperations.length > 0) {
      const opsToInsert = data.criticalOperations.map(op => ({
        production_day_id: productionDayId,
        operation_no: op.operation_no,
        operation_name: op.operation_name,
        worker_name: op.worker_name,
        worker_id: op.worker_id || '',
        hour: op.hour,
        production: Number(op.production) || 0,
        target: Number(op.target) || 0,
        completed: Boolean(op.completed),
        status: op.status || 'in_progress',
      }));
      const { error: opsErr } = await supabase.from('critical_operations').insert(opsToInsert);
      if (opsErr) throw opsErr;
    }

    // 5. Sync Downtime Summary
    const { error: dsDelErr } = await supabase.from('downtime_summary').delete().eq('production_day_id', productionDayId);
    if (dsDelErr) throw dsDelErr;
    if (data.downtimeSummary.length > 0) {
      const summaryToInsert = data.downtimeSummary.map(ds => ({
        production_day_id: productionDayId,
        category: ds.category,
        hour: ds.hour,
        minutes: Number(ds.minutes) || 0,
      }));
      const { error: dsErr } = await supabase.from('downtime_summary').insert(summaryToInsert);
      if (dsErr) throw dsErr;
    }

    // 6. Sync Downtime Details
    const { error: ddDelErr } = await supabase.from('downtime_details').delete().eq('production_day_id', productionDayId);
    if (ddDelErr) throw ddDelErr;
    if (data.downtimeDetails.length > 0) {
      const detailsToInsert = data.downtimeDetails.map(dd => ({
        production_day_id: productionDayId,
        reason: dd.reason,
        worker_name: dd.worker_name,
        hour: dd.hour,
        minutes: Number(dd.minutes) || 0,
      }));
      const { error: ddErr } = await supabase.from('downtime_details').insert(detailsToInsert);
      if (ddErr) throw ddErr;
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error saving data to Supabase:', err);
    if (err?.code === '42501' || err?.message?.toLowerCase().includes('row-level security') || err?.message?.toLowerCase().includes('policy')) {
      return {
        success: true,
        warning: '✓ Saved locally! (Run the updated schema.sql in Supabase SQL editor to enable cloud writes)',
      };
    }
    return { success: false, error: err.message || 'Failed to save changes to Supabase' };
  }
}

// Real-time subscription hook
export function subscribeToDashboardChanges(
  currentDayId: string,
  onUpdate: () => void
): () => void {
  // 1. Local event listener for same-tab / local storage updates
  const handleLocalUpdate = () => {
    onUpdate();
  };
  window.addEventListener('production-data-updated', handleLocalUpdate);
  window.addEventListener('storage', handleLocalUpdate);

  // 2. Supabase Realtime channel if connected
  let supabaseChannel: any = null;
  if (isSupabaseConfigured && supabase) {
    try {
      supabaseChannel = supabase
        .channel(`prod-day-${currentDayId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'production_days' }, () => onUpdate())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'hourly_production' }, () => onUpdate())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'critical_operations' }, () => onUpdate())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'downtime_summary' }, () => onUpdate())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'downtime_details' }, () => onUpdate())
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Connected to Supabase Realtime channel for production updates');
          }
        });
    } catch (err) {
      console.warn('Realtime subscription error:', err);
    }
  }

  // Return unsubscription cleanup
  return () => {
    window.removeEventListener('production-data-updated', handleLocalUpdate);
    window.removeEventListener('storage', handleLocalUpdate);
    if (supabaseChannel && supabase) {
      supabase.removeChannel(supabaseChannel);
    }
  };
}
