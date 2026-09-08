import React, { useState, useEffect, useRef } from 'react';

/**
 * Magnet - React Bits component with magnetic attraction physics.
 * Gives an elastic spider-web pull feel to buttons and interactive elements.
 */
export default function Magnet({
  children,
  padding = 40,
  magnetStrength = 0.35,
  activeTransition = 'transform 0.15s cubic-bezier(0.25, 1, 0.5, 1)',
  inactiveTransition = 'transform 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  className = '',
  disabled = false,
}) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const magnetRef = useRef(null);

  useEffect(() => {
    if (disabled) return;

    const handleMouseMove = (e) => {
      const el = magnetRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const distX = Math.abs(centerX - e.clientX);
      const distY = Math.abs(centerY - e.clientY);

      if (distX < rect.width / 2 + padding && distY < rect.height / 2 + padding) {
        setIsHovered(true);
        const offsetX = (e.clientX - centerX) * magnetStrength;
        const offsetY = (e.clientY - centerY) * magnetStrength;
        setPosition({ x: offsetX, y: offsetY });
      } else if (isHovered) {
        setIsHovered(false);
        setPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [padding, magnetStrength, isHovered, disabled]);

  return (
    <div
      ref={magnetRef}
      className={`inline-block ${className}`}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        transition: isHovered ? activeTransition : inactiveTransition,
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  );
}
