import React from 'react';
import { Pencil, Calendar, ChevronLeft, ChevronRight, User, Factory, Layers, Clock } from 'lucide-react';
import { FullscreenButton } from '../common/FullscreenButton';

interface DashboardHeaderProps {
  productionDate: string; // YYYY-MM-DD
  supervisorName: string;
  supervisorId?: string;
  selectedHour: number;
  onHourChange: (hour: number) => void;
  selectedLane: string;
  availableLanes: string[];
  onLaneChange: (lane: string) => void;
  onDateChange: (newDate: string) => void;
  onEditClick: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  productionDate,
  supervisorName,
  supervisorId,
  selectedHour,
  onHourChange,
  selectedLane,
  availableLanes,
  onLaneChange,
  onDateChange,
  onEditClick,
}) => {
  // Navigation helpers for dates
  const handleStepDate = (days: number) => {
    const [y, m, d] = productionDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + days);
    const iso = dateObj.toISOString().split('T')[0];
    onDateChange(iso);
  };

  const handleToday = () => {
    const today = new Date().toISOString().split('T')[0];
    onDateChange(today);
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

      {/* 2. Center: Shift Context Controls (Date Selector without Demo & Hour Dropdown) */}
      <div className="hidden md:flex items-center gap-2 flex-shrink-0">
        {/* Date Selector Badge (No Demo Button) */}
        <div className="h-8 flex items-center gap-1 bg-slate-950/70 border border-slate-700/80 px-2 rounded-lg shadow-inner">
          <Calendar className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mr-0.5" />
          <span className="text-[11px] text-slate-400 font-semibold">Date:</span>

          <button
            onClick={() => handleStepDate(-1)}
            title="Previous Day"
            className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition cursor-pointer"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>

          {/* Direct Date Input */}
          <input
            type="date"
            value={productionDate}
            onChange={(e) => e.target.value && onDateChange(e.target.value)}
            className="bg-slate-900 text-white font-bold text-xs rounded px-1.5 py-0.5 border border-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
            title="Select Production Date"
          />

          <button
            onClick={() => handleStepDate(1)}
            title="Next Day"
            className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition cursor-pointer"
          >
            <ChevronRight className="w-3 h-3" />
          </button>

          <button
            onClick={handleToday}
            title="Set Today's Date"
            className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-600 transition cursor-pointer"
          >
            Today
          </button>
        </div>

        {/* Hourly View Selector Dropdown */}
        <div className="h-8 flex items-center gap-1.5 bg-slate-950/70 border border-amber-500/50 px-2 rounded-lg shadow-inner">
          <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span className="text-[11px] text-slate-300 font-bold uppercase tracking-wider">Hour:</span>
          <select
            id="header-hour-dropdown"
            value={selectedHour}
            onChange={(e) => onHourChange(Number(e.target.value))}
            className="bg-slate-900 text-amber-300 font-black text-xs rounded px-1.5 py-0.5 border border-amber-500/40 focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((h) => {
              let suffix = 'th';
              if (h === 1) suffix = 'st';
              else if (h === 2) suffix = 'nd';
              else if (h === 3) suffix = 'rd';

              const timeRange = `${String(7 + h).padStart(2, '0')}:00 - ${String(8 + h).padStart(2, '0')}:00`;
              return (
                <option key={h} value={h} className="bg-slate-900 text-white font-bold">
                  {h}{suffix} Hour ({timeRange})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* 3. Right: Lane Dropdown + Lane Supervisor + Fullscreen + Edit Button (Guaranteed in frame) */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
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
