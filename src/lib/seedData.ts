import type { DashboardData } from '../types';

const getInitialTodayDate = (): string => {
  const d = new Date();
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const INITIAL_BLANK_DATA: DashboardData = {
  unit: {
    id: 'unit-01',
    unit_name: 'Unit 01',
  },
  day: {
    id: 'day-clean',
    unit_id: 'unit-01',
    production_date: getInitialTodayDate(),
    shift: 'Shift 01',
    supervisor_name: 'Supervisor',
    lane_name: 'Lane 01',
  },
  hourly: Array.from({ length: 10 }, (_, i) => ({
    id: `h-${i + 1}`,
    hour: i + 1,
    input_available: 0,
    target: 0,
    actual: 0,
  })),
  criticalOperations: [],
  downtimeSummary: [],
  downtimeDetails: [],
};

// Export as INITIAL_DEMO_DATA for backward compatibility
export const INITIAL_DEMO_DATA = INITIAL_BLANK_DATA;

// Get blank clean template for any lane and date
export function getSeedDataForLane(lane: string, date: string, unitName = 'Unit 01'): DashboardData {
  return {
    unit: {
      id: `unit-${unitName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      unit_name: unitName,
    },
    day: {
      id: `day-${date}-${lane.replace(/\s+/g, '-').toLowerCase()}`,
      unit_id: `unit-${unitName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      production_date: date,
      shift: 'Shift 01',
      supervisor_name: 'Supervisor',
      lane_name: lane,
    },
    hourly: Array.from({ length: 10 }, (_, i) => ({
      id: `h-${i + 1}-${date}-${lane}`,
      hour: i + 1,
      input_available: 0,
      target: 0,
      actual: 0,
    })),
    criticalOperations: [],
    downtimeSummary: [],
    downtimeDetails: [],
  };
}
