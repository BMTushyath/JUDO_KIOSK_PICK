import React from 'react';

/**
 * Generic Default Avatar Component
 * Clean, neutral person silhouette in a circular container.
 * Original design that clearly signals 'no photo' without copying copyrighted artwork.
 */
export default function DefaultAvatar({ size = 72, className = '', style = {} }) {
  return (
    <div
      className={`default-avatar-container ${className}`}
      style={{
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
        borderRadius: '50%',
        backgroundColor: '#e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        border: '2px solid #cbd5e1',
        flexShrink: 0,
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08)',
        ...style
      }}
      aria-label="No participant photo - default avatar"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '82%', height: '82%' }}
      >
        {/* Head */}
        <circle cx="50" cy="38" r="20" fill="#94a3b8" />
        {/* Shoulders & Torso */}
        <path
          d="M18 90 C18 68, 32 60, 50 60 C68 60, 82 68, 82 90 Z"
          fill="#94a3b8"
        />
      </svg>
    </div>
  );
}
