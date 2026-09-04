import React from 'react';
import type { DowntimeSummaryItem, DowntimeCategory } from '../../types';
import { CategoryDot } from '../common/StatusBadge';

interface DowntimeSummaryEditorProps {
  downtimeSummary: DowntimeSummaryItem[];
  onChange: (items: DowntimeSummaryItem[]) => void;
}

const CATEGORIES: DowntimeCategory[] = [
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

export const DowntimeSummaryEditor: React.FC<DowntimeSummaryEditorProps> = ({
  downtimeSummary,
  onChange,
}) => {
  // Build lookup map: [category][hour] -> minutes
  const dataMap: Record<string, Record<number, number>> = {};
  CATEGORIES.forEach(cat => {
    dataMap[cat] = {};
  });

  downtimeSummary.forEach(item => {
    if (!dataMap[item.category]) dataMap[item.category] = {};
    dataMap[item.category][item.hour] = item.minutes;
  });

  const handleCellChange = (category: DowntimeCategory, hour: number, val: string) => {
    const mins = val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0);

    // Update or insert item
    const existingIndex = downtimeSummary.findIndex(
      d => d.category === category && d.hour === hour
    );

    let updated: DowntimeSummaryItem[];
    if (existingIndex >= 0) {
      updated = [...downtimeSummary];
      updated[existingIndex] = { ...updated[existingIndex], minutes: mins };
    } else {
      updated = [
        ...downtimeSummary,
        {
          id: `ds-${category}-${hour}-${Date.now()}`,
          category,
          hour,
          minutes: mins,
        },
      ];
    }
    onChange(updated);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-200 mb-4 gap-2">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Downtime Summary Matrix</h3>
          <p className="text-xs text-slate-500">
            Log lost minutes per downtime category for hours 1 through 10.
          </p>
        </div>
        <div className="text-xs font-semibold px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200">
          Factory Floor Stoppages
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse border border-slate-300 text-xs">
          <thead>
            <tr className="bg-[#134665] text-white font-bold uppercase tracking-wider">
              <th className="px-3 py-2.5 border-r border-slate-400/40 min-w-[170px]">Category</th>
              {Array.from({ length: 10 }, (_, i) => {
                const hourNum = i + 1;
                let suffix = 'th';
                if (hourNum === 1) suffix = 'st';
                else if (hourNum === 2) suffix = 'nd';
                else if (hourNum === 3) suffix = 'rd';

                return (
                  <th key={hourNum} className="px-2 py-2.5 border-r border-slate-400/40 text-center font-bold">
                    {hourNum}{suffix} Hr.
                  </th>
                );
              })}
              <th className="px-3 py-2.5 bg-[#0d344d] text-cyan-300 text-center font-black">
                Total (Min.)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-medium">
            {CATEGORIES.map((cat) => {
              const hoursObj = dataMap[cat] || {};
              let categoryTotal = 0;
              for (let h = 1; h <= 10; h++) {
                categoryTotal += hoursObj[h] || 0;
              }

              return (
                <tr key={cat} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-2.5 border-r border-slate-200 font-bold text-slate-900 bg-slate-100/50">
                    <div className="flex items-center gap-2">
                      <CategoryDot category={cat} size="md" />
                      <span>{cat}</span>
                    </div>
                  </td>

                  {Array.from({ length: 10 }, (_, i) => {
                    const hourNum = i + 1;
                    const val = hoursObj[hourNum] ?? 0;

                    return (
                      <td key={hourNum} className="px-1.5 py-2 border-r border-slate-200 text-center">
                        <input
                          type="number"
                          min="0"
                          value={val === 0 ? '' : val}
                          placeholder="0"
                          onChange={(e) => handleCellChange(cat, hourNum, e.target.value)}
                          className="w-16 px-1.5 py-1 text-center bg-white border border-slate-300 rounded font-semibold text-slate-900 industrial-digits focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                        />
                      </td>
                    );
                  })}

                  <td className="px-3 py-2.5 text-center font-black text-rose-700 bg-slate-100 industrial-digits text-sm">
                    {categoryTotal}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
