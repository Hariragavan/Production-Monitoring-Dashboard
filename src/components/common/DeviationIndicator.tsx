import React from 'react';

interface DeviationIndicatorProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
  className?: string;
}

export const DeviationIndicator: React.FC<DeviationIndicatorProps> = ({
  value,
  size = 'md',
  showNumber = true,
  className = '',
}) => {
  const isPositive = value > 0;
  const isNegative = value < 0;

  const formattedNum = isPositive ? `+${value}` : `${value}`;

  // Sizing styles
  const iconSizeClass = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  }[size];

  const textSizeClass = {
    sm: 'text-sm font-bold',
    md: 'text-base font-extrabold',
    lg: 'text-lg font-black',
  }[size];

  if (isPositive) {
    return (
      <div className={`inline-flex items-center justify-center gap-1 text-emerald-600 font-bold ${className}`}>
        {showNumber && <span className={`${textSizeClass} industrial-digits`}>{formattedNum}</span>}
        <span className={`${iconSizeClass} leading-none text-emerald-600 select-none animate-bounce-short`}>▲</span>
      </div>
    );
  }

  if (isNegative) {
    return (
      <div className={`inline-flex items-center justify-center gap-1 text-rose-600 font-bold ${className}`}>
        {showNumber && <span className={`${textSizeClass} industrial-digits`}>{formattedNum}</span>}
        <span className={`${iconSizeClass} leading-none text-rose-600 select-none`}>▼</span>
      </div>
    );
  }

  // Zero
  return (
    <div className={`inline-flex items-center justify-center gap-1 text-amber-500 font-bold ${className}`}>
      {showNumber && <span className={`${textSizeClass} industrial-digits`}>0</span>}
      <span className={`${iconSizeClass} leading-none text-amber-500 font-black select-none`}>▬</span>
    </div>
  );
};
