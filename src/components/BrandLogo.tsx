import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export default function BrandLogo({ className = '', size = 'md', showText = true }: BrandLogoProps) {
  let bagSize = "w-10 h-10";
  let textTitleSize = "text-lg";
  let textSubtitleSize = "text-[9px]";

  if (size === 'sm') {
    bagSize = "w-6 h-6";
    textTitleSize = "text-sm";
    textSubtitleSize = "text-[7px]";
  } else if (size === 'lg') {
    bagSize = "w-16 h-16";
    textTitleSize = "text-2xl";
    textSubtitleSize = "text-[11px]";
  } else if (size === 'xl') {
    bagSize = "w-28 h-28";
    textTitleSize = "text-4xl";
    textSubtitleSize = "text-xs";
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`} id="borcelle-brand-logo-component">
      {/* Smiling Shopping Bag SVG Vector */}
      <div className={`${bagSize} relative flex items-center justify-center`} id="borcelle-svg-bag-container">
        <svg 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md hover:scale-105 transition-all duration-300"
        >
          {/* Handle */}
          <path 
            d="M 28,32 C 28,12 72,12 72,32" 
            stroke="#1E40AF" 
            strokeWidth="8" 
            strokeLinecap="round" 
            fill="none"
          />
          {/* Bag Body - Curved Trapezoid */}
          <path 
            d="M 20,32 L 80,32 C 84,32 86,35 85,39 L 77,88 C 76,92 72,95 68,95 L 32,95 C 28,95 24,92 23,88 L 15,39 C 14,35 16,32 20,32 Z" 
            fill="#3B82F6" 
          />
          {/* Happy Smiles Eyes */}
          <circle cx="40" cy="54" r="4.5" fill="white" />
          <circle cx="60" cy="54" r="4.5" fill="white" />
          {/* Happy Smiles Curved Face */}
          <path 
            d="M 35,63 C 42,75 58,75 65,63" 
            stroke="white" 
            strokeWidth="5" 
            strokeLinecap="round" 
            fill="none"
          />
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="text-center mt-3 font-sans select-none" id="borcelle-text-container">
          <h2 className={`${textTitleSize} font-extrabold text-slate-800 tracking-tight leading-none uppercase`}>
            MyShop
          </h2>
          <span className={`${textSubtitleSize} font-bold text-blue-600 tracking-[0.25em] uppercase block mt-1`}>
            POS Suite
          </span>
        </div>
      )}
    </div>
  );
}
