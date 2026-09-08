import React, { useState, useEffect, useRef } from 'react';

const DEFAULT_CHARS = '01#@$%&*<>~/\\|{}[]+=_?!;^';

/**
 * DecryptedText - React Bits high-tech text decryption effect.
 * Perfect for the Spider-Man Oscorp HUD / SIH Spider Network headers.
 */
export default function DecryptedText({
  text = '',
  speed = 40,
  maxIterations = 14,
  sequential = true,
  revealDirection = 'start', // 'start' | 'end' | 'center'
  useOriginalCharsOnly = false,
  characters = DEFAULT_CHARS,
  className = '',
  parentClassName = '',
  encryptedClassName = 'text-cyan-400 font-mono',
  animateOn = 'mount', // 'mount' | 'hover' | 'both'
}) {
  const [displayText, setDisplayText] = useState(text);
  const [isHovering, setIsHovering] = useState(false);
  const isAnimatingRef = useRef(false);
  const iterationRef = useRef(0);
  const intervalRef = useRef(null);

  const startAnimation = () => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    iterationRef.current = 0;

    const originalLength = text.length;
    const charPool = useOriginalCharsOnly
      ? Array.from(new Set(text.split(''))).filter((c) => c !== ' ')
      : characters.split('');

    const getRandomChar = () => {
      if (!charPool.length) return '#';
      return charPool[Math.floor(Math.random() * charPool.length)];
    };

    clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      iterationRef.current += 1;
      const progress = iterationRef.current / maxIterations;

      const newChars = text.split('').map((char, index) => {
        if (char === ' ') return ' ';

        let isResolved = false;
        if (sequential) {
          if (revealDirection === 'start') {
            const cutoff = Math.floor(progress * originalLength);
            isResolved = index < cutoff;
          } else if (revealDirection === 'end') {
            const cutoff = originalLength - Math.floor(progress * originalLength);
            isResolved = index >= cutoff;
          } else {
            // Center
            const center = originalLength / 2;
            const radius = (progress * originalLength) / 2;
            isResolved = Math.abs(index - center) <= radius;
          }
        } else {
          isResolved = Math.random() < progress;
        }

        if (isResolved || iterationRef.current >= maxIterations) {
          return char;
        }
        return getRandomChar();
      });

      setDisplayText(newChars.join(''));

      if (iterationRef.current >= maxIterations) {
        clearInterval(intervalRef.current);
        setDisplayText(text);
        isAnimatingRef.current = false;
      }
    }, speed);
  };

  useEffect(() => {
    if (animateOn === 'mount' || animateOn === 'both') {
      startAnimation();
    } else {
      setDisplayText(text);
    }

    return () => {
      clearInterval(intervalRef.current);
      isAnimatingRef.current = false;
    };
  }, [text, animateOn]);

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (animateOn === 'hover' || animateOn === 'both') {
      startAnimation();
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  return (
    <span
      className={`inline-block relative cursor-default ${parentClassName}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className={className}>
        {displayText.split('').map((char, i) => {
          const isDecrypted = char === text[i];
          return (
            <span
              key={i}
              className={!isDecrypted ? encryptedClassName : undefined}
            >
              {char}
            </span>
          );
        })}
      </span>
    </span>
  );
}
