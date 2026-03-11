import React, { useEffect, useRef } from 'react';

const BinaryBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;
    
    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    
    const columns = Math.floor(canvas.width / 20); // 20px per column
    const drops = Array(columns).fill(0);
    
    const draw = () => {
      // Semi-transparent black overlay for trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Set text style
      ctx.fillStyle = '#10b981'; // Green color
      ctx.font = '15px "JetBrains Mono", monospace';
      
      // Draw binary characters
      for (let i = 0; i < drops.length; i++) {
        const char = Math.random() > 0.5 ? '0' : '1';
        const x = i * 20;
        const y = drops[i] * 20;
        
        // Draw character
        ctx.fillText(char, x, y);
        
        // Move drop down
        drops[i]++;
        
        // Reset drop if it goes beyond screen
        if (drops[i] * 20 > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
      }
    };
    
    const animate = () => {
      draw();
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    
    const handleResize = () => {
      resizeCanvas();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none opacity-20"
    />
  );
};

export default BinaryBackground;