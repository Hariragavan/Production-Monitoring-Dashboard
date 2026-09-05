export interface Unit {
  id: string;
  unit_name: string;
  created_at?: string;
}

export interface WorkerItem {
  name: string;
  id: string;
}

export interface ProductionDay {
  id: string;
  unit_id: string;
  production_date: string; // YYYY-MM-DD
  shift: string;
  supervisor_name: string;
  supervisor_id?: string;
  worker_name?: string;
  worker_id?: string;
  lane_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface HourlyProduction {
  id?: string;
  production_day_id?: string;
  hour: number; // 1 to 10
  input_available: number;
  target: number;
  actual: number;
  created_at?: string;
  updated_at?: string;
}

export interface CriticalOperation {
  id?: string;
  production_day_id?: string;
  operation_no: number;
  operation_name: string;
  worker_name: string;
  worker_id: string;
  hour: number; // 1 to 10
  production: number;
  target: number;
  completed?: boolean;
  status?: string;
  pinned?: boolean;
  pinned_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DowntimeSummaryItem {
  id?: string;
  production_day_id?: string;
  category: DowntimeCategory;
  hour: number; // 1 to 10
  minutes: number;
  created_at?: string;
  updated_at?: string;
}

export type DowntimeCategory = 
  | 'Machine Breakdown'
  | 'Line Unbalancing'
  | 'Line Balancing'
  | 'Operator Movement'
  | 'Re work'
  | 'Idle'
  | 'Style Changeover'
  | 'Break'
  | 'Meeting'
  | 'Bobbin'
  | 'No Line Feeding';

export interface DowntimeDetailItem {
  id?: string;
  production_day_id?: string;
  reason: DowntimeCategory | string;
  worker_name: string;
  hour: number; // 1 to 10
  minutes: number;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardData {
  unit: Unit;
  day: ProductionDay;
  hourly: HourlyProduction[];
  criticalOperations: CriticalOperation[];
  downtimeSummary: DowntimeSummaryItem[];
  downtimeDetails: DowntimeDetailItem[];
}
