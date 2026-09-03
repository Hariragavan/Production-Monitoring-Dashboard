import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { ProductionSummaryKpi } from '../components/dashboard/ProductionSummaryKpi';
import { HourlyProductionChart } from '../components/dashboard/HourlyProductionChart';
import { CriticalOperationsChart } from '../components/dashboard/CriticalOperationsChart';
import { DowntimeDistributionChart } from '../components/dashboard/DowntimeDistributionChart';
import { HourlyProductionTable } from '../components/dashboard/HourlyProductionTable';
import { CriticalOperationsTable } from '../components/dashboard/CriticalOperationsTable';
import { DowntimeSummaryTable } from '../components/dashboard/DowntimeSummaryTable';
import { DowntimeDetailsTable } from '../components/dashboard/DowntimeDetailsTable';
import { fetchDashboardData, subscribeToDashboardChanges, getAvailableLanes } from '../lib/dataService';
import { isSupabaseConfigured } from '../lib/supabase';
import type { DashboardData } from '../types';
import { INITIAL_DEMO_DATA } from '../lib/seedData';
import { RefreshCw } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-01');
  const [selectedLane, setSelectedLane] = useState<string>('Lane 01');
  const [selectedHour, setSelectedHour] = useState<number>(4); // Default to current 4th hour
  const [viewMode, setViewMode] = useState<'charts' | 'table'>('table'); // Table view as default
  const [availableLanes, setAvailableLanes] = useState<string[]>(getAvailableLanes);
  const [data, setData] = useState<DashboardData>(INITIAL_DEMO_DATA);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const loadData = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const fetched = await fetchDashboardData(selectedDate, selectedLane);
      setData(fetched);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [selectedDate, selectedLane]);

  // Initial load when date or lane changes
  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Real-time listener for lanes update
  useEffect(() => {
    const handleLanesUpdated = (e: any) => {
      if (e.detail?.lanes) {
        setAvailableLanes(e.detail.lanes);
      }
    };
    window.addEventListener('production-lanes-updated', handleLanesUpdated);
    return () => window.removeEventListener('production-lanes-updated', handleLanesUpdated);
  }, []);

  // Real-time listener + fallback polling for data changes
  useEffect(() => {
    const unsubscribe = subscribeToDashboardChanges(data.day?.id || `${selectedDate}-${selectedLane}`, () => {
      console.log('Real-time event detected, updating dashboard...');
      loadData(false);
    });

    const interval = setInterval(() => {
      loadData(false);
    }, 15000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [data.day?.id, loadData, selectedDate, selectedLane]);

  const handleEditClick = () => {
    navigate('/edit');
  };

  return (
    <div className="h-screen w-screen max-h-screen overflow-hidden bg-slate-100 flex flex-col justify-between text-slate-900 select-none">
      {/* Top Header Bar with Charts/Table Switcher & Lane Dropdown */}
      <DashboardHeader
        productionDate={selectedDate}
        supervisorName={data.day?.supervisor_name || 'Supervisor'}
        supervisorId={data.day?.supervisor_id}
        selectedHour={selectedHour}
        onHourChange={setSelectedHour}
        selectedLane={selectedLane}
        availableLanes={availableLanes}
        onLaneChange={setSelectedLane}
        onDateChange={setSelectedDate}
        onEditClick={handleEditClick}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Main Single-Screen TV Container (Zero Scroll in Charts mode, neat layout in Table mode) */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto px-3 py-2 min-h-0 overflow-hidden flex flex-col gap-2">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-10 h-10 text-cyan-700 animate-spin" />
            <p className="text-sm font-bold text-slate-600 tracking-wider uppercase">
              Loading Live TV Dashboard...
            </p>
          </div>
        ) : viewMode === 'charts' ? (
          /* CHARTS VIEW MODE */
          <>
            {/* ROW 1: 4 Compact KPI Overview Cards (Current Hour Metrics) */}
            <ProductionSummaryKpi
              hourly={data.hourly}
              downtimeSummary={data.downtimeSummary}
              selectedHour={selectedHour}
            />

            {/* ROW 2: Hourly Production Bar Chart (Shift Progression with selected hour highlighted) */}
            <div className="flex-[1.2] min-h-0 w-full">
              <HourlyProductionChart hourly={data.hourly} selectedHour={selectedHour} />
            </div>

            {/* ROW 3: Critical Operations (Filtered for selected hour) & Downtime Breakdown (Filtered for selected hour) */}
            <div className="flex-1 min-h-0 w-full grid grid-cols-1 lg:grid-cols-12 gap-2.5">
              <div className="lg:col-span-6 h-full min-h-0">
                <CriticalOperationsChart operations={data.criticalOperations} selectedHour={selectedHour} />
              </div>
              <div className="lg:col-span-6 h-full min-h-0">
                <DowntimeDistributionChart
                  downtimeSummary={data.downtimeSummary}
                  downtimeDetails={data.downtimeDetails}
                  selectedHour={selectedHour}
                />
              </div>
            </div>
          </>
        ) : (
          /* WHOLE TABLE DATA FORMAT VIEW MODE */
          <div className="flex-1 w-full min-h-0 overflow-y-auto space-y-3 pr-1">
            {/* 1. Complete 10-Hour Production Schedule Table */}
            <HourlyProductionTable hourly={data.hourly} />

            {/* 2. Complete Critical Operations Performance Table */}
            <CriticalOperationsTable operations={data.criticalOperations} />

            {/* 3. Downtime Category Summary & Incident Details Tables */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 pb-3">
              <DowntimeSummaryTable downtimeSummary={data.downtimeSummary} />
              <DowntimeDetailsTable downtimeDetails={data.downtimeDetails} />
            </div>
          </div>
        )}
      </main>

      {/* Bottom TV Status Strip (Fixed Height: 28px) */}
      <footer className="h-7 flex-shrink-0 w-full px-4 flex items-center justify-between text-[11px] text-slate-600 font-semibold border-t border-slate-300 bg-white/95">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-slate-700">
            {isSupabaseConfigured ? 'Supabase Cloud Sync Active' : 'Local Storage Sync'}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-[#0f3852] font-bold">Active Lane: {selectedLane}</span>
          <span className="text-slate-300">|</span>
          <span className="text-amber-700 font-bold">Active View: Hour {selectedHour}</span>
          <span className="text-slate-300">|</span>
          <span className="text-cyan-800 font-bold uppercase tracking-wider">
            Mode: {viewMode === 'charts' ? 'Visual Charts' : 'Full Tabular Data'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>Date: <strong className="text-slate-700">{selectedDate}</strong></span>
          <span className="text-slate-300">|</span>
          <span>Updated: <strong className="text-slate-700">{lastRefreshed.toLocaleTimeString()}</strong></span>
        </div>
      </footer>
    </div>
  );
};
