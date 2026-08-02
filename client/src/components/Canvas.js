import React, { useRef, useEffect, useState } from 'react';
import { getSocket } from '../utils/socket';
import './Canvas.css';

const Canvas = ({ brushColor, brushSize }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPosition, setLastPosition] = useState(null);
  const [remoteCursors, setRemoteCursors] = useState({});

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const socket = getSocket();

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Configure context
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Listen for drawing from other users
    socket.on('draw', (data) => {
      drawLine(ctx, data.from, data.to, data.color, data.brushSize);
    });

    // Listen for drawing history
    socket.on('drawing-history', (history) => {
      history.forEach((stroke) => {
        drawLine(ctx, stroke.from, stroke.to, stroke.color, stroke.brushSize);
      });
    });

    // Listen for cursor updates
    socket.on('cursor-update', (data) => {
      setRemoteCursors(prev => ({
        ...prev,
        [data.userId]: { position: data.position, color: data.color }
      }));

      // Remove cursor after 2 seconds of inactivity
      setTimeout(() => {
        setRemoteCursors(prev => {
          const updated = { ...prev };
          delete updated[data.userId];
          return updated;
        });
      }, 2000);
    });

    // Listen for clear canvas
    socket.on('clear-canvas', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    // Handle window resize
    const handleResize = () => {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      ctx.putImageData(imageData, 0, 0);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      socket.off('draw');
      socket.off('drawing-history');
      socket.off('cursor-update');
      socket.off('clear-canvas');
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const drawLine = (ctx, from, to, color, size) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const getMousePosition = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const position = getMousePosition(e);
    setLastPosition(position);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const currentPosition = getMousePosition(e);

    // Draw locally
    drawLine(ctx, lastPosition, currentPosition, brushColor, brushSize);

    // Emit to server (with throttling - every 16ms for 60fps)
    const socket = getSocket();
    socket.emit('draw', {
      from: lastPosition,
      to: currentPosition,
      brushSize: brushSize
    });

    // Emit cursor position
    socket.emit('cursor-move', currentPosition);

    setLastPosition(currentPosition);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setLastPosition(null);
  };

  return (
    <div className="canvas-wrapper">
      <canvas
        ref={canvasRef}
        className="drawing-canvas"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
      
      {/* Render remote cursors */}
      {Object.entries(remoteCursors).map(([userId, data]) => (
        <div
          key={userId}
          className="remote-cursor"
          style={{
            left: `${data.position.x}px`,
            top: `${data.position.y}px`,
            backgroundColor: data.color
          }}
        />
      ))}
    </div>
  );
};

export default Canvas;
