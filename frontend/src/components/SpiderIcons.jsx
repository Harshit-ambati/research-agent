import React from 'react';

/**
 * SpiderIcons - Handcrafted SVG icon collection matching The Amazing Spider-Man aesthetic.
 * Styled to seamlessly harmonize with the crimson (#e62429) & electric cyan (#00f2fe) palette.
 */

// 1. The iconic Amazing Spider-Man elongated emblem
export function SpiderEmblem({ className = 'w-6 h-6', glow = true }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${glow ? 'drop-shadow-[0_0_8px_rgba(230,36,41,0.6)]' : ''}`}
    >
      {/* Spider Head & Fangs */}
      <path
        d="M16 6.5C15.2 6.5 14.5 7.1 14.5 7.8L15 9.5H17L17.5 7.8C17.5 7.1 16.8 6.5 16 6.5Z"
        fill="currentColor"
      />
      <path d="M14.5 8.2L13.8 6.8M17.5 8.2L18.2 6.8" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
      {/* Cephalothorax (Upper Body) */}
      <path
        d="M16 9.8C14.8 9.8 13.9 10.8 13.9 12C13.9 12.8 14.4 13.5 15.1 13.9L16 14.4L16.9 13.9C17.6 13.5 18.1 12.8 18.1 12C18.1 10.8 17.2 9.8 16 9.8Z"
        fill="currentColor"
      />
      {/* Elongated Abdomen (Lower Body - TASM Style) */}
      <path
        d="M16 14.5C14.9 14.5 14.1 15.6 14.1 16.9C14.1 19.2 15.4 22.8 16 25C16.6 22.8 17.9 19.2 17.9 16.9C17.9 15.6 17.1 14.5 16 14.5Z"
        fill="currentColor"
      />
      {/* Top Left Legs (Pair 1 & 2) */}
      <path
        d="M14.2 11.2L9.5 7.5L5 8.5M14.2 12.4L8 10L3.5 13"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Top Right Legs (Pair 1 & 2) */}
      <path
        d="M17.8 11.2L22.5 7.5L27 8.5M17.8 12.4L24 10L28.5 13"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom Left Legs (Pair 3 & 4 - Long TASM Stride) */}
      <path
        d="M14.4 13.8L7.5 16.5L4.5 24M14.5 15.5L9.5 20L7 28.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom Right Legs (Pair 3 & 4) */}
      <path
        d="M17.6 13.8L24.5 16.5L27.5 24M17.5 15.5L22.5 20L25 28.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 2. Spider-Sense Precognitive Wave Icon
export function SpiderSense({ className = 'w-5 h-5', glow = true }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${glow ? 'drop-shadow-[0_0_8px_rgba(0,242,254,0.6)]' : ''}`}
    >
      {/* Central Spidey Mask Silhouette */}
      <path
        d="M12 7C9.2 7 7.5 9.2 7.5 12C7.5 14.5 9.5 17 12 18.5C14.5 17 16.5 14.5 16.5 12C16.5 9.2 14.8 7 12 7Z"
        stroke="currentColor"
        strokeWidth="1.3"
        fill="currentColor"
        fillOpacity="0.15"
      />
      {/* Angular Spider Eyes */}
      <path d="M9.5 11.2L11 12.8L11 11.2L9.5 11.2Z" fill="#00f2fe" />
      <path d="M14.5 11.2L13 12.8L13 11.2L14.5 11.2Z" fill="#00f2fe" />
      {/* Spider-Sense Radiating Sensory Waves */}
      <path
        d="M6 5.5L4 4M18 5.5L20 4"
        stroke="#ef4444"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M3.5 10L1.5 9.5M20.5 10L22.5 9.5"
        stroke="#00f2fe"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M8 2.5L7.2 1M16 2.5L16.8 1M12 2.5V0.8"
        stroke="#ef4444"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// 3. Web Shooter Nozzle & Pressure Gauge
