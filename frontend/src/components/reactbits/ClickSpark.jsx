import React, { useRef, useEffect, useCallback } from 'react';

/**
 * ClickSpark - React Bits component emitting electric spark bursts on click.
 * Tailored with Amazing Spider-Man electro-web sparks (electric cyan & crimson).
 */
export default function ClickSpark({
  sparkColors = ['#00f2fe', '#ef4444', '#38bdf8', '#ff3366', '#ffffff'],
  sparkSize = 10,
  sparkRadius = 24,
  sparkCount = 9,
  duration = 450,
  children,
}) {
  const canvasRef = useRef(null);
  const sparksRef = useRef([]);
  const animIdRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const now = performance.now();
    // Keep sparks that are still active
    sparksRef.current = sparksRef.current.filter((spark) => {
      const elapsed = now - spark.startTime;
      if (elapsed >= duration) return false;

      const progress = elapsed / duration;
      const easeProgress = 1 - Math.pow(1 - progress, 2); // ease-out quad

      const currentDistance = spark.distance * easeProgress;
      const x1 = spark.x + Math.cos(spark.angle) * currentDistance;
      const y1 = spark.y + Math.sin(spark.angle) * currentDistance;

      const lineLength = spark.length * (1 - progress);
      const x2 = x1 + Math.cos(spark.angle) * lineLength;
      const y2 = y1 + Math.sin(spark.angle) * lineLength;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = spark.color;
      ctx.lineWidth = 2 * (1 - progress);
      ctx.lineCap = 'round';
      ctx.shadowBlur = 6;
      ctx.shadowColor = spark.color;
      ctx.stroke();
      ctx.restore();

      return true;
    });

    if (sparksRef.current.length > 0) {
      animIdRef.current = requestAnimationFrame(draw);
    } else {
      animIdRef.current = null;
    }
  }, [duration]);

  const handleClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const now = performance.now();
    const newSparks = [];

    for (let i = 0; i < sparkCount; i++) {
      const angle = (Math.PI * 2 * i) / sparkCount + (Math.random() - 0.5) * 0.4;
      newSparks.push({
        x: clickX,
        y: clickY,
        angle,
        distance: sparkRadius + Math.random() * 16,
        length: sparkSize + Math.random() * 6,
        color: sparkColors[Math.floor(Math.random() * sparkColors.length)],
        startTime: now,
      });
    }

    sparksRef.current.push(...newSparks);

    if (!animIdRef.current) {
      animIdRef.current = requestAnimationFrame(draw);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    updateSize();
    window.addEventListener('resize', updateSize, { passive: true });

    return () => {
      window.removeEventListener('resize', updateSize);
      if (animIdRef.current) {
        cancelAnimationFrame(animIdRef.current);
      }
    };
  }, []);

  return (
    <div
      onClick={handleClick}
      className="relative w-full min-h-full"
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-50"
        aria-hidden="true"
      />
      {children}
    </div>
  );
}
