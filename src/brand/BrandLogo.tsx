import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  variant?: 'light' | 'dark';
  layout?: 'horizontal' | 'stacked';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  variant = 'dark',
  layout = 'horizontal',
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14',
  };

  const titleSizes = {
    sm: 'text-sm sm:text-base',
    md: 'text-base sm:text-lg',
    lg: 'text-xl sm:text-2xl',
    xl: 'text-2xl sm:text-3xl',
  };

  const isLight = variant === 'light';

  // Official Brighter Group 6-Tile Spark Grid Icon
  const LogoIcon = (
    <div className={`${iconSizes[size]} flex-shrink-0 relative`}>
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xs">
        {/* Connecting Grid Lines */}
        <line x1="8" y1="8" x2="56" y2="8" stroke={isLight ? "#2B4C7E" : "#D0E4F7"} strokeWidth="2.5" />
        <line x1="8" y1="36" x2="56" y2="36" stroke={isLight ? "#2B4C7E" : "#D0E4F7"} strokeWidth="2.5" />
        <line x1="8" y1="8" x2="8" y2="36" stroke={isLight ? "#2B4C7E" : "#D0E4F7"} strokeWidth="2.5" />
        <line x1="32" y1="8" x2="32" y2="36" stroke={isLight ? "#2B4C7E" : "#D0E4F7"} strokeWidth="2.5" />
        <line x1="56" y1="8" x2="56" y2="36" stroke={isLight ? "#2B4C7E" : "#D0E4F7"} strokeWidth="2.5" />

        {/* Top Row Tiles */}
        {/* Tile 1: Dark Blue with Spark Star */}
        <rect x="0" y="0" width="16" height="16" rx="4" fill="#006CA3" />
        {/* 4-Point Spark Star inside Tile 1 */}
        <path
          d="M8 2 C8 6.5 8 6.5 12.5 6.5 C8 6.5 8 6.5 8 11 C8 6.5 8 6.5 3.5 6.5 C8 6.5 8 6.5 8 2 Z"
          fill="#FFFFFF"
        />

        {/* Tile 2: Medium Blue */}
        <rect x="24" y="0" width="16" height="16" rx="4" fill="#2B82C5" />

        {/* Tile 3: Soft Light Blue */}
        <rect x="48" y="0" width="16" height="16" rx="4" fill="#60A5FA" />

        {/* Bottom Row Tiles */}
        {/* Tile 4: Medium Blue */}
        <rect x="0" y="28" width="16" height="16" rx="4" fill="#2B82C5" />

        {/* Tile 5: Cyan / Sky Blue */}
        <rect x="24" y="28" width="16" height="16" rx="4" fill="#85C3FA" />

        {/* Tile 6: Pale Sky Blue */}
        <rect x="48" y="28" width="16" height="16" rx="4" fill="#C2E4F5" />
      </svg>
    </div>
  );

  if (layout === 'stacked') {
    return (
      <div className={`flex flex-col items-center text-center select-none ${className}`}>
        {LogoIcon}
        <div className="mt-1 flex flex-col items-center leading-tight">
          <span className={`font-heading font-extrabold tracking-tight ${titleSizes[size]}`}>
            <span className={isLight ? 'text-white' : 'text-[#0B1220]'}>Bright</span>
            <span className={isLight ? 'text-sky-400' : 'text-[#006CA3]'}>Ops</span>
          </span>
          <span
            className={`font-sans font-medium text-[10px] sm:text-[11px] mt-0.5 ${
              isLight ? 'text-slate-300' : 'text-[#006CA3]'
            }`}
          >
            Brilliant Operations
          </span>
          {showSubtitle && (
            <span
              className={`font-sans text-[9px] sm:text-[10px] mt-0.5 ${
                isLight ? 'text-slate-400' : 'text-[#2B82C5]'
              }`}
            >
              Powered by BrightSpark
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {LogoIcon}
      <div className="flex flex-col leading-tight">
        <span className={`font-heading font-extrabold tracking-tight ${titleSizes[size]}`}>
          <span className={isLight ? 'text-white' : 'text-[#0B1220]'}>Bright</span>
          <span className={isLight ? 'text-sky-400' : 'text-[#006CA3]'}>Ops</span>
        </span>
        {showSubtitle && (
          <span
            className={`font-sans font-medium text-[11px] ${
              isLight ? 'text-slate-300' : 'text-[#006CA3]'
            }`}
          >
            Brilliant Operations · Powered by BrightSpark
          </span>
        )}
      </div>
    </div>
  );
};
