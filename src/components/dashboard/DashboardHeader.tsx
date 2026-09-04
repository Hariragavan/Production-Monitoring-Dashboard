import React from 'react';
import {
  Pencil,
  Calendar,
  ChevronLeft,
  ChevronRight,
  User,
  Factory,
  Layers,
  Building2,
} from 'lucide-react';
import { FullscreenButton } from '../common/FullscreenButton';

interface DashboardHeaderProps {
  unitName?: string;
  availableUnits?: string[];
  onUnitChange?: (newUnit: string) => void;
  productionDate: string; // YYYY-MM-DD
  supervisorName: string;
  supervisorId?: string;
  selectedLane: string;
  availableLanes: string[];
  onLaneChange: (lane: string) => void;
  onDateChange: (newDate: string) => void;
  onEditClick: () => void;
}

// Local date formatter avoiding UTC shifts
const formatLocalDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  unitName,
  availableUnits,
  onUnitChange,
  productionDate,
  supervisorName,
  supervisorId,
  selectedLane,
  availableLanes,
  onLaneChange,
  onDateChange,
  onEditClick,
}) => {
  // Navigation helper for stepping dates (skips Sunday)
  const handleStepDate = (direction: number) => {
    const [y, m, d] = productionDate.split('-').map(Number);
    // Midday (12:00) prevents any daylight saving or timezone boundary flips
    const dateObj = new Date(y, m - 1, d, 12, 0, 0);
    dateObj.setDate(dateObj.getDate() + direction);

    // Skip Sunday (0 is Sunday: factory weekly off)
    if (dateObj.getDay() === 0) {
      dateObj.setDate(dateObj.getDate() + (direction > 0 ? 1 : -1));
    }

    onDateChange(formatLocalDate(dateObj));
  };

  // Direct date picker handler (skips Sunday)
  const handleDateSelect = (val: string) => {
    if (!val) return;
    const [y, m, d] = val.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d, 12, 0, 0);

    // If user picks Sunday, automatically forward to Monday
    if (dateObj.getDay() === 0) {
      dateObj.setDate(dateObj.getDate() + 1);
    }

    onDateChange(formatLocalDate(dateObj));
  };

  const handleToday = () => {
    const today = new Date();
    // If today is Sunday, move to next working day (Monday)
    if (today.getDay() === 0) {
      today.setDate(today.getDate() + 1);
    }
    onDateChange(formatLocalDate(today));
  };

  return (
    <header className="h-14 w-full flex-shrink-0 bg-gradient-to-r from-[#0a2538] via-[#0f3852] to-[#144766] text-white px-3 sm:px-4 flex items-center justify-between shadow-md border-b border-cyan-500/40 select-none overflow-x-hidden">
      {/* 1. Left: Factory Icon + Stacked Title (PRODUCTION on top, MONITORING DASHBOARD on bottom) */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-600/30 border border-cyan-400/40 text-cyan-300 shadow-inner flex-shrink-0">
          <Factory className="w-4 h-4" />
        </div>
        <div className="flex flex-col justify-center leading-none">
          <span className="text-[10px] sm:text-[11px] font-black tracking-widest text-cyan-300 uppercase leading-none">
            PRODUCTION
          </span>
          <span className="text-xs sm:text-sm font-black tracking-wide text-white uppercase drop-shadow-sm leading-none mt-1">
            MONITORING DASHBOARD
          </span>
        </div>
      </div>

      {/* 2. Center: Date Selector Badge Centered */}
      <div className="hidden md:flex items-center justify-center flex-1">
        <div className="h-8 flex items-center gap-1.5 bg-slate-950/70 border border-slate-700/80 px-2.5 rounded-lg shadow-inner">
          <Calendar className="w-3.5 h-3.5 text-white flex-shrink-0 mr-0.5" />
          <span className="text-[11px] text-white font-bold">Date:</span>

          <button
            onClick={() => handleStepDate(-1)}
            title="Previous Working Day (Skips Sunday)"
            className="p-1 hover:bg-slate-800 text-white rounded transition cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Direct Date Input with white calendar icon */}
          <input
            type="date"
            value={productionDate}
            onChange={(e) => handleDateSelect(e.target.value)}
            className="bg-slate-900 text-white font-bold text-xs rounded px-1.5 py-0.5 border border-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer [color-scheme:dark]"
            title="Select Production Date (Excludes Sunday)"
          />

          <button
            onClick={() => handleStepDate(1)}
            title="Next Working Day (Skips Sunday)"
            className="p-1 hover:bg-slate-800 text-white rounded transition cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleToday}
            title="Set Current Working Date"
            className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-white rounded border border-slate-600 transition cursor-pointer ml-0.5"
          >
            Today
          </button>
        </div>
      </div>

      {/* 3. Right: Unit Dropdown, Lane Dropdown, Dedicated Supervisor, Fullscreen, Edit Button */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {/* Unit Dropdown Badge */}
        {availableUnits && availableUnits.length > 0 && onUnitChange && (
          <div className="h-8 flex items-center gap-1 bg-slate-950/80 border border-cyan-500/50 px-2 rounded-lg shadow-inner">
            <Building2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <span className="text-[11px] text-slate-300 font-bold uppercase tracking-wider hidden sm:inline">Unit:</span>
            <select
              id="unit-dropdown-select"
              value={unitName || 'Unit 01'}
              onChange={(e) => onUnitChange(e.target.value)}
              className="bg-slate-900 text-cyan-300 font-black text-xs rounded px-1.5 py-0.5 border border-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
            >
              {availableUnits.map((unit) => (
                <option key={unit} value={unit} className="bg-slate-900 text-white font-bold">
                  {unit}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Lane Dropdown Badge */}
        <div className="h-8 flex items-center gap-1 bg-slate-950/80 border border-cyan-500/50 px-2 rounded-lg shadow-inner">
          <Layers className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
          <span className="text-[11px] text-slate-300 font-bold uppercase tracking-wider">Lane:</span>
          <select
            id="lane-dropdown-select"
            value={selectedLane}
            onChange={(e) => onLaneChange(e.target.value)}
            className="bg-slate-900 text-cyan-300 font-black text-xs rounded px-1.5 py-0.5 border border-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
          >
            {availableLanes.map((lane) => (
              <option key={lane} value={lane} className="bg-slate-900 text-white font-bold">
                {lane}
              </option>
            ))}
          </select>
        </div>

        {/* Dedicated Supervisor Badge for Selected Lane */}
        <div className="h-8 flex items-center gap-1 bg-slate-950/80 border border-amber-500/40 px-2 rounded-lg shadow-inner">
          <User className="w-3 h-3 text-amber-400 flex-shrink-0" />
          <span className="text-[11px] text-slate-400 font-semibold hidden lg:inline">Supervisor:</span>
          <span className="text-[11px] font-bold text-amber-300 whitespace-nowrap">
            {supervisorName || 'Unassigned'}
            {supervisorId && (
              <span className="text-amber-200/70 font-mono text-[10px] ml-1">({supervisorId})</span>
            )}
          </span>
        </div>

        {/* Compact Icon Fullscreen Toggle */}
        <FullscreenButton className="h-8 w-8 flex-shrink-0" showText={false} />

        {/* Edit Button: Guaranteed in frame with flex-shrink-0 */}
        <button
          onClick={onEditClick}
          id="btn-edit-data"
          className="h-8 inline-flex items-center gap-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black tracking-wider uppercase shadow-sm transition active:scale-95 cursor-pointer border border-amber-300 flex-shrink-0"
        >
          <Pencil className="w-3.5 h-3.5 text-slate-950" />
          <span>Edit</span>
        </button>
      </div>
    </header>
  );
};
