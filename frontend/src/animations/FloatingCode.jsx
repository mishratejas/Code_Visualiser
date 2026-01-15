import React, { useEffect, useRef, useState } from 'react';

const FloatingCode = () => {
  const [codeBlocks, setCodeBlocks] = useState([]);
  const animationRef = useRef(null);

  const codeSnippets = [
    `function solve() {\n  return "Hello, World!";\n}`,
    `class Solution {\n  public int[] twoSum(...) {\n    // solution\n  }\n}`,
    `def binary_search(arr, x):\n    low, high = 0, len(arr)-1\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] < x:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return low`,
    `const memo = {};\nfunction fibonacci(n) {\n  if (n <= 1) return n;\n  if (memo[n]) return memo[n];\n  return memo[n] = fibonacci(n-1) + fibonacci(n-2);\n}`,
    `// React Component\nfunction CodeEditor() {\n  const [code, setCode] = useState('');\n  return (\n    <Editor\n      value={code}\n      onChange={setCode}\n    />\n  );\n}`,
  ];

  useEffect(() => {
    // Initialize floating code blocks
    const blocks = codeSnippets.map((code, index) => ({
      id: index,
      code,
      x: Math.random() * 80 + 10, // percentage
      y: Math.random() * 80 + 10,
      xSpeed: (Math.random() - 0.5) * 0.1,
      ySpeed: (Math.random() - 0.5) * 0.1,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      scale: 0.8 + Math.random() * 0.4,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
    }));
    
    setCodeBlocks(blocks);

    const animate = () => {
      setCodeBlocks(prev => prev.map(block => {
        let { x, y, xSpeed, ySpeed, rotation, rotationSpeed, scale } = block;
        
        // Update position
        x += xSpeed;
        y += ySpeed;
        rotation += rotationSpeed;
        
        // Bounce off edges
        if (x <= 10 || x >= 90) xSpeed *= -1;
        if (y <= 10 || y >= 90) ySpeed *= -1;
        
        // Gentle scaling animation
        scale = 0.8 + Math.sin(Date.now() * 0.001 + block.id) * 0.1;
        
        return { ...block, x, y, xSpeed, ySpeed, rotation, scale };
      }));
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      {codeBlocks.map(block => (
        <div
          key={block.id}
          className="absolute code-block-animation"
          style={{
            left: `${block.x}%`,
            top: `${block.y}%`,
            transform: `translate(-50%, -50%) rotate(${block.rotation}deg) scale(${block.scale})`,
            filter: `drop-shadow(0 0 20px ${block.color})`,
          }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-current to-transparent opacity-20 animate-pulse"></div>
            <pre className="text-xs font-mono bg-gray-900/80 backdrop-blur-sm text-green-400 p-4 rounded-lg border border-gray-700/50 whitespace-pre">
              <code>{block.code}</code>
            </pre>
            <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-20 blur-sm"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FloatingCode;