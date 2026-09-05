import React, { useState, useEffect } from 'react';
import type { DowntimeDetailItem, DowntimeCategory } from '../../types';
import { Plus, Trash2, Clock, AlertTriangle, CheckCircle2, Copy } from 'lucide-react';
import { CategoryDot } from '../common/StatusBadge';
import { formatDuration, getAvailableWorkers, syncWorkersFromSupabase, type WorkerItem } from '../../lib/dataService';

interface DowntimeDetailsEditorProps {
  downtimeDetails: DowntimeDetailItem[];
  onChange: (details: DowntimeDetailItem[]) => void;
  unitName?: string;
}

const REASONS: DowntimeCategory[] = [
  'Machine Breakdown',
  'Line Unbalancing',
  'Line Balancing',
  'Operator Movement',
  'Re work',
  'Idle',
  'Style Changeover',
  'Break',
  'Meeting',
  'Bobbin',
  'No Line Feeding',
];

export const DowntimeDetailsEditor: React.FC<DowntimeDetailsEditorProps> = ({
  downtimeDetails,
  onChange,
  unitName = 'Unit 01',
}) => {
  const [activeHour, setActiveHour] = useState<number>(1);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [availableWorkers, setAvailableWorkers] = useState<WorkerItem[]>(() => getAvailableWorkers(unitName));

  useEffect(() => {
    setAvailableWorkers(getAvailableWorkers(unitName));
    syncWorkersFromSupabase(unitName).then((synced) => {
      if (Array.isArray(synced)) {
        setAvailableWorkers(synced);
      }
    });
    const handleWorkersUpdated = (e: any) => {
      if (e.detail?.workers && (!e.detail?.unitName || e.detail?.unitName === unitName)) {
        setAvailableWorkers(e.detail.workers);
      }
    };
    window.addEventListener('production-workers-updated', handleWorkersUpdated);
    return () => window.removeEventListener('production-workers-updated', handleWorkersUpdated);
  }, [unitName]);

  // Suffix helper
  const getSuffix = (h: number) => {
    if (h === 1) return 'st';
    if (h === 2) return 'nd';
    if (h === 3) return 'rd';
    return 'th';
  };

  // Filter incidents for currently active hour
  const currentHourDetails = downtimeDetails.filter((d) => d.hour === activeHour);
  const hourTotalMinutes = currentHourDetails.reduce((sum, d) => sum + (Number(d.minutes) || 0), 0);

  // Update a field of an incident directly
  const handleUpdateField = (
    id: string | undefined,
    field: keyof DowntimeDetailItem,
    value: any
  ) => {
    const updated = downtimeDetails.map((item) => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    onChange(updated);
  };

  // Add new downtime incident for current hour
  const handleAddIncident = () => {
    const defaultWorker = availableWorkers[(currentHourDetails.length) % availableWorkers.length] || { name: 'WORKER', id: 'EMP-01' };
    const defaultReason = REASONS[(currentHourDetails.length) % REASONS.length];

    const newItem: DowntimeDetailItem = {
      id: `dd-${activeHour}-${Date.now()}`,
      reason: defaultReason,
      worker_name: defaultWorker.name,
      hour: activeHour,
      minutes: 15,
    };

    onChange([...downtimeDetails, newItem]);
  };

  // Delete an incident
  const handleDeleteIncident = (id: string | undefined) => {
    const updated = downtimeDetails.filter((item) => item.id !== id);
    onChange(updated);
  };

  // Copy incidents from previous hour
  const handleCopyFromHour = (sourceHour: number) => {
    const sourceItems = downtimeDetails.filter((d) => d.hour === sourceHour);
    if (sourceItems.length === 0) return;

    // Filter out existing for activeHour
    const otherItems = downtimeDetails.filter((d) => d.hour !== activeHour);

    const clonedItems: DowntimeDetailItem[] = sourceItems.map((item) => ({
      ...item,
      id: `dd-${activeHour}-${Date.now()}-${Math.random()}`,
      hour: activeHour,
    }));

    onChange([...otherItems, ...clonedItems]);
    setFeedbackMsg(`✓ Copied ${clonedItems.length} incident(s) from ${sourceHour}${getSuffix(sourceHour)} Hour!`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>Hourly Downtime Stoppage Incidents</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Log specific stoppage occurrences hour by hour, selecting category reason, involved operator, and lost minutes.
          </p>
        </div>

        {feedbackMsg && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-300 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{feedbackMsg}</span>
          </div>
        )}
      </div>

      {/* 10-HOUR SELECTOR BUTTON STRIP */}
      <div>
        <span className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
          Select Shift Hour to View &amp; Log Downtime:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-1.5">
          {Array.from({ length: 10 }, (_, i) => {
            const hourNum = i + 1;
            const suffix = getSuffix(hourNum);
            const isSelected = activeHour === hourNum;
            const incidentsCount = downtimeDetails.filter((d) => d.hour === hourNum).length;
            const totalMins = downtimeDetails
              .filter((d) => d.hour === hourNum)
              .reduce((s, d) => s + (Number(d.minutes) || 0), 0);

            return (
              <button
                key={hourNum}
                type="button"
                onClick={() => setActiveHour(hourNum)}
                className={`px-2 py-2 rounded-lg border text-center transition cursor-pointer flex flex-col items-center justify-between ${
                  isSelected
                    ? 'bg-[#134665] text-white border-[#0f3852] shadow-sm ring-2 ring-cyan-500/50'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Clock className={`w-3 h-3 ${isSelected ? 'text-cyan-300' : 'text-slate-400'}`} />
                  <span className="font-extrabold text-xs">{hourNum}{suffix} Hr</span>
                </div>
                <div className="mt-1 text-[10px] font-semibold">
                  <span
                    className={
                      isSelected
                        ? 'text-cyan-200'
                        : totalMins > 0
                        ? 'text-rose-700 font-bold'
                        : 'text-slate-400'
                    }
                  >
                    {totalMins > 0 ? `${incidentsCount} stops • ${formatDuration(totalMins, 'short')}` : '0m lost'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTIVE HOUR SUMMARY BAR & CONTROLS */}
      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-[10px] font-black text-rose-700 uppercase tracking-wider block">
              Active Stoppage Hour
            </span>
            <span className="text-base font-black text-slate-900">
              {activeHour}{getSuffix(activeHour)} Shift Hour
            </span>
          </div>

          <div className="h-8 w-px bg-slate-300 hidden sm:block"></div>

          <div className="flex items-center gap-4 text-xs font-bold text-slate-700">
            <div>
              <span className="text-slate-400 text-[10px] block uppercase">Incidents Logged:</span>
              <span className="industrial-digits font-black text-slate-900">
                {currentHourDetails.length} Stoppages
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block uppercase">Total Lost Time:</span>
              <span className="industrial-digits font-black text-rose-700 text-sm">
                {formatDuration(hourTotalMinutes, 'long')}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {activeHour > 1 && (
            <button
              type="button"
              onClick={() => handleCopyFromHour(activeHour - 1)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs"
              title={`Copy incidents from ${activeHour - 1}${getSuffix(activeHour - 1)} Hour`}
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Copy from {activeHour - 1}{getSuffix(activeHour - 1)} Hr</span>
            </button>
          )}

          <button
            type="button"
            id="btn-add-downtime-incident"
            onClick={handleAddIncident}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-black uppercase tracking-wider shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Stoppage Incident</span>
          </button>
        </div>
      </div>

      {/* HOURLY DOWNTIME INCIDENTS TABLE */}
      {currentHourDetails.length === 0 ? (
        <div className="p-10 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center flex flex-col items-center justify-center gap-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          <div>
            <h4 className="text-sm font-bold text-slate-800">
              Zero downtime incidents recorded for {activeHour}{getSuffix(activeHour)} Hour!
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Production ran smoothly with no recorded stoppages during this hour.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddIncident}
            className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer mt-1"
          >
            + Log Stoppage Incident for {activeHour}{getSuffix(activeHour)} Hour
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-slate-300 text-xs">
            <thead>
              <tr className="bg-[#134665] text-white font-bold uppercase tracking-wider">
                <th className="px-3 py-2.5 border-r border-slate-400/40 text-center w-12">#</th>
                <th className="px-3 py-2.5 border-r border-slate-400/40 min-w-[200px]">Stoppage Category / Reason</th>
                <th className="px-3 py-2.5 border-r border-slate-400/40 min-w-[170px]">Operator / Worker Involved</th>
                <th className="px-3 py-2.5 border-r border-slate-400/40 text-center min-w-[120px] bg-[#0d344d] text-rose-300">
                  Lost Time (Minutes)
                </th>
                <th className="px-3 py-2.5 border-r border-slate-400/40 text-center min-w-[100px]">Duration</th>
                <th className="px-2 py-2.5 text-center w-10">Del</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 font-medium">
              {currentHourDetails.map((item, index) => {
                const mins = Number(item.minutes) || 0;

                return (
                  <tr key={item.id || index} className="hover:bg-slate-50 transition-colors">
                    {/* Index */}
                    <td className="px-3 py-2.5 border-r border-slate-200 text-center font-black bg-slate-50 text-slate-600">
                      {index + 1}
                    </td>

                    {/* Stoppage Reason / Category Dropdown */}
                    <td className="px-3 py-2.5 border-r border-slate-200">
                      <div className="flex items-center gap-2">
                        <CategoryDot category={item.reason as DowntimeCategory} size="sm" />
                        <select
                          value={item.reason}
                          onChange={(e) => handleUpdateField(item.id, 'reason', e.target.value)}
                          className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-bold text-slate-900 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none cursor-pointer"
                        >
                          {REASONS.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                          {!REASONS.includes(item.reason as DowntimeCategory) && (
                            <option value={item.reason}>{item.reason}</option>
                          )}
                        </select>
                      </div>
                    </td>

                    {/* Operator Involved Dropdown */}
                    <td className="px-3 py-2.5 border-r border-slate-200">
                      <select
                        value={item.worker_name}
                        onChange={(e) => handleUpdateField(item.id, 'worker_name', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-bold text-slate-900 text-xs focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none cursor-pointer"
                      >
                        <option value="" disabled>-- Select Operator --</option>
                        {availableWorkers.map((w) => (
                          <option key={w.id} value={w.name}>
                            {w.name} ({w.id})
                          </option>
                        ))}
                        {item.worker_name && !availableWorkers.some((w) => w.name === item.worker_name) && (
                          <option value={item.worker_name}>{item.worker_name}</option>
                        )}
                      </select>
                    </td>

                    {/* Minutes Input */}
                    <td className="px-3 py-2.5 border-r border-slate-200 text-center bg-rose-50/40">
                      <div className="flex items-center justify-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          value={item.minutes === 0 ? '' : item.minutes}
                          placeholder="0"
                          onChange={(e) =>
                            handleUpdateField(item.id, 'minutes', e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0))
                          }
                          className="w-18 px-2 py-1.5 text-center bg-white border border-rose-400 rounded-md font-black text-rose-900 industrial-digits text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                        />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">min</span>
                      </div>
                    </td>

                    {/* Human Readable Duration */}
                    <td className="px-3 py-2.5 border-r border-slate-200 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-black industrial-digits bg-slate-100 text-slate-800 border border-slate-200">
                        {formatDuration(mins, 'short')}
                      </span>
                    </td>

                    {/* Delete Action */}
                    <td className="px-2 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteIncident(item.id)}
                        title="Remove stoppage record"
                        className="p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Footer Summary */}
            <tfoot>
              <tr className="bg-slate-100 font-black border-t-2 border-slate-300 text-slate-900">
                <td colSpan={3} className="px-3 py-2.5 text-right font-black uppercase text-xs text-slate-700">
                  {activeHour}{getSuffix(activeHour)} Hour Total Stoppage Time:
                </td>
                <td className="px-3 py-2.5 text-center font-black industrial-digits text-sm text-rose-700 bg-rose-100/50 border-r border-slate-300">
                  {hourTotalMinutes} MINS
                </td>
                <td className="px-3 py-2.5 text-center font-black text-xs text-slate-800">
                  {formatDuration(hourTotalMinutes, 'long')}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};
