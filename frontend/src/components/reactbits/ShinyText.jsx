import React from 'react';

/**
 * ShinyText - React Bits component with shimmering gradient light beam.
 * Custom styled for the Amazing Spider-Man neon web glow aesthetic.
 */
export default function ShinyText({
  text,
  disabled = false,
  speed = 4,
  className = '',
  shimmerColor = 'rgba(255, 255, 255, 0.85)',
}) {
  const animationDuration = `${speed}s`;

  return (
    <span
      className={`inline-block relative bg-clip-text text-transparent font-extrabold ${className}`}
      style={{
        backgroundImage: disabled
          ? 'none'
          : `linear-gradient(120deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.4) 35%, ${shimmerColor} 50%, rgba(255, 255, 255, 0.4) 65%, rgba(255, 255, 255, 0.4) 100%)`,
        backgroundSize: '200% 100%',
        animation: disabled ? 'none' : `shine-sweep ${animationDuration} linear infinite`,
        WebkitBackgroundClip: 'text',
      }}
    >
      {text}
    </span>
  );
}
