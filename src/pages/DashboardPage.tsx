import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { HourlyProductionChart } from '../components/dashboard/HourlyProductionChart';
import { CriticalOperationsTable } from '../components/dashboard/CriticalOperationsTable';
import { DowntimeSummaryTable } from '../components/dashboard/DowntimeSummaryTable';
import { DowntimeDetailsTable } from '../components/dashboard/DowntimeDetailsTable';
import {
  fetchDashboardData,
  subscribeToDashboardChanges,
  getAvailableLanes,
  getAvailableUnits,
  syncLanesFromSupabase,
  syncUnitsFromSupabase,
  getTodayDateString,
} from '../lib/dataService';
import { isSupabaseConfigured } from '../lib/supabase';
import type { DashboardData } from '../types';
import { INITIAL_DEMO_DATA } from '../lib/seedData';
import { RefreshCw } from 'lucide-react';

import { startupDiagnostic } from '../lib/startupDiagnostic';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString);
  const [selectedUnit, setSelectedUnit] = useState<string>('Unit 01');
  const [availableUnits, setAvailableUnits] = useState<string[]>(getAvailableUnits);
  const [selectedLane, setSelectedLane] = useState<string>(() => {
    const lanes = getAvailableLanes('Unit 01');
    return lanes[0] || '';
  });
  const [selectedHour] = useState<number>(4); // Default to current 4th hour
  const [availableLanes, setAvailableLanes] = useState<string[]>(() => getAvailableLanes('Unit 01'));
  const [data, setData] = useState<DashboardData>(INITIAL_DEMO_DATA);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'connected' | 'offline'>('idle');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Log mounting for TV diagnostics
  useEffect(() => {
    startupDiagnostic.log('DashboardPage mounted - UI rendered immediately', 'success');
  }, []);

  // Sync available lanes for selectedUnit and units from database across all devices
  useEffect(() => {
    syncLanesFromSupabase(selectedUnit).then((lanes) => {
      if (lanes && lanes.length > 0) setAvailableLanes(lanes);
    });
    syncUnitsFromSupabase().then((units) => {
      if (units && units.length > 0) setAvailableUnits(units);
    });
  }, [selectedUnit]);

  // Unit change handler ensuring lanes are switched to the unit
  const handleUnitChange = (newUnit: string) => {
    setSelectedUnit(newUnit);
    const lanes = getAvailableLanes(newUnit);
    setAvailableLanes(lanes);
    const nextLane = lanes.includes(selectedLane) ? selectedLane : (lanes[0] || '');
    setSelectedLane(nextLane);
    syncLanesFromSupabase(newUnit).then((synced) => {
      if (synced && synced.length > 0) {
        setAvailableLanes(synced);
        if (!synced.includes(nextLane)) {
          setSelectedLane(synced[0]);
        }
      }
    });
  };

  const isFetchingRef = useRef(false);

  const loadData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsSyncing(true);
    startupDiagnostic.log(`Fetching dashboard data for ${selectedUnit} ${selectedDate} ${selectedLane}`);

    try {
      const fetched = await fetchDashboardData(selectedDate, selectedLane, selectedUnit);
      if (fetched) {
        setData(fetched);
        setLastRefreshed(new Date());
        setSyncStatus('connected');
        startupDiagnostic.log('Dashboard data fetched successfully', 'success');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setSyncStatus('offline');
      startupDiagnostic.log('Dashboard data fetch failed, using offline cache', 'warn', err);
    } finally {
      setIsSyncing(false);
      isFetchingRef.current = false;
    }
  }, [selectedDate, selectedLane, selectedUnit]);

  // Initial load when date, lane, or unit changes
  useEffect(() => {
    loadData();
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

  // Real-time listener for local/cross-tab data updates
  useEffect(() => {
    const handleDataUpdated = (e: any) => {
      if (!e.detail?.date || e.detail.date === selectedDate) {
        loadData();
      }
    };
    window.addEventListener('production-data-updated', handleDataUpdated);
    return () => window.removeEventListener('production-data-updated', handleDataUpdated);
  }, [selectedDate, loadData]);

  // Real-time listener + fallback polling for data changes (deferred subscription to ensure fast startup)
  useEffect(() => {
    let unsubscribe = () => {};
    // Delay Realtime subscription by 1.5 seconds so initial render and mount are 100% instantaneous
    const timer = setTimeout(() => {
      const channelKey = `${selectedUnit}_${selectedDate}_${selectedLane}`;
      try {
        unsubscribe = subscribeToDashboardChanges(channelKey, () => {
          loadData();
        });
      } catch (err) {
        console.warn('[TV] Realtime subscription deferred error:', err);
      }
    }, 1500);

    // 5-minute auto-refresh cycle for continuous TV dashboard display
    const FIVE_MINUTES_MS = 5 * 60 * 1000;
    const interval = setInterval(() => {
      loadData();
    }, FIVE_MINUTES_MS);

    return () => {
      clearTimeout(timer);
      unsubscribe();
      clearInterval(interval);
    };
  }, [selectedUnit, selectedDate, selectedLane, loadData]);

  const handleEditClick = () => {
    navigate('/edit');
  };

  return (
    <div className="h-screen w-screen max-h-screen overflow-hidden bg-slate-100 flex flex-col justify-between text-slate-900 select-none">
      {/* Top Header Bar with Centered Date Navigation (Excludes Sunday) & Lane Controls */}
      <DashboardHeader
        unitName={selectedUnit}
        availableUnits={availableUnits}
        onUnitChange={handleUnitChange}
        productionDate={selectedDate}
        supervisorName={data.day?.supervisor_name || 'Supervisor'}
        supervisorId={data.day?.supervisor_id}
        selectedLane={selectedLane}
        availableLanes={availableLanes}
        onLaneChange={setSelectedLane}
        onDateChange={setSelectedDate}
        onEditClick={handleEditClick}
      />

      {/* Main Single-Page Unified Container (Optimized to fit TV screen - Renders UI immediately) */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto px-2.5 py-1.5 min-h-0 overflow-y-auto flex flex-col gap-2">
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
      </main>

      {/* Bottom TV Status Strip (Fixed Height: 28px) */}
      <footer className="h-7 flex-shrink-0 w-full px-4 flex items-center justify-between text-[11px] text-slate-600 font-semibold border-t border-slate-300 bg-white/95">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              syncStatus === 'offline' ? 'bg-amber-500' : 'bg-emerald-500'
            } ${isSyncing ? 'animate-spin' : 'animate-pulse'}`}
          ></span>
          <span className="text-slate-700">
            {isSyncing
              ? 'Syncing Live Cloud Data...'
              : syncStatus === 'offline'
                ? 'Local Cache / Offline Mode'
                : isSupabaseConfigured
                  ? 'Supabase Cloud Sync Active'
                  : 'Local Storage Sync'}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-[#0f3852] font-bold">Active Lane: {selectedLane || 'All Lanes'}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Date: <strong className="text-slate-700">{selectedDate}</strong></span>
          <span className="text-slate-300">|</span>
          <span>Updated: <strong className="text-slate-700">{lastRefreshed.toLocaleTimeString()}</strong></span>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={() => loadData()}
            title="Click to refresh now (auto-refreshes every 5 mins)"
            className="flex items-center gap-1 text-cyan-800 hover:text-cyan-900 font-bold transition cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-cyan-600' : ''}`} />
            <span>Auto: 5 mins</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
