
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
}

const Logo: React.FC<LogoProps> = ({ className = '', size = '100%' }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Outer Brush Circle */}
        <circle cx="256" cy="256" r="210" stroke="#d946ef" strokeWidth="8" strokeDasharray="15 5" className="opacity-40" />
        <path d="M460 256C460 368.666 368.666 460 256 460C143.334 460 52 368.666 52 256C52 143.334 143.334 52 256 52" stroke="#a21caf" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Inner Background Blob */}
        <circle cx="256" cy="256" r="160" fill="#f5d0fe" className="opacity-80" />
        
        {/* The 'WW' - Designed with a brush-like feel */}
        <g transform="translate(140, 180) scale(1.1)">
          {/* First W */}
          <path 
            d="M10 20C15 80 25 120 30 130C35 120 45 60 50 50C55 60 65 120 70 130C75 120 85 80 90 20" 
            stroke="#86198f" 
            strokeWidth="35" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          {/* Second W */}
          <path 
            d="M100 20C105 80 115 120 120 130C125 120 135 60 140 50C145 60 155 120 160 130C165 120 175 80 180 20" 
            stroke="#701a75" 
            strokeWidth="35" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </g>
      </svg>
    </div>
  );
};

export default Logo;
