import React, { useEffect, useRef } from 'react';

const CircuitBoard = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const gridSize = 80;
    const nodes = [];
    const connections = [];
    let time = 0;

    // Create circuit nodes
    for (let x = gridSize; x < width - gridSize; x += gridSize) {
      for (let y = gridSize; y < height - gridSize; y += gridSize) {
        nodes.push({
          x: x + (Math.random() - 0.5) * 20,
          y: y + (Math.random() - 0.5) * 20,
          active: Math.random() > 0.7,
          pulse: Math.random() * Math.PI * 2,
          speed: 0.01 + Math.random() * 0.02,
        });
      }
    }

    // Create connections between nearby nodes
    nodes.forEach((nodeA, i) => {
      nodes.slice(i + 1).forEach((nodeB, j) => {
        const dx = nodeA.x - nodeB.x;
        const dy = nodeA.y - nodeB.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < gridSize * 1.5) {
          connections.push({
            nodeA: i,
            nodeB: i + j + 1,
            distance,
            active: Math.random() > 0.5,
            progress: Math.random() * distance,
            speed: 0.5 + Math.random() * 2,
          });
        }
      });
    });

    const draw = () => {
      ctx.fillStyle = 'rgba(10, 10, 20, 0.1)';
      ctx.fillRect(0, 0, width, height);

      // Update and draw connections
      connections.forEach(conn => {
        const nodeA = nodes[conn.nodeA];
        const nodeB = nodes[conn.nodeB];
        
        conn.progress += conn.speed;
        if (conn.progress > conn.distance) {
          conn.progress = 0;
          conn.active = Math.random() > 0.3;
        }
        
        if (!conn.active) return;
        
        const progressRatio = conn.progress / conn.distance;
        const pulseX = nodeA.x + (nodeB.x - nodeA.x) * progressRatio;
        const pulseY = nodeA.y + (nodeB.y - nodeA.y) * progressRatio;
        
        // Draw connection line
        ctx.beginPath();
        ctx.moveTo(nodeA.x, nodeA.y);
        ctx.lineTo(nodeB.x, nodeB.y);
        ctx.strokeStyle = 'rgba(0, 255, 157, 0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw pulse along connection
        ctx.beginPath();
        ctx.arc(pulseX, pulseY, 3, 0, Math.PI * 2);
        
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ff9d';
        ctx.fillStyle = '#00ff9d';
        ctx.globalAlpha = 0.8;
        ctx.fill();
        
        ctx.shadowBlur = 0;
      });

      // Update and draw nodes
      nodes.forEach(node => {
        node.pulse += node.speed;
        
        const pulseSize = 3 + Math.sin(node.pulse) * 2;
        const isActive = Math.sin(time * 0.001 + node.x * 0.01) > 0;
        
        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseSize, 0, Math.PI * 2);
        
        if (isActive) {
          ctx.shadowBlur = 25;
          ctx.shadowColor = '#00b8ff';
          ctx.fillStyle = '#00b8ff';
        } else {
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#666';
          ctx.fillStyle = '#444';
        }
        
        ctx.globalAlpha = 0.8;
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Draw node glow
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseSize + 5, 0, Math.PI * 2);
        ctx.strokeStyle = isActive ? 'rgba(0, 184, 255, 0.3)' : 'rgba(100, 100, 100, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    };

    const animate = () => {
      time += 16;
      draw();
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
      style={{ opacity: 0.4 }}
    />
  );
};

export default CircuitBoard;