import type { DashboardData } from '../types';

export const INITIAL_DEMO_DATA: DashboardData = {
  unit: {
    id: 'unit-01',
    unit_name: 'Unit 01',
  },
  day: {
    id: 'day-2026-09-01',
    unit_id: 'unit-01',
    production_date: '2026-09-01',
    shift: 'Shift 01',
    supervisor_name: 'R. K. Sharma',
    worker_name: 'Sunil Kumar',
    worker_id: 'EMP-101',
    lane_name: 'Lane 01',
  },
  hourly: [
    { id: 'h-1', hour: 1, input_available: 200, target: 150, actual: 100 },
    { id: 'h-2', hour: 2, input_available: 200, target: 150, actual: 120 },
    { id: 'h-3', hour: 3, input_available: 200, target: 150, actual: 160 },
    { id: 'h-4', hour: 4, input_available: 200, target: 150, actual: 150 },
    { id: 'h-5', hour: 5, input_available: 200, target: 150, actual: 90 },
    { id: 'h-6', hour: 6, input_available: 200, target: 150, actual: 165 },
    { id: 'h-7', hour: 7, input_available: 200, target: 150, actual: 140 },
    { id: 'h-8', hour: 8, input_available: 200, target: 150, actual: 180 },
    { id: 'h-9', hour: 9, input_available: 200, target: 150, actual: 120 },
    { id: 'h-10', hour: 10, input_available: 200, target: 150, actual: 90 },
  ],
  criticalOperations: [
    // 1: SLEEVE ATTACH (Sunil)
    { id: 'co-1-1', operation_no: 1, operation_name: 'SLEEVE ATTACH', worker_name: 'SUNIL', worker_id: 'EMP-101', hour: 1, production: 48, target: 45 },
    { id: 'co-1-2', operation_no: 1, operation_name: 'SLEEVE ATTACH', worker_name: 'SUNIL', worker_id: 'EMP-101', hour: 2, production: 42, target: 45 },
    { id: 'co-1-3', operation_no: 1, operation_name: 'SLEEVE ATTACH', worker_name: 'SUNIL', worker_id: 'EMP-101', hour: 3, production: 47, target: 45 },
    { id: 'co-1-4', operation_no: 1, operation_name: 'SLEEVE ATTACH', worker_name: 'SUNIL', worker_id: 'EMP-101', hour: 4, production: 46, target: 45 },
    { id: 'co-1-5', operation_no: 1, operation_name: 'SLEEVE ATTACH', worker_name: 'SUNIL', worker_id: 'EMP-101', hour: 5, production: 38, target: 45 },
    { id: 'co-1-6', operation_no: 1, operation_name: 'SLEEVE ATTACH', worker_name: 'SUNIL', worker_id: 'EMP-101', hour: 6, production: 49, target: 45 },
    { id: 'co-1-7', operation_no: 1, operation_name: 'SLEEVE ATTACH', worker_name: 'SUNIL', worker_id: 'EMP-101', hour: 7, production: 44, target: 45 },
    { id: 'co-1-8', operation_no: 1, operation_name: 'SLEEVE ATTACH', worker_name: 'SUNIL', worker_id: 'EMP-101', hour: 8, production: 50, target: 45 },
    { id: 'co-1-9', operation_no: 1, operation_name: 'SLEEVE ATTACH', worker_name: 'SUNIL', worker_id: 'EMP-101', hour: 9, production: 41, target: 45 },
    { id: 'co-1-10', operation_no: 1, operation_name: 'SLEEVE ATTACH', worker_name: 'SUNIL', worker_id: 'EMP-101', hour: 10, production: 36, target: 45 },

    // 2: SLEEVE ATTACH (Mamata)
    { id: 'co-2-1', operation_no: 2, operation_name: 'SLEEVE ATTACH', worker_name: 'MAMATA', worker_id: 'EMP-102', hour: 1, production: 29, target: 45 },
    { id: 'co-2-2', operation_no: 2, operation_name: 'SLEEVE ATTACH', worker_name: 'MAMATA', worker_id: 'EMP-102', hour: 2, production: 45, target: 45 },
    { id: 'co-2-3', operation_no: 2, operation_name: 'SLEEVE ATTACH', worker_name: 'MAMATA', worker_id: 'EMP-102', hour: 3, production: 48, target: 45 },
    { id: 'co-2-4', operation_no: 2, operation_name: 'SLEEVE ATTACH', worker_name: 'MAMATA', worker_id: 'EMP-102', hour: 4, production: 44, target: 45 },
    { id: 'co-2-5', operation_no: 2, operation_name: 'SLEEVE ATTACH', worker_name: 'MAMATA', worker_id: 'EMP-102', hour: 5, production: 32, target: 45 },
    { id: 'co-2-6', operation_no: 2, operation_name: 'SLEEVE ATTACH', worker_name: 'MAMATA', worker_id: 'EMP-102', hour: 6, production: 46, target: 45 },
    { id: 'co-2-7', operation_no: 2, operation_name: 'SLEEVE ATTACH', worker_name: 'MAMATA', worker_id: 'EMP-102', hour: 7, production: 40, target: 45 },
    { id: 'co-2-8', operation_no: 2, operation_name: 'SLEEVE ATTACH', worker_name: 'MAMATA', worker_id: 'EMP-102', hour: 8, production: 47, target: 45 },
    { id: 'co-2-9', operation_no: 2, operation_name: 'SLEEVE ATTACH', worker_name: 'MAMATA', worker_id: 'EMP-102', hour: 9, production: 39, target: 45 },
    { id: 'co-2-10', operation_no: 2, operation_name: 'SLEEVE ATTACH', worker_name: 'MAMATA', worker_id: 'EMP-102', hour: 10, production: 35, target: 45 },

    // 3: SIDE SEAM (Umesh)
    { id: 'co-3-1', operation_no: 3, operation_name: 'SIDE SEAM', worker_name: 'UMESH', worker_id: 'EMP-103', hour: 1, production: 36, target: 35 },
    { id: 'co-3-2', operation_no: 3, operation_name: 'SIDE SEAM', worker_name: 'UMESH', worker_id: 'EMP-103', hour: 2, production: 36, target: 35 },
    { id: 'co-3-3', operation_no: 3, operation_name: 'SIDE SEAM', worker_name: 'UMESH', worker_id: 'EMP-103', hour: 3, production: 38, target: 35 },
    { id: 'co-3-4', operation_no: 3, operation_name: 'SIDE SEAM', worker_name: 'UMESH', worker_id: 'EMP-103', hour: 4, production: 35, target: 35 },
    { id: 'co-3-5', operation_no: 3, operation_name: 'SIDE SEAM', worker_name: 'UMESH', worker_id: 'EMP-103', hour: 5, production: 28, target: 35 },
    { id: 'co-3-6', operation_no: 3, operation_name: 'SIDE SEAM', worker_name: 'UMESH', worker_id: 'EMP-103', hour: 6, production: 37, target: 35 },
    { id: 'co-3-7', operation_no: 3, operation_name: 'SIDE SEAM', worker_name: 'UMESH', worker_id: 'EMP-103', hour: 7, production: 35, target: 35 },
    { id: 'co-3-8', operation_no: 3, operation_name: 'SIDE SEAM', worker_name: 'UMESH', worker_id: 'EMP-103', hour: 8, production: 39, target: 35 },
    { id: 'co-3-9', operation_no: 3, operation_name: 'SIDE SEAM', worker_name: 'UMESH', worker_id: 'EMP-103', hour: 9, production: 34, target: 35 },
    { id: 'co-3-10', operation_no: 3, operation_name: 'SIDE SEAM', worker_name: 'UMESH', worker_id: 'EMP-103', hour: 10, production: 30, target: 35 },

    // 4: SIDE SEAM (Vikash / Lakshmi)
    { id: 'co-4-1', operation_no: 4, operation_name: 'SIDE SEAM', worker_name: 'VIKASH', worker_id: 'EMP-104', hour: 1, production: 25, target: 35 },
    { id: 'co-4-2', operation_no: 4, operation_name: 'SIDE SEAM', worker_name: 'LAKSHMI', worker_id: 'EMP-105', hour: 2, production: 37, target: 35 },
    { id: 'co-4-3', operation_no: 4, operation_name: 'SIDE SEAM', worker_name: 'LAKSHMI', worker_id: 'EMP-105', hour: 3, production: 36, target: 35 },
    { id: 'co-4-4', operation_no: 4, operation_name: 'SIDE SEAM', worker_name: 'LAKSHMI', worker_id: 'EMP-105', hour: 4, production: 35, target: 35 },
    { id: 'co-4-5', operation_no: 4, operation_name: 'SIDE SEAM', worker_name: 'LAKSHMI', worker_id: 'EMP-105', hour: 5, production: 26, target: 35 },
    { id: 'co-4-6', operation_no: 4, operation_name: 'SIDE SEAM', worker_name: 'LAKSHMI', worker_id: 'EMP-105', hour: 6, production: 38, target: 35 },
    { id: 'co-4-7', operation_no: 4, operation_name: 'SIDE SEAM', worker_name: 'LAKSHMI', worker_id: 'EMP-105', hour: 7, production: 33, target: 35 },
    { id: 'co-4-8', operation_no: 4, operation_name: 'SIDE SEAM', worker_name: 'LAKSHMI', worker_id: 'EMP-105', hour: 8, production: 40, target: 35 },
    { id: 'co-4-9', operation_no: 4, operation_name: 'SIDE SEAM', worker_name: 'LAKSHMI', worker_id: 'EMP-105', hour: 9, production: 32, target: 35 },
    { id: 'co-4-10', operation_no: 4, operation_name: 'SIDE SEAM', worker_name: 'LAKSHMI', worker_id: 'EMP-105', hour: 10, production: 28, target: 35 },

    // 5: NECK RIB ATTACH (Maya / Kailash)
    { id: 'co-5-1', operation_no: 5, operation_name: 'NECK RIB ATTACH', worker_name: 'MAYA', worker_id: 'EMP-106', hour: 1, production: 26, target: 30 },
    { id: 'co-5-2', operation_no: 5, operation_name: 'NECK RIB ATTACH', worker_name: 'KAILASH', worker_id: 'EMP-107', hour: 2, production: 32, target: 30 },
    { id: 'co-5-3', operation_no: 5, operation_name: 'NECK RIB ATTACH', worker_name: 'KAILASH', worker_id: 'EMP-107', hour: 3, production: 31, target: 30 },
    { id: 'co-5-4', operation_no: 5, operation_name: 'NECK RIB ATTACH', worker_name: 'KAILASH', worker_id: 'EMP-107', hour: 4, production: 30, target: 30 },
    { id: 'co-5-5', operation_no: 5, operation_name: 'NECK RIB ATTACH', worker_name: 'KAILASH', worker_id: 'EMP-107', hour: 5, production: 22, target: 30 },
    { id: 'co-5-6', operation_no: 5, operation_name: 'NECK RIB ATTACH', worker_name: 'KAILASH', worker_id: 'EMP-107', hour: 6, production: 33, target: 30 },
    { id: 'co-5-7', operation_no: 5, operation_name: 'NECK RIB ATTACH', worker_name: 'KAILASH', worker_id: 'EMP-107', hour: 7, production: 29, target: 30 },
    { id: 'co-5-8', operation_no: 5, operation_name: 'NECK RIB ATTACH', worker_name: 'KAILASH', worker_id: 'EMP-107', hour: 8, production: 34, target: 30 },
    { id: 'co-5-9', operation_no: 5, operation_name: 'NECK RIB ATTACH', worker_name: 'KAILASH', worker_id: 'EMP-107', hour: 9, production: 28, target: 30 },
    { id: 'co-5-10', operation_no: 5, operation_name: 'NECK RIB ATTACH', worker_name: 'KAILASH', worker_id: 'EMP-107', hour: 10, production: 24, target: 30 },

    // 6: NECK RIB ATTACH (Raghu / Lakshmi)
    { id: 'co-6-1', operation_no: 6, operation_name: 'NECK RIB ATTACH', worker_name: 'RAGHU', worker_id: 'EMP-108', hour: 1, production: 20, target: 30 },
    { id: 'co-6-2', operation_no: 6, operation_name: 'NECK RIB ATTACH', worker_name: 'LAKSHMI', worker_id: 'EMP-105', hour: 2, production: 30, target: 30 },
    { id: 'co-6-3', operation_no: 6, operation_name: 'NECK RIB ATTACH', worker_name: 'LAKSHMI', worker_id: 'EMP-105', hour: 3, production: 32, target: 30 },
    { id: 'co-6-4', operation_no: 6, operation_name: 'NECK RIB ATTACH', worker_name: 'LAKSHMI', worker_id: 'EMP-105', hour: 4, production: 30, target: 30 },
    { id: 'co-6-5', operation_no: 6, operation_name: 'NECK RIB ATTACH', worker_name: 'LAKSHMI', worker_id: 'EMP-105', hour: 5, production: 23, target: 30 },
    { id: 'co-6-6', operation_no: 6, operation_name: 'NECK RIB ATTACH', worker_name: 'LAKSHMI', worker_id: 'EMP-105', hour: 6, production: 32, target: 30 },
    { id: 'co-6-7', operation_no: 6, operation_name: 'NECK RIB ATTACH', worker_name: 'LAKSHMI', worker_id: 'EMP-105', hour: 7, production: 29, target: 30 },
    { id: 'co-6-8', operation_no: 6, operation_name: 'NECK RIB ATTACH', worker_name: 'LAKSHMI', worker_id: 'EMP-105', hour: 8, production: 33, target: 30 },
    { id: 'co-6-9', operation_no: 6, operation_name: 'NECK RIB ATTACH', worker_name: 'LAKSHMI', worker_id: 'EMP-105', hour: 9, production: 27, target: 30 },
    { id: 'co-6-10', operation_no: 6, operation_name: 'NECK RIB ATTACH', worker_name: 'LAKSHMI', worker_id: 'EMP-105', hour: 10, production: 22, target: 30 },

    // 7: BOTTOM HEM (Govin / Vikash)
    { id: 'co-7-1', operation_no: 7, operation_name: 'BOTTOM HEM', worker_name: 'GOVIN', worker_id: 'EMP-109', hour: 1, production: 42, target: 40 },
    { id: 'co-7-2', operation_no: 7, operation_name: 'BOTTOM HEM', worker_name: 'VIKASH', worker_id: 'EMP-104', hour: 2, production: 40, target: 40 },
    { id: 'co-7-3', operation_no: 7, operation_name: 'BOTTOM HEM', worker_name: 'VIKASH', worker_id: 'EMP-104', hour: 3, production: 43, target: 40 },
    { id: 'co-7-4', operation_no: 7, operation_name: 'BOTTOM HEM', worker_name: 'VIKASH', worker_id: 'EMP-104', hour: 4, production: 40, target: 40 },
    { id: 'co-7-5', operation_no: 7, operation_name: 'BOTTOM HEM', worker_name: 'VIKASH', worker_id: 'EMP-104', hour: 5, production: 33, target: 40 },
    { id: 'co-7-6', operation_no: 7, operation_name: 'BOTTOM HEM', worker_name: 'VIKASH', worker_id: 'EMP-104', hour: 6, production: 44, target: 40 },
    { id: 'co-7-7', operation_no: 7, operation_name: 'BOTTOM HEM', worker_name: 'VIKASH', worker_id: 'EMP-104', hour: 7, production: 39, target: 40 },
    { id: 'co-7-8', operation_no: 7, operation_name: 'BOTTOM HEM', worker_name: 'VIKASH', worker_id: 'EMP-104', hour: 8, production: 45, target: 40 },
    { id: 'co-7-9', operation_no: 7, operation_name: 'BOTTOM HEM', worker_name: 'VIKASH', worker_id: 'EMP-104', hour: 9, production: 38, target: 40 },
    { id: 'co-7-10', operation_no: 7, operation_name: 'BOTTOM HEM', worker_name: 'VIKASH', worker_id: 'EMP-104', hour: 10, production: 30, target: 40 },

    // 8: BOTTOM HEM (Raghu / Mahesh)
    { id: 'co-8-1', operation_no: 8, operation_name: 'BOTTOM HEM', worker_name: 'RAGHU', worker_id: 'EMP-108', hour: 1, production: 40, target: 40 },
    { id: 'co-8-2', operation_no: 8, operation_name: 'BOTTOM HEM', worker_name: 'MAHESH', worker_id: 'EMP-110', hour: 2, production: 40, target: 40 },
    { id: 'co-8-3', operation_no: 8, operation_name: 'BOTTOM HEM', worker_name: 'MAHESH', worker_id: 'EMP-110', hour: 3, production: 41, target: 40 },
    { id: 'co-8-4', operation_no: 8, operation_name: 'BOTTOM HEM', worker_name: 'MAHESH', worker_id: 'EMP-110', hour: 4, production: 40, target: 40 },
    { id: 'co-8-5', operation_no: 8, operation_name: 'BOTTOM HEM', worker_name: 'MAHESH', worker_id: 'EMP-110', hour: 5, production: 31, target: 40 },
    { id: 'co-8-6', operation_no: 8, operation_name: 'BOTTOM HEM', worker_name: 'MAHESH', worker_id: 'EMP-110', hour: 6, production: 43, target: 40 },
    { id: 'co-8-7', operation_no: 8, operation_name: 'BOTTOM HEM', worker_name: 'MAHESH', worker_id: 'EMP-110', hour: 7, production: 38, target: 40 },
    { id: 'co-8-8', operation_no: 8, operation_name: 'BOTTOM HEM', worker_name: 'MAHESH', worker_id: 'EMP-110', hour: 8, production: 44, target: 40 },
    { id: 'co-8-9', operation_no: 8, operation_name: 'BOTTOM HEM', worker_name: 'MAHESH', worker_id: 'EMP-110', hour: 9, production: 37, target: 40 },
    { id: 'co-8-10', operation_no: 8, operation_name: 'BOTTOM HEM', worker_name: 'MAHESH', worker_id: 'EMP-110', hour: 10, production: 31, target: 40 },
  ],
  downtimeSummary: [
    // Machine Breakdown (Yellow)
    { id: 'ds-1-1', category: 'Machine Breakdown', hour: 1, minutes: 35 },
    { id: 'ds-1-2', category: 'Machine Breakdown', hour: 2, minutes: 15 },
    { id: 'ds-1-3', category: 'Machine Breakdown', hour: 3, minutes: 0 },
    { id: 'ds-1-4', category: 'Machine Breakdown', hour: 4, minutes: 10 },
    { id: 'ds-1-5', category: 'Machine Breakdown', hour: 5, minutes: 25 },
    { id: 'ds-1-6', category: 'Machine Breakdown', hour: 6, minutes: 5 },
    { id: 'ds-1-7', category: 'Machine Breakdown', hour: 7, minutes: 12 },
    { id: 'ds-1-8', category: 'Machine Breakdown', hour: 8, minutes: 0 },
    { id: 'ds-1-9', category: 'Machine Breakdown', hour: 9, minutes: 18 },
    { id: 'ds-1-10', category: 'Machine Breakdown', hour: 10, minutes: 22 },

    // Line Unbalancing (Pink)
    { id: 'ds-2-1', category: 'Line Unbalancing', hour: 1, minutes: 40 },
    { id: 'ds-2-2', category: 'Line Unbalancing', hour: 2, minutes: 25 },
    { id: 'ds-2-3', category: 'Line Unbalancing', hour: 3, minutes: 5 },
    { id: 'ds-2-4', category: 'Line Unbalancing', hour: 4, minutes: 0 },
    { id: 'ds-2-5', category: 'Line Unbalancing', hour: 5, minutes: 20 },
    { id: 'ds-2-6', category: 'Line Unbalancing', hour: 6, minutes: 8 },
    { id: 'ds-2-7', category: 'Line Unbalancing', hour: 7, minutes: 15 },
    { id: 'ds-2-8', category: 'Line Unbalancing', hour: 8, minutes: 4 },
    { id: 'ds-2-9', category: 'Line Unbalancing', hour: 9, minutes: 14 },
    { id: 'ds-2-10', category: 'Line Unbalancing', hour: 10, minutes: 30 },

    // Operator Movement (Deep Teal)
    { id: 'ds-3-1', category: 'Operator Movement', hour: 1, minutes: 62 },
    { id: 'ds-3-2', category: 'Operator Movement', hour: 2, minutes: 75 },
    { id: 'ds-3-3', category: 'Operator Movement', hour: 3, minutes: 12 },
    { id: 'ds-3-4', category: 'Operator Movement', hour: 4, minutes: 10 },
    { id: 'ds-3-5', category: 'Operator Movement', hour: 5, minutes: 35 },
    { id: 'ds-3-6', category: 'Operator Movement', hour: 6, minutes: 10 },
    { id: 'ds-3-7', category: 'Operator Movement', hour: 7, minutes: 20 },
    { id: 'ds-3-8', category: 'Operator Movement', hour: 8, minutes: 5 },
    { id: 'ds-3-9', category: 'Operator Movement', hour: 9, minutes: 25 },
    { id: 'ds-3-10', category: 'Operator Movement', hour: 10, minutes: 40 },

    // Re work (Green)
    { id: 'ds-4-1', category: 'Re work', hour: 1, minutes: 25 },
    { id: 'ds-4-2', category: 'Re work', hour: 2, minutes: 0 },
    { id: 'ds-4-3', category: 'Re work', hour: 3, minutes: 8 },
    { id: 'ds-4-4', category: 'Re work', hour: 4, minutes: 5 },
    { id: 'ds-4-5', category: 'Re work', hour: 5, minutes: 15 },
    { id: 'ds-4-6', category: 'Re work', hour: 6, minutes: 0 },
    { id: 'ds-4-7', category: 'Re work', hour: 7, minutes: 8 },
    { id: 'ds-4-8', category: 'Re work', hour: 8, minutes: 2 },
    { id: 'ds-4-9', category: 'Re work', hour: 9, minutes: 10 },
    { id: 'ds-4-10', category: 'Re work', hour: 10, minutes: 18 },

    // Idle (Red)
    { id: 'ds-5-1', category: 'Idle', hour: 1, minutes: 42 },
    { id: 'ds-5-2', category: 'Idle', hour: 2, minutes: 34 },
    { id: 'ds-5-3', category: 'Idle', hour: 3, minutes: 0 },
    { id: 'ds-5-4', category: 'Idle', hour: 4, minutes: 0 },
    { id: 'ds-5-5', category: 'Idle', hour: 5, minutes: 20 },
    { id: 'ds-5-6', category: 'Idle', hour: 6, minutes: 5 },
    { id: 'ds-5-7', category: 'Idle', hour: 7, minutes: 10 },
    { id: 'ds-5-8', category: 'Idle', hour: 8, minutes: 0 },
    { id: 'ds-5-9', category: 'Idle', hour: 9, minutes: 15 },
    { id: 'ds-5-10', category: 'Idle', hour: 10, minutes: 25 },

    // Style Changeover (Orange)
    { id: 'ds-6-1', category: 'Style Changeover', hour: 1, minutes: 55 },
    { id: 'ds-6-2', category: 'Style Changeover', hour: 2, minutes: 70 },
    { id: 'ds-6-3', category: 'Style Changeover', hour: 3, minutes: 0 },
    { id: 'ds-6-4', category: 'Style Changeover', hour: 4, minutes: 0 },
    { id: 'ds-6-5', category: 'Style Changeover', hour: 5, minutes: 10 },
    { id: 'ds-6-6', category: 'Style Changeover', hour: 6, minutes: 0 },
    { id: 'ds-6-7', category: 'Style Changeover', hour: 7, minutes: 5 },
    { id: 'ds-6-8', category: 'Style Changeover', hour: 8, minutes: 0 },
    { id: 'ds-6-9', category: 'Style Changeover', hour: 9, minutes: 10 },
    { id: 'ds-6-10', category: 'Style Changeover', hour: 10, minutes: 20 },
  ],
  downtimeDetails: [
    // Hour 1
    { id: 'dd-1-1', reason: 'Machine Breakdown', worker_name: 'SHIVO', hour: 1, minutes: 20 },
    { id: 'dd-1-2', reason: 'Machine Breakdown', worker_name: 'MINITA', hour: 1, minutes: 15 },
    { id: 'dd-1-3', reason: 'Operator Movement', worker_name: 'DINESH', hour: 1, minutes: 9 },
    { id: 'dd-1-4', reason: 'Re work', worker_name: 'KALAM', hour: 1, minutes: 12 },
    { id: 'dd-1-5', reason: 'Idle', worker_name: 'VIJAY', hour: 1, minutes: 35 },
    { id: 'dd-1-6', reason: 'Style Changeover', worker_name: 'MAMATA', hour: 1, minutes: 55 },

    // Hour 2
    { id: 'dd-2-1', reason: 'Machine Breakdown', worker_name: 'SUNIL', hour: 2, minutes: 40 },
    { id: 'dd-2-2', reason: 'Machine Breakdown', worker_name: 'RAKESH', hour: 2, minutes: 25 },
    { id: 'dd-2-3', reason: 'Operator Movement', worker_name: 'VIKASH', hour: 2, minutes: 20 },
    { id: 'dd-2-4', reason: 'Re work', worker_name: 'UMESH', hour: 2, minutes: 7 },
    { id: 'dd-2-5', reason: 'Idle', worker_name: 'MAHESH', hour: 2, minutes: 12 },
    { id: 'dd-2-6', reason: 'Style Changeover', worker_name: 'MAMATA', hour: 2, minutes: 70 },

    // Hour 3
    { id: 'dd-3-1', reason: 'Machine Breakdown', worker_name: 'SUNIL', hour: 3, minutes: 15 },
    { id: 'dd-3-2', reason: 'Line Unbalancing', worker_name: 'LAKSHMI', hour: 3, minutes: 15 },
    { id: 'dd-3-3', reason: 'Operator Movement', worker_name: 'GOVIN', hour: 3, minutes: 10 },

    // Hour 4 (Default Active Hour)
    { id: 'dd-4-1', reason: 'Machine Breakdown', worker_name: 'SUNIL', hour: 4, minutes: 25 },
    { id: 'dd-4-2', reason: 'Line Unbalancing', worker_name: 'MAYA', hour: 4, minutes: 10 },
    { id: 'dd-4-3', reason: 'Operator Movement', worker_name: 'RAGHU', hour: 4, minutes: 10 },

    // Hour 5
    { id: 'dd-5-1', reason: 'Line Unbalancing', worker_name: 'MAMATA', hour: 5, minutes: 10 },
    { id: 'dd-5-2', reason: 'Idle', worker_name: 'VIJAY', hour: 5, minutes: 20 },
    { id: 'dd-5-3', reason: 'Style Changeover', worker_name: 'DINESH', hour: 5, minutes: 10 },

    // Hour 6
    { id: 'dd-6-1', reason: 'Re work', worker_name: 'UMESH', hour: 6, minutes: 15 },
    { id: 'dd-6-2', reason: 'Idle', worker_name: 'KAILASH', hour: 6, minutes: 5 },

    // Hour 7
    { id: 'dd-7-1', reason: 'Machine Breakdown', worker_name: 'RAKESH', hour: 7, minutes: 20 },
    { id: 'dd-7-2', reason: 'Line Unbalancing', worker_name: 'KALAM', hour: 7, minutes: 10 },
    { id: 'dd-7-3', reason: 'Idle', worker_name: 'SHIVO', hour: 7, minutes: 10 },
    { id: 'dd-7-4', reason: 'Style Changeover', worker_name: 'MAMATA', hour: 7, minutes: 5 },

    // Hour 8
    { id: 'dd-8-1', reason: 'Machine Breakdown', worker_name: 'SUNIL', hour: 8, minutes: 25 },
    { id: 'dd-8-2', reason: 'Machine Breakdown', worker_name: 'MINITA', hour: 8, minutes: 15 },
    { id: 'dd-8-3', reason: 'Operator Movement', worker_name: 'VIKASH', hour: 8, minutes: 10 },
    { id: 'dd-8-4', reason: 'Re work', worker_name: 'MAHESH', hour: 8, minutes: 12 },

    // Hour 9
    { id: 'dd-9-1', reason: 'Line Unbalancing', worker_name: 'GOVIN', hour: 9, minutes: 15 },
    { id: 'dd-9-2', reason: 'Idle', worker_name: 'VIJAY', hour: 9, minutes: 15 },
    { id: 'dd-9-3', reason: 'Style Changeover', worker_name: 'DINESH', hour: 9, minutes: 10 },

    // Hour 10
    { id: 'dd-10-1', reason: 'Machine Breakdown', worker_name: 'SHIVO', hour: 10, minutes: 20 },
    { id: 'dd-10-2', reason: 'Re work', worker_name: 'UMESH', hour: 10, minutes: 18 },
    { id: 'dd-10-3', reason: 'Idle', worker_name: 'KALAM', hour: 10, minutes: 25 },
    { id: 'dd-10-4', reason: 'Style Changeover', worker_name: 'MAMATA', hour: 10, minutes: 20 },
  ],
};

