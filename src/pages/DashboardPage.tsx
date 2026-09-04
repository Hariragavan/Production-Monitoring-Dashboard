import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { HourlyProductionChart } from '../components/dashboard/HourlyProductionChart';
import { CriticalOperationsTable } from '../components/dashboard/CriticalOperationsTable';
import { DowntimeSummaryTable } from '../components/dashboard/DowntimeSummaryTable';
import { DowntimeDetailsTable } from '../components/dashboard/DowntimeDetailsTable';
import { fetchDashboardData, subscribeToDashboardChanges, getAvailableLanes, getAvailableUnits } from '../lib/dataService';
import { isSupabaseConfigured } from '../lib/supabase';
import type { DashboardData } from '../types';
import { INITIAL_DEMO_DATA } from '../lib/seedData';
import { RefreshCw } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-01');
  const [selectedUnit, setSelectedUnit] = useState<string>('Unit 01');
  const [availableUnits, setAvailableUnits] = useState<string[]>(getAvailableUnits);
  const [selectedLane, setSelectedLane] = useState<string>('Lane 01');
  const [selectedHour] = useState<number>(4); // Default to current 4th hour
  const [availableLanes, setAvailableLanes] = useState<string[]>(getAvailableLanes);
  const [data, setData] = useState<DashboardData>(INITIAL_DEMO_DATA);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const loadData = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const fetched = await fetchDashboardData(selectedDate, selectedLane, selectedUnit);
      setData(fetched);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [selectedDate, selectedLane, selectedUnit]);

  // Initial load when date, lane, or unit changes
  useEffect(() => {
    loadData(true);
  }, [loadData]);

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

  // Real-time listener for local/cross-tab data updates
  useEffect(() => {
    const handleDataUpdated = (e: any) => {
      if (!e.detail?.date || e.detail.date === selectedDate) {
        loadData(false);
      }
    };
    window.addEventListener('production-data-updated', handleDataUpdated);
    return () => window.removeEventListener('production-data-updated', handleDataUpdated);
  }, [selectedDate, loadData]);

  // Real-time listener + fallback polling for data changes
  useEffect(() => {
    const unsubscribe = subscribeToDashboardChanges(data.day?.id || `${selectedUnit}-${selectedDate}-${selectedLane}`, () => {
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
  }, [data.day?.id, loadData, selectedDate, selectedLane, selectedUnit]);

  const handleEditClick = () => {
    navigate('/edit');
  };

  return (
    <div className="h-screen w-screen max-h-screen overflow-hidden bg-slate-100 flex flex-col justify-between text-slate-900 select-none">
      {/* Top Header Bar with Centered Date Navigation (Excludes Sunday) & Lane Controls */}
      <DashboardHeader
        unitName={selectedUnit}
        availableUnits={availableUnits}
        onUnitChange={setSelectedUnit}
        productionDate={selectedDate}
        supervisorName={data.day?.supervisor_name || 'Supervisor'}
        supervisorId={data.day?.supervisor_id}
        selectedLane={selectedLane}
        availableLanes={availableLanes}
        onLaneChange={setSelectedLane}
        onDateChange={setSelectedDate}
        onEditClick={handleEditClick}
      />

      {/* Main Single-Page Unified Container (Optimized to fit TV screen) */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto px-2.5 py-1.5 min-h-0 overflow-y-auto flex flex-col gap-2">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
            <RefreshCw className="w-10 h-10 text-cyan-700 animate-spin" />
            <p className="text-sm font-bold text-slate-600 tracking-wider uppercase">
              Loading Live TV Dashboard...
            </p>
          </div>
        ) : (
          <>
            {/* 1. TOP: Hourly Output vs Target Progression Chart (Sleek TV fit) */}
            <div className="w-full flex-shrink-0 h-[180px]">
              <HourlyProductionChart hourly={data.hourly} selectedHour={selectedHour} />
            </div>

            {/* 2. Critical Operations Performance Table (Directly after the chart) */}
            <div className="w-full flex-shrink-0">
              <CriticalOperationsTable operations={data.criticalOperations} />
            </div>

            {/* 3. Downtime Summary & Incident Details Tables Side-by-Side (Shrunk with Total) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 pb-1 flex-shrink-0">
              <DowntimeSummaryTable downtimeSummary={data.downtimeSummary} />
              <DowntimeDetailsTable downtimeDetails={data.downtimeDetails} />
            </div>
          </>
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
