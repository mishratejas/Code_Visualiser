import React, { useEffect, useRef } from 'react';

const NeonGrid = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const gridSize = 40;
    let time = 0;
    const neonColors = [
      '#00ff9d', '#00b8ff', '#ff00c8', 
      '#ffd000', '#ff006a', '#00ffea'
    ];

    const drawGrid = () => {
      ctx.fillStyle = 'rgba(10, 10, 20, 0.1)';
      ctx.fillRect(0, 0, width, height);

      // Draw horizontal lines
      for (let y = 0; y < height; y += gridSize) {
        const wave = Math.sin(time * 0.001 + y * 0.01) * 10;
        const opacity = 0.1 + Math.sin(time * 0.002 + y * 0.005) * 0.1;
        
        ctx.beginPath();
        ctx.moveTo(0, y + wave);
        ctx.lineTo(width, y + wave);
        
        ctx.strokeStyle = `rgba(0, 184, 255, ${opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw vertical lines
      for (let x = 0; x < width; x += gridSize) {
        const wave = Math.cos(time * 0.001 + x * 0.01) * 10;
        const opacity = 0.1 + Math.cos(time * 0.002 + x * 0.005) * 0.1;
        
        ctx.beginPath();
        ctx.moveTo(x + wave, 0);
        ctx.lineTo(x + wave, height);
        
        ctx.strokeStyle = `rgba(255, 0, 200, ${opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw intersection points
      for (let y = 0; y < height; y += gridSize) {
        for (let x = 0; x < width; x += gridSize) {
          const waveX = Math.sin(time * 0.001 + x * 0.01 + y * 0.005) * 5;
          const waveY = Math.cos(time * 0.001 + y * 0.01 + x * 0.005) * 5;
          const size = 2 + Math.sin(time * 0.003 + x * 0.01 + y * 0.01) * 2;
          
          const colorIndex = Math.floor((x + y + time * 0.1) / gridSize) % neonColors.length;
          const color = neonColors[colorIndex];
          
          ctx.beginPath();
          ctx.arc(x + waveX, y + waveY, size, 0, Math.PI * 2);
          
          ctx.shadowBlur = 15;
          ctx.shadowColor = color;
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.3 + Math.sin(time * 0.002 + x * 0.01) * 0.2;
          ctx.fill();
        }
      }
    };

    const animate = () => {
      time += 16;
      drawGrid();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.5 }}
    />
  );
};

export default NeonGrid;