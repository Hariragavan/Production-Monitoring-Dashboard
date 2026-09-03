import { supabase, isSupabaseConfigured } from './supabase';
import type { DashboardData, HourlyProduction, CriticalOperation, DowntimeSummaryItem, DowntimeDetailItem } from '../types';
import { INITIAL_DEMO_DATA, getSeedDataForLane } from './seedData';

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

const DEFAULT_LANES = ['Lane 01', 'Lane 02', 'Lane 03', 'Lane 04'];
const LANES_STORAGE_KEY = 'sup_tv_dashboard_lanes';

export function getAvailableLanes(): string[] {
  try {
    const stored = localStorage.getItem(LANES_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_LANES;
}

export function addAvailableLane(newLane: string): string[] {
  const current = getAvailableLanes();
  const trimmed = newLane.trim();
  if (!trimmed || current.includes(trimmed)) return current;
  const updated = [...current, trimmed];
  localStorage.setItem(LANES_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('production-lanes-updated', { detail: { lanes: updated } }));
  return updated;
}

export function deleteAvailableLane(laneToDelete: string): string[] {
  const current = getAvailableLanes();
  if (current.length <= 1) return current; // Keep at least 1 lane
  const updated = current.filter(l => l !== laneToDelete);
  localStorage.setItem(LANES_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('production-lanes-updated', { detail: { lanes: updated } }));
  return updated;
}

// Workers / Employees Master Directory
export interface WorkerItem {
  name: string;
  id: string;
}

const DEFAULT_WORKERS: WorkerItem[] = [
  { name: 'SUNIL', id: 'EMP-101' },
  { name: 'MAMATA', id: 'EMP-102' },
  { name: 'UMESH', id: 'EMP-103' },
  { name: 'VIKASH', id: 'EMP-104' },
  { name: 'LAKSHMI', id: 'EMP-105' },
  { name: 'MAYA', id: 'EMP-106' },
  { name: 'KAILASH', id: 'EMP-107' },
  { name: 'RAGHU', id: 'EMP-108' },
  { name: 'GOVIN', id: 'EMP-109' },
  { name: 'MAHESH', id: 'EMP-110' },
  { name: 'DINESH', id: 'EMP-111' },
  { name: 'SHIVO', id: 'EMP-112' },
  { name: 'MINITA', id: 'EMP-113' },
  { name: 'RAKESH', id: 'EMP-114' },
];

const WORKERS_STORAGE_KEY = 'sup_tv_dashboard_workers';

export function getAvailableWorkers(): WorkerItem[] {
  try {
    const stored = localStorage.getItem(WORKERS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_WORKERS;
}

export function addAvailableWorker(worker: WorkerItem): WorkerItem[] {
  const current = getAvailableWorkers();
  const trimmedName = worker.name.trim().toUpperCase();
  const trimmedId = worker.id.trim().toUpperCase();
  if (!trimmedName || !trimmedId) return current;
  if (current.some(w => w.name === trimmedName || w.id === trimmedId)) return current;
  const updated = [...current, { name: trimmedName, id: trimmedId }];
  localStorage.setItem(WORKERS_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('production-workers-updated', { detail: { workers: updated } }));
  return updated;
}

export function deleteAvailableWorker(workerId: string): WorkerItem[] {
  const current = getAvailableWorkers();
  if (current.length <= 1) return current;
  const updated = current.filter(w => w.id !== workerId);
  localStorage.setItem(WORKERS_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('production-workers-updated', { detail: { workers: updated } }));
  return updated;
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
function getLocalData(date: string, lane = 'Lane 01'): DashboardData {
  const key = `${LOCAL_STORAGE_KEY_PREFIX}${date}_${lane}`;
  const stored = localStorage.getItem(key);
  const laneSup = getLaneSupervisor(lane);

  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.day) {
        parsed.day.lane_name = lane;
        // Always assign the dedicated supervisor for this lane
        parsed.day.supervisor_name = laneSup.name;
        parsed.day.supervisor_id = laneSup.id;
      }
      return parsed;
    } catch {
      // ignore
    }
  }

  // Get rich, lane-specific initial data for this lane
  const initialData = getSeedDataForLane(lane, date);
  if (initialData && initialData.day) {
    initialData.day.lane_name = lane;
    initialData.day.supervisor_name = laneSup.name;
    initialData.day.supervisor_id = laneSup.id;
  }
  localStorage.setItem(key, JSON.stringify(initialData));
  return initialData;
}

// Save local storage data
function saveLocalData(date: string, lane: string, data: DashboardData): void {
  const key = `${LOCAL_STORAGE_KEY_PREFIX}${date}_${lane}`;
  if (data.day?.supervisor_name) {
    setLaneSupervisor(lane, {
      name: data.day.supervisor_name,
      id: data.day.supervisor_id || 'SUP-01',
    });
  }
  localStorage.setItem(key, JSON.stringify(data));
  // Broadcast change across tabs and inside current window
  window.dispatchEvent(new CustomEvent('production-data-updated', { detail: { date, lane } }));
}

// Fetch dashboard data (Supabase or Local Fallback)
export async function fetchDashboardData(date: string, lane = 'Lane 01', unitName = 'Unit 01'): Promise<DashboardData> {
  if (!isSupabaseConfigured || !supabase) {
    return getLocalData(date, lane);
  }

  try {
    // 1. Get or create Unit
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
        console.warn('Could not insert unit in Supabase, falling back to local:', insertUnitErr);
        return getLocalData(date, lane);
      }
      unit = newUnit;
    }

    // 2. Get or create production day for date + lane
    let { data: day, error: dayError } = await supabase
      .from('production_days')
      .select('*')
      .eq('unit_id', unit.id)
      .eq('production_date', date)
      .eq('lane_name', lane)
      .maybeSingle();

    if (dayError || !day) {
      // Seed if 2026-09-01 Lane 01 or create blank
      const supervisor = date === '2026-09-01' ? 'R. K. Sharma' : 'Supervisor';
      const { data: newDay, error: insertDayErr } = await supabase
        .from('production_days')
        .insert({
          unit_id: unit.id,
          production_date: date,
          shift: 'Shift 01',
          supervisor_name: supervisor,
          lane_name: lane,
          worker_name: 'Sunil Kumar',
          worker_id: 'EMP-101',
        })
        .select()
        .single();

      if (insertDayErr) {
        console.warn('Could not insert production day in Supabase, falling back to local:', insertDayErr);
        return getLocalData(date, lane);
      }
      day = newDay;

      // Seed hourly 10 rows
      const seedHourly = date === '2026-09-01'
        ? INITIAL_DEMO_DATA.hourly.map(h => ({ ...h, production_day_id: day.id, id: undefined }))
        : Array.from({ length: 10 }, (_, i) => ({
            production_day_id: day.id,
            hour: i + 1,
            input_available: 200,
            target: 150,
            actual: 0,
          }));

      await supabase.from('hourly_production').insert(seedHourly);

      if (date === '2026-09-01') {
        const seedOps = INITIAL_DEMO_DATA.criticalOperations.map(o => ({ ...o, production_day_id: day.id, id: undefined }));
        const seedDs = INITIAL_DEMO_DATA.downtimeSummary.map(d => ({ ...d, production_day_id: day.id, id: undefined }));
        const seedDd = INITIAL_DEMO_DATA.downtimeDetails.map(d => ({ ...d, production_day_id: day.id, id: undefined }));

        await supabase.from('critical_operations').insert(seedOps);
        await supabase.from('downtime_summary').insert(seedDs);
        await supabase.from('downtime_details').insert(seedDd);
      }
    }

    // 3. Fetch all related tables in parallel
    const [hourlyRes, opsRes, dtSumRes, dtDetRes] = await Promise.all([
      supabase.from('hourly_production').select('*').eq('production_day_id', day.id).order('hour', { ascending: true }),
      supabase.from('critical_operations').select('*').eq('production_day_id', day.id).order('operation_no', { ascending: true }).order('hour', { ascending: true }),
      supabase.from('downtime_summary').select('*').eq('production_day_id', day.id).order('category', { ascending: true }).order('hour', { ascending: true }),
      supabase.from('downtime_details').select('*').eq('production_day_id', day.id).order('id', { ascending: true }),
    ]);

    // Ensure 10 hourly rows are always represented
    let hourly = (hourlyRes.data || []) as HourlyProduction[];
    if (hourly.length < 10) {
      const existingHours = new Set(hourly.map(h => h.hour));
      const missing: HourlyProduction[] = [];
      for (let h = 1; h <= 10; h++) {
        if (!existingHours.has(h)) {
          missing.push({
            production_day_id: day.id,
            hour: h,
            input_available: 200,
            target: 150,
            actual: 0,
          });
        }
      }
      if (missing.length > 0) {
        await supabase.from('hourly_production').insert(missing);
        hourly = [...hourly, ...missing].sort((a, b) => a.hour - b.hour);
      }
    }

    const fallbackLaneData = getSeedDataForLane(lane, date);

    return {
      unit,
      day,
      hourly,
      criticalOperations: (opsRes.data && opsRes.data.length > 0)
        ? (opsRes.data as CriticalOperation[])
        : (fallbackLaneData?.criticalOperations || INITIAL_DEMO_DATA.criticalOperations),
      downtimeSummary: (dtSumRes.data && dtSumRes.data.length > 0)
        ? (dtSumRes.data as DowntimeSummaryItem[])
        : (fallbackLaneData?.downtimeSummary || INITIAL_DEMO_DATA.downtimeSummary),
      downtimeDetails: (dtDetRes.data && dtDetRes.data.length > 0)
        ? (dtDetRes.data as DowntimeDetailItem[])
        : (fallbackLaneData?.downtimeDetails || INITIAL_DEMO_DATA.downtimeDetails),
    };
  } catch (err) {
    console.error('Supabase query error, fallback to local storage:', err);
    return getLocalData(date);
  }
}

