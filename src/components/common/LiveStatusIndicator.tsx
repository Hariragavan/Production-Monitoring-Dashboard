import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface LiveStatusIndicatorProps {
  isLive: boolean;
  isSupabase: boolean;
}

export const LiveStatusIndicator: React.FC<LiveStatusIndicatorProps> = ({ isLive, isSupabase }) => {
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wider transition-all duration-300 ${
        isLive
          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-900/20'
          : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
      }`}
      title={isSupabase ? 'Connected to Supabase Realtime' : 'Running in Local Demo Sync Mode'}
    >
      <span className="relative flex h-2.5 w-2.5">
        {isLive && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        )}
        <span
          className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
            isLive ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        ></span>
      </span>
      <span className="font-bold uppercase tracking-wider text-[11px]">
        {isLive ? 'LIVE' : 'OFFLINE'}
      </span>
      {isLive ? (
        <Wifi className="w-3.5 h-3.5 text-emerald-400 opacity-90 ml-0.5" />
      ) : (
        <WifiOff className="w-3.5 h-3.5 text-rose-400 opacity-90 ml-0.5" />
      )}
    </div>
  );
};
