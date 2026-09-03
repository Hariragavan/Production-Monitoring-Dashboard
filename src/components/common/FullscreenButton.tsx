import React, { useState, useEffect } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

interface FullscreenButtonProps {
  className?: string;
  showText?: boolean;
}

export const FullscreenButton: React.FC<FullscreenButtonProps> = ({
  className = '',
  showText = false,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen toggle error:', err);
    }
  };

  return (
    <button
      onClick={toggleFullscreen}
      className={`inline-flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold tracking-wide border border-slate-700 shadow-sm transition-all active:scale-95 cursor-pointer ${className}`}
      title={isFullscreen ? 'Exit Full Screen (Esc)' : 'Enter TV Full Screen Mode'}
    >
      {isFullscreen ? (
        <>
          <Minimize2 className="w-3.5 h-3.5 text-cyan-400" />
          {showText && <span>Exit Full Screen</span>}
        </>
      ) : (
        <>
          <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
          {showText && <span>Full Screen</span>}
        </>
      )}
    </button>
  );
};