// Save all dashboard data
export async function saveDashboardData(data: DashboardData): Promise<{ success: boolean; error?: string; warning?: string }> {
  const date = data.day.production_date;
  const lane = data.day.lane_name || 'Lane 01';

  // Always keep localStorage updated as immediate backup
  saveLocalData(date, lane, data);

  if (!isSupabaseConfigured || !supabase) {
    return { success: true };
  }

  try {
    // 1. Update Production Day Info
    const { error: dayErr } = await supabase
      .from('production_days')
      .update({
        shift: data.day.shift,
        supervisor_name: data.day.supervisor_name,
        worker_name: data.day.worker_name || '',
        worker_id: data.day.worker_id || '',
        lane_name: lane,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.day.id);

    if (dayErr) throw dayErr;

    // 2. Upsert Hourly Production
    for (const row of data.hourly) {
      if (row.id && !row.id.startsWith('h-')) {
        await supabase.from('hourly_production').update({
          input_available: row.input_available,
          target: row.target,
          actual: row.actual,
          updated_at: new Date().toISOString(),
        }).eq('id', row.id);
      } else {
        await supabase.from('hourly_production').upsert({
          production_day_id: data.day.id,
          hour: row.hour,
          input_available: row.input_available,
          target: row.target,
          actual: row.actual,
        }, { onConflict: 'production_day_id,hour' });
      }
    }

    // 3. Sync Critical Operations
    await supabase.from('critical_operations').delete().eq('production_day_id', data.day.id);
    if (data.criticalOperations.length > 0) {
      const opsToInsert = data.criticalOperations.map(op => ({
        production_day_id: data.day.id,
        operation_no: op.operation_no,
        operation_name: op.operation_name,
        worker_name: op.worker_name,
        worker_id: op.worker_id || '',
        hour: op.hour,
        production: op.production,
        target: op.target,
        completed: op.completed || false,
        status: op.status || 'in_progress',
      }));
      const { error: opErr } = await supabase.from('critical_operations').insert(opsToInsert);
      if (opErr) throw opErr;
    }

    // 4. Sync Downtime Summary
    await supabase.from('downtime_summary').delete().eq('production_day_id', data.day.id);
    if (data.downtimeSummary.length > 0) {
      const summaryToInsert = data.downtimeSummary.map(ds => ({
        production_day_id: data.day.id,
        category: ds.category,
        hour: ds.hour,
        minutes: ds.minutes,
      }));
      const { error: dsErr } = await supabase.from('downtime_summary').insert(summaryToInsert);
      if (dsErr) throw dsErr;
    }

    // 5. Sync Downtime Details
    await supabase.from('downtime_details').delete().eq('production_day_id', data.day.id);
    if (data.downtimeDetails.length > 0) {
      const detailsToInsert = data.downtimeDetails.map(dd => ({
        production_day_id: data.day.id,
        reason: dd.reason,
        worker_name: dd.worker_name,
        hour: dd.hour,
        minutes: dd.minutes,
      }));
      const { error: ddErr } = await supabase.from('downtime_details').insert(detailsToInsert);
      if (ddErr) throw ddErr;
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error saving data to Supabase:', err);
    // If Supabase has an RLS policy restriction, local storage has already saved the changes!
    if (err?.code === '42501' || err?.message?.toLowerCase().includes('row-level security') || err?.message?.toLowerCase().includes('policy')) {
      return {
        success: true,
        warning: '✓ Changes saved locally! (To sync to Supabase cloud, run: ALTER TABLE critical_operations DISABLE ROW LEVEL SECURITY; in Supabase SQL editor)',
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