export function WebShooter({ className = 'w-5 h-5', glow = true }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${glow ? 'drop-shadow-[0_0_6px_rgba(0,242,254,0.5)]' : ''}`}
    >
      {/* Outer Gauntlet Ring */}
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.4" strokeDasharray="3 2" />
      {/* Inner Web Spinneret Core */}
      <circle cx="12" cy="12" r="4.5" fill="currentColor" fillOpacity="0.2" stroke="#00f2fe" strokeWidth="1.5" />
      {/* Micro Web Orifice */}
      <circle cx="12" cy="12" r="1.8" fill="#e62429" />
      {/* Web Filament Ejection Strands */}
      <path d="M12 3V6M12 18V21M3 12H6M18 12H21" stroke="#00f2fe" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M5.5 5.5L7.5 7.5M16.5 16.5L18.5 18.5" stroke="#e62429" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// 4. Geometric Spider Web Lattice
export function SpiderWeb({ className = 'w-5 h-5', glow = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${glow ? 'drop-shadow-[0_0_6px_rgba(0,242,254,0.6)]' : ''}`}
    >
      {/* Radial Web Spoke Lines */}
      <path d="M12 2V22M2 12H22M5 5L19 19M19 5L5 19" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      {/* Concentric Web Rings */}
      <polygon
        points="12,5 17,7 19,12 17,17 12,19 7,17 5,12 7,7"
        stroke="#00f2fe"
        strokeWidth="1.1"
        fill="none"
        opacity="0.85"
      />
      <polygon
        points="12,8 15,9.5 16,12 15,14.5 12,16 9,14.5 8,12 9,9.5"
        stroke="#ef4444"
        strokeWidth="1.1"
        fill="none"
        opacity="0.9"
      />
      {/* Center Web Nexus */}
      <circle cx="12" cy="12" r="1.5" fill="#00f2fe" />
    </svg>
  );
}

// 5. Oscorp Spider Tracer (Tracking Beacon)
export function SpiderTracer({ className = 'w-5 h-5', glow = true }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${glow ? 'drop-shadow-[0_0_7px_rgba(230,36,41,0.7)]' : ''}`}
    >
      {/* Tracer Center Puck */}
      <circle cx="12" cy="12" r="3.5" fill="#e62429" stroke="#00f2fe" strokeWidth="1.2" />
      <circle cx="12" cy="12" r="1.2" fill="#ffffff" />
      {/* Tracer Micro-Leg Antennas */}
      <path
        d="M9.5 10L6.5 7M14.5 10L17.5 7M9 13.5L5.5 16.5M15 13.5L18.5 16.5M8.5 12H4.5M15.5 12H19.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      {/* Radar Ping Arcs */}
      <path
        d="M9 3C10 2.4 11 2 12 2C13 2 14 2.4 15 3"
        stroke="#00f2fe"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        d="M7 21C8.5 21.6 10.2 22 12 22C13.8 22 15.5 21.6 17 21"
        stroke="#ef4444"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
  );
}

// 6. TASM Reflective Mask Eye Lenses
export function SpiderMaskLenses({ className = 'w-5 h-5', glow = true }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${glow ? 'drop-shadow-[0_0_8px_rgba(0,242,254,0.5)]' : ''}`}
    >
      {/* Left Lens (Sharp Angular TASM Silhouette) */}
      <path
        d="M10.8 7.5C8 8.2 4.5 10.5 4 13.5C3.7 15.2 4.6 16.5 6.2 16.8C8.8 17.2 10.5 13.5 11.2 10L10.8 7.5Z"
        fill="url(#lens-grad)"
        stroke="#e62429"
        strokeWidth="1.2"
      />
      {/* Right Lens */}
      <path
        d="M13.2 7.5C16 8.2 19.5 10.5 20 13.5C20.3 15.2 19.4 16.5 17.8 16.8C15.2 17.2 13.5 13.5 12.8 10L13.2 7.5Z"
        fill="url(#lens-grad)"
        stroke="#e62429"
        strokeWidth="1.2"
      />
      <defs>
        <linearGradient id="lens-grad" x1="4" y1="7" x2="20" y2="17" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00f2fe" stopOpacity="0.8" />
          <stop offset="0.5" stopColor="#1e1b4b" stopOpacity="0.9" />
          <stop offset="1" stopColor="#e62429" stopOpacity="0.7" />
        </linearGradient>
      </defs>
    </svg>
  );
}
