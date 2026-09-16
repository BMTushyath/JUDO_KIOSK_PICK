import React from 'react';

/* ================================================================
   VTU Logo - Official emblem + "Visvesvaraya Technological University, Belagavi"
   User-provided full logo image with text.
   Wider aspect ratio — sized to fit neatly inside the black header box.
================================================================ */
export function VtuLogo({ className = "", height = 82, width = "100%", style = {} }) {
  return (
    <div 
      className={className} 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100%',
        width: width,
        boxSizing: 'border-box',
        background: '#ffffff',
        borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
        padding: '4px 14px',
        overflow: 'hidden',
        ...style
      }}
    >
      <img
        src="/assets/vtu_logo_full.png"
        alt="Visvesvaraya Technological University, Belagavi"
        style={{
          height: '100%',
          maxHeight: '74px',
          width: 'auto',
          maxWidth: '100%',
          objectFit: 'contain',
          display: 'block'
        }}
      />
    </div>
  );
}


/* ================================================================
   Sambhram Logo Group
   - Sambhram name + 25 years emblem in clean white pill
================================================================ */
export function SambhramLogoGroup({ className = "", height = 82, width = "100%", style = {} }) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
        borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
        padding: '4px 16px',
        height: '100%',
        width: width,
        boxSizing: 'border-box',
        gap: '20px',
        overflow: 'hidden',
        ...style
      }}
    >
      <img
        src="/assets/sambhram_name_logo.jpg"
        alt="Sambhram Institute of Technology"
        style={{ 
          height: '100%',
          maxHeight: '66px',
          width: 'auto', 
          maxWidth: '65%',
          objectFit: 'contain', 
          display: 'block' 
        }}
      />
      <div style={{
        width: '2px',
        height: '52px',
        background: 'rgba(0,0,0,0.15)',
        flexShrink: 0
      }} />
      <img
        src="/assets/sambhram_25years_logo.jpg"
        alt="Sambhram 25 Years"
        style={{ 
          height: '100%',
          maxHeight: '66px',
          width: 'auto', 
          maxWidth: '30%',
          objectFit: 'contain', 
          display: 'block' 
        }}
      />
    </div>
  );
}

/* ================================================================
   Judo Grapplers SVG icon
================================================================ */
export function JudoGrapplersIcon({ color = "#0A192F", size = 54 }) {
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="42" cy="22" r="9" fill={color} />
      <path d="M30 36 C34 32 46 32 50 35 L62 48 C64 51 62 54 58 53 L48 46 L42 62 L32 80 L22 76 L32 56 L24 48 C20 44 24 38 30 36 Z" fill={color} />
      <circle cx="78" cy="24" r="9" fill={color} />
      <path d="M90 38 C86 34 74 34 70 37 L58 50 C56 53 58 56 62 55 L72 48 L76 64 L86 82 L96 78 L86 58 L94 50 C98 46 94 40 90 38 Z" fill={color} />
      <path d="M52 42 L68 44" stroke={color} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/* ================================================================
   Black Belt Banner
================================================================ */
export function BlackBeltBanner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '10px' }}>
      <svg width="220" height="34" viewBox="0 0 220 38" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="15" y="14" width="190" height="10" rx="2" fill="#0A192F" />
        <path d="M96 10 C93 10 91 13 91 19 C91 25 93 28 96 28 L124 28 C127 28 129 25 129 19 C129 13 127 10 124 10 Z" fill="#071220" />
        <path d="M94 23 L76 37 L88 38 L104 25 Z" fill="#0A192F" />
        <path d="M126 23 L144 37 L132 38 L116 25 Z" fill="#0A192F" />
        <rect x="136" y="31" width="2" height="6" transform="rotate(-35 136 31)" fill="#f59e0b" />
        <rect x="139" y="33" width="2" height="6" transform="rotate(-35 139 33)" fill="#f59e0b" />
      </svg>
    </div>
  );
}