// Generates distinct lane-specific and date-specific seed data
export function getSeedDataForLane(lane: string, date = '2026-09-01'): DashboardData {
  // Demo Shift data for 2026-09-01 Lane 01
  if (lane === 'Lane 01' && date === '2026-09-01') {
    return {
      ...INITIAL_DEMO_DATA,
      day: {
        ...INITIAL_DEMO_DATA.day,
        production_date: '2026-09-01',
        lane_name: 'Lane 01',
        supervisor_name: 'R. K. Sharma',
        supervisor_id: 'SUP-01',
      },
    };
  }

  // If not the demo day, generate a clean, date-specific initial shift template
  if (date !== '2026-09-01') {
    const isL2 = lane === 'Lane 02';
    const isL3 = lane === 'Lane 03';
    const supName = isL2 ? 'P. Verma' : isL3 ? 'A. K. Das' : 'R. K. Sharma';
    const supId = isL2 ? 'SUP-02' : isL3 ? 'SUP-03' : 'SUP-01';

    return {
      unit: { id: 'unit-01', unit_name: 'Unit 01' },
      day: {
        id: `day-${date}-${lane.replace(/\s+/g, '-').toLowerCase()}`,
        unit_id: 'unit-01',
        production_date: date,
        shift: 'Shift 01',
        supervisor_name: supName,
        supervisor_id: supId,
        lane_name: lane,
      },
      hourly: Array.from({ length: 10 }, (_, i) => ({
        id: `h-${i + 1}-${date}-${lane}`,
        hour: i + 1,
        input_available: 200,
        target: 150,
        actual: 0,
      })),
      criticalOperations: [
        // Operation 1: SLEEVE ATTACH (Sunil)
        ...Array.from({ length: 10 }, (_, i) => ({
          id: `co-1-${i + 1}-${date}`,
          operation_no: 1,
          operation_name: 'SLEEVE ATTACH',
          worker_name: 'SUNIL',
          worker_id: 'EMP-101',
          hour: i + 1,
          production: 0,
          target: 45,
        })),
        // Operation 2: SIDE SEAM (Umesh)
        ...Array.from({ length: 10 }, (_, i) => ({
          id: `co-2-${i + 1}-${date}`,
          operation_no: 2,
          operation_name: 'SIDE SEAM',
          worker_name: 'UMESH',
          worker_id: 'EMP-103',
          hour: i + 1,
          production: 0,
          target: 35,
        })),
        // Operation 3: NECK RIB ATTACH (Kailash)
        ...Array.from({ length: 10 }, (_, i) => ({
          id: `co-3-${i + 1}-${date}`,
          operation_no: 3,
          operation_name: 'NECK RIB ATTACH',
          worker_name: 'KAILASH',
          worker_id: 'EMP-107',
          hour: i + 1,
          production: 0,
          target: 30,
        })),
      ],
      downtimeSummary: [],
      downtimeDetails: [],
    };
  }

  if (lane === 'Lane 02') {
    return {
      unit: { id: 'unit-01', unit_name: 'Unit 01' },
      day: {
        id: `day-${date}-lane-02`,
        unit_id: 'unit-01',
        production_date: date,
        shift: 'Shift 01',
        supervisor_name: 'P. Verma',
        supervisor_id: 'SUP-02',
        lane_name: 'Lane 02',
      },
      hourly: [
        { id: 'h-1-l2', hour: 1, input_available: 180, target: 140, actual: 125 },
        { id: 'h-2-l2', hour: 2, input_available: 180, target: 140, actual: 135 },
        { id: 'h-3-l2', hour: 3, input_available: 180, target: 140, actual: 150 },
        { id: 'h-4-l2', hour: 4, input_available: 180, target: 140, actual: 142 },
        { id: 'h-5-l2', hour: 5, input_available: 180, target: 140, actual: 110 },
        { id: 'h-6-l2', hour: 6, input_available: 180, target: 140, actual: 148 },
        { id: 'h-7-l2', hour: 7, input_available: 180, target: 140, actual: 138 },
        { id: 'h-8-l2', hour: 8, input_available: 180, target: 140, actual: 155 },
        { id: 'h-9-l2', hour: 9, input_available: 180, target: 140, actual: 130 },
        { id: 'h-10-l2', hour: 10, input_available: 180, target: 140, actual: 115 },
      ],
      criticalOperations: [
        { id: 'co-l2-1-4', operation_no: 1, operation_name: 'SLEEVE ATTACH', worker_name: 'VIKASH', worker_id: 'EMP-104', hour: 4, production: 44, target: 40 },
        { id: 'co-l2-2-4', operation_no: 2, operation_name: 'SIDE SEAM', worker_name: 'LAKSHMI', worker_id: 'EMP-105', hour: 4, production: 38, target: 35 },
        { id: 'co-l2-3-4', operation_no: 3, operation_name: 'NECK RIB ATTACH', worker_name: 'MAYA', worker_id: 'EMP-106', hour: 4, production: 32, target: 30 },
        { id: 'co-l2-4-4', operation_no: 4, operation_name: 'BOTTOM HEM', worker_name: 'KAILASH', worker_id: 'EMP-107', hour: 4, production: 42, target: 40 },
      ],
      downtimeSummary: [
        { id: 'ds-l2-1', category: 'Machine Breakdown', hour: 4, minutes: 15 },
        { id: 'ds-l2-2', category: 'Line Unbalancing', hour: 4, minutes: 10 },
        { id: 'ds-l2-3', category: 'Idle', hour: 4, minutes: 5 },
      ],
      downtimeDetails: [
        { id: 'dd-l2-1', reason: 'Machine Breakdown', worker_name: 'LAKSHMI', hour: 4, minutes: 15 },
        { id: 'dd-l2-2', reason: 'Line Unbalancing', worker_name: 'VIKASH', hour: 4, minutes: 10 },
      ],
    };
  }

  if (lane === 'Lane 03') {
    return {
      unit: { id: 'unit-01', unit_name: 'Unit 01' },
      day: {
        id: `day-${date}-lane-03`,
        unit_id: 'unit-01',
        production_date: date,
        shift: 'Shift 01',
        supervisor_name: 'A. K. Das',
        supervisor_id: 'SUP-03',
        lane_name: 'Lane 03',
      },
      hourly: [
        { id: 'h-1-l3', hour: 1, input_available: 210, target: 160, actual: 150 },
        { id: 'h-2-l3', hour: 2, input_available: 210, target: 160, actual: 165 },
        { id: 'h-3-l3', hour: 3, input_available: 210, target: 160, actual: 170 },
        { id: 'h-4-l3', hour: 4, input_available: 210, target: 160, actual: 162 },
        { id: 'h-5-l3', hour: 5, input_available: 210, target: 160, actual: 140 },
        { id: 'h-6-l3', hour: 6, input_available: 210, target: 160, actual: 175 },
        { id: 'h-7-l3', hour: 7, input_available: 210, target: 160, actual: 160 },
        { id: 'h-8-l3', hour: 8, input_available: 210, target: 160, actual: 180 },
        { id: 'h-9-l3', hour: 9, input_available: 210, target: 160, actual: 155 },
        { id: 'h-10-l3', hour: 10, input_available: 210, target: 160, actual: 145 },
      ],
      criticalOperations: [
        { id: 'co-l3-1-4', operation_no: 1, operation_name: 'SLEEVE ATTACH', worker_name: 'RAGHU', worker_id: 'EMP-108', hour: 4, production: 48, target: 45 },
        { id: 'co-l3-2-4', operation_no: 2, operation_name: 'SIDE SEAM', worker_name: 'GOVIN', worker_id: 'EMP-109', hour: 4, production: 36, target: 35 },
        { id: 'co-l3-3-4', operation_no: 3, operation_name: 'BOTTOM HEM', worker_name: 'MAHESH', worker_id: 'EMP-110', hour: 4, production: 42, target: 40 },
      ],
      downtimeSummary: [
        { id: 'ds-l3-1', category: 'Operator Movement', hour: 4, minutes: 12 },
        { id: 'ds-l3-2', category: 'Re work', hour: 4, minutes: 8 },
      ],
      downtimeDetails: [
        { id: 'dd-l3-1', reason: 'Operator Movement', worker_name: 'RAGHU', hour: 4, minutes: 12 },
      ],
    };
  }

  // Fallback for Lane 04 or any other lane
  return {
    unit: { id: 'unit-01', unit_name: 'Unit 01' },
    day: {
      id: `day-${date}-${lane.replace(/\s+/g, '-').toLowerCase()}`,
      unit_id: 'unit-01',
      production_date: date,
      shift: 'Shift 01',
      supervisor_name: 'Supervisor',
      supervisor_id: 'SUP-04',
      lane_name: lane,
    },
    hourly: Array.from({ length: 10 }, (_, i) => ({
      id: `h-${i + 1}-${date}-${lane}`,
      hour: i + 1,
      input_available: 190,
      target: 145,
      actual: 130 + ((i * 7) % 25),
    })),
    criticalOperations: [
      { id: `co-${lane}-1-4`, operation_no: 1, operation_name: 'SLEEVE ATTACH', worker_name: 'DINESH', worker_id: 'EMP-111', hour: 4, production: 42, target: 40 },
      { id: `co-${lane}-2-4`, operation_no: 2, operation_name: 'SIDE SEAM', worker_name: 'SHIVO', worker_id: 'EMP-112', hour: 4, production: 34, target: 35 },
    ],
    downtimeSummary: [
      { id: `ds-${lane}-1`, category: 'Machine Breakdown', hour: 4, minutes: 10 },
      { id: `ds-${lane}-2`, category: 'Idle', hour: 4, minutes: 15 },
    ],
    downtimeDetails: [
      { id: `dd-${lane}-1`, reason: 'Machine Breakdown', worker_name: 'DINESH', hour: 4, minutes: 10 },
    ],
  };
}
