import React, { useEffect, useRef } from 'react';

const BinaryMatrix = () => {
  const canvasRef = useRef(null);
  const columnsRef = useRef([]);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const fontSize = 14;
    const columns = width / fontSize;
    const symbols = '01{}()[]<>//&&||==+-*/%#@$&';
    
    class Column {
      constructor(x) {
        this.x = x;
        this.y = Math.random() * -height;
        this.speed = 10 + Math.random() * 20;
        this.symbols = [];
        this.switchInterval = 50 + Math.random() * 100;
        this.lastSwitch = 0;
        this.glitch = 0;
        this.init();
      }

      init() {
        for (let i = 0; i < Math.floor(height / fontSize); i++) {
          this.symbols.push({
            char: symbols[Math.floor(Math.random() * symbols.length)],
            brightness: Math.random(),
            speed: this.speed * (0.5 + Math.random() * 0.5),
            glitchOffset: (Math.random() - 0.5) * 5,
          });
        }
      }

      update(time) {
        this.y += this.speed;
        
        if (this.y > height) {
          this.y = -this.symbols.length * fontSize;
        }
        
        // Random glitch
        if (time - this.lastSwitch > this.switchInterval) {
          this.glitch = Math.random() > 0.8 ? 10 : 0;
          this.lastSwitch = time;
        }
        
        if (this.glitch > 0) {
          this.glitch -= 0.5;
        }
      }

      draw(ctx, time) {
        this.symbols.forEach((symbol, i) => {
          const y = this.y + i * fontSize;
          
          if (y < -fontSize || y > height + fontSize) return;
          
          // Fade in/out effect
          let opacity;
          if (y < fontSize * 2) {
            opacity = y / (fontSize * 2);
          } else if (y > height - fontSize * 2) {
            opacity = (height - y) / (fontSize * 2);
          } else {
            opacity = symbol.brightness;
          }
          
          const green = Math.min(255, Math.floor(100 + opacity * 155));
          const color = `rgba(0, ${green}, 100, ${opacity})`;
          
          // Apply glitch
          const offsetX = this.glitch > 0 ? (Math.random() - 0.5) * this.glitch : 0;
          const offsetY = this.glitch > 0 ? (Math.random() - 0.5) * this.glitch : 0;
          
          ctx.save();
          ctx.translate(this.x + offsetX + symbol.glitchOffset, y + offsetY);
          
          // Trail effect for leading symbol
          if (i === 0) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#00ff9d';
            ctx.fillStyle = '#ffffff';
          } else {
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
            ctx.fillStyle = color;
          }
          
          ctx.font = `bold ${fontSize}px 'JetBrains Mono', monospace`;
          ctx.textAlign = 'center';
          ctx.fillText(symbol.char, 0, 0);
          
          ctx.restore();
        });
      }
    }

    // Initialize columns
    columnsRef.current = [];
    for (let i = 0; i < columns; i++) {
      columnsRef.current.push(new Column(i * fontSize));
    }

    const animate = (time) => {
      // Dark fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, width, height);

      // Draw columns
      columnsRef.current.forEach(column => {
        column.update(time);
        column.draw(ctx, time);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate(0);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      columnsRef.current = [];
      for (let i = 0; i < width / fontSize; i++) {
        columnsRef.current.push(new Column(i * fontSize));
      }
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
      style={{ opacity: 0.6 }}
    />
  );
};

export default BinaryMatrix;