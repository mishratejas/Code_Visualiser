import React, { useEffect, useRef, useState } from 'react';

const HolographicText = ({ text, size = 'text-4xl', className = '' }) => {
  const textRef = useRef(null);
  const animationRef = useRef(null);
  const [glitchOffset, setGlitchOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let frame = 0;

    const animate = () => {
      frame++;
      
      // Glitch effect
      if (frame % 60 === 0) {
        setGlitchOffset({
          x: (Math.random() - 0.5) * 10,
          y: (Math.random() - 0.5) * 5,
        });
        
        setTimeout(() => {
          setGlitchOffset({ x: 0, y: 0 });
        }, 50);
      }

      // Scan line effect
      if (textRef.current) {
        const scanLinePosition = (frame % 100) / 100;
        textRef.current.style.setProperty('--scan-position', `${scanLinePosition * 100}%`);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className="relative inline-block">
      {/* Background glow */}
      <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-xl blur-2xl"></div>
      
      {/* Glitch layers */}
      <div 
        className={`absolute top-0 left-0 ${size} font-bold text-red-400/40 ${className}`}
        style={{ transform: `translate(${glitchOffset.x}px, ${glitchOffset.y}px)` }}
      >
        {text}
      </div>
      <div 
        className={`absolute top-0 left-0 ${size} font-bold text-cyan-400/40 ${className}`}
        style={{ transform: `translate(${-glitchOffset.x}px, ${-glitchOffset.y}px)` }}
      >
        {text}
      </div>
      
      {/* Main text */}
      <div 
        ref={textRef}
        className={`relative ${size} font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 ${className} holographic-text`}
        style={{
          textShadow: `
            0 0 10px rgba(0, 184, 255, 0.5),
            0 0 20px rgba(0, 184, 255, 0.3),
            0 0 40px rgba(255, 0, 200, 0.2)
          `,
        }}
      >
        {text}
      </div>

      <style jsx>{`
        .holographic-text {
          position: relative;
          animation: hologram 4s ease-in-out infinite;
        }
        
        .holographic-text::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #00ffea, transparent);
          transform: translateY(calc(var(--scan-position, 0%) - 50%));
          animation: scan 2s linear infinite;
        }
        
        @keyframes hologram {
          0%, 100% {
            filter: hue-rotate(0deg) brightness(1);
          }
          50% {
            filter: hue-rotate(180deg) brightness(1.2);
          }
        }
        
        @keyframes scan {
          0% {
            transform: translateY(-50%);
          }
          100% {
            transform: translateY(100%);
          }
        }
      `}</style>
    </div>
  );
};

export default HolographicText;