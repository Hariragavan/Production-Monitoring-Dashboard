import React from 'react';
import type { DowntimeCategory } from '../../types';

export const DOWNTIME_COLOR_MAP: Record<
  DowntimeCategory,
  { dotBg: string; text: string; lightBg: string; border: string }
> = {
  'Machine Breakdown': {
    dotBg: 'bg-amber-400 border-amber-500',
    text: 'text-amber-900',
    lightBg: 'bg-amber-50/70',
    border: 'border-amber-300',
  },
  'Line Unbalancing': {
    dotBg: 'bg-pink-300 border-pink-400',
    text: 'text-pink-900',
    lightBg: 'bg-pink-50/70',
    border: 'border-pink-300',
  },
  'Line Balancing': {
    dotBg: 'bg-pink-400 border-pink-500',
    text: 'text-pink-900',
    lightBg: 'bg-pink-50/70',
    border: 'border-pink-300',
  },
  'Operator Movement': {
    dotBg: 'bg-teal-700 border-teal-800',
    text: 'text-teal-900',
    lightBg: 'bg-teal-50/70',
    border: 'border-teal-300',
  },
  'Re work': {
    dotBg: 'bg-emerald-300 border-emerald-500',
    text: 'text-emerald-900',
    lightBg: 'bg-emerald-50/70',
    border: 'border-emerald-300',
  },
  'Idle': {
    dotBg: 'bg-rose-600 border-rose-700',
    text: 'text-rose-900',
    lightBg: 'bg-rose-50/70',
    border: 'border-rose-300',
  },
  'Style Changeover': {
    dotBg: 'bg-amber-600 border-amber-700',
    text: 'text-orange-950',
    lightBg: 'bg-orange-50/70',
    border: 'border-orange-300',
  },
  'Break': {
    dotBg: 'bg-blue-400 border-blue-500',
    text: 'text-blue-900',
    lightBg: 'bg-blue-50/70',
    border: 'border-blue-300',
  },
  'Meeting': {
    dotBg: 'bg-purple-500 border-purple-600',
    text: 'text-purple-950',
    lightBg: 'bg-purple-50/70',
    border: 'border-purple-300',
  },
  'Bobbin': {
    dotBg: 'bg-indigo-400 border-indigo-500',
    text: 'text-indigo-900',
    lightBg: 'bg-indigo-50/70',
    border: 'border-indigo-300',
  },
  'No Line Feeding': {
    dotBg: 'bg-orange-500 border-orange-600',
    text: 'text-orange-950',
    lightBg: 'bg-orange-50/70',
    border: 'border-orange-300',
  },
};

interface CategoryDotProps {
  category: DowntimeCategory | string;
  size?: 'sm' | 'md';
}

export const CategoryDot: React.FC<CategoryDotProps> = ({ category, size = 'md' }) => {
  const meta = DOWNTIME_COLOR_MAP[category as DowntimeCategory] || {
    dotBg: 'bg-slate-400 border-slate-500',
    text: 'text-slate-900',
    lightBg: 'bg-slate-50',
    border: 'border-slate-300',
  };

  const dim = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  return (
    <span
      className={`inline-block rounded-full ${dim} border shadow-xs flex-shrink-0 ${meta.dotBg}`}
      aria-hidden="true"
    />
  );
};
