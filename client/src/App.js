import React, { useState, useEffect } from 'react';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import UserList from './components/UserList';
import { initSocket, getSocket } from './utils/socket';
import './App.css';

function App() {
  const [activeUsers, setActiveUsers] = useState([]);
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(2);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    initSocket();
    const socket = getSocket();

    socket.on('connect', () => {
      console.log('✅ Connected to server');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      setIsConnected(false);
    });

    socket.on('active-users', (users) => {
      setActiveUsers(users);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('active-users');
    };
  }, []);

  const handleClearCanvas = () => {
    const socket = getSocket();
    socket.emit('clear-canvas');
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>🎨 Real-Time Collaborative Whiteboard</h1>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </header>

      <div className="app-container">
        <Toolbar
          brushColor={brushColor}
          setBrushColor={setBrushColor}
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          onClear={handleClearCanvas}
        />

        <div className="canvas-container">
          <Canvas 
            brushColor={brushColor} 
            brushSize={brushSize}
          />
        </div>

        <UserList users={activeUsers} />
      </div>

      <footer className="app-footer">
        <p>Built with ❤️ by Sumit Kumar Singh | Real-time collaboration powered by WebSockets</p>
      </footer>
    </div>
  );
}

export default App;
