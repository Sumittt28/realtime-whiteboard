const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Configure CORS
app.use(cors());

// Initialize Socket.io with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Store active users and their drawing data
const activeUsers = new Map();
const drawingHistory = [];

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`✅ New user connected: ${socket.id}`);

  // Send current drawing history to new user
  socket.emit('drawing-history', drawingHistory);

  // Assign random color to user
  const userColor = generateRandomColor();
  activeUsers.set(socket.id, { color: userColor, cursor: null });

  // Broadcast active users
  io.emit('active-users', Array.from(activeUsers.entries()).map(([id, data]) => ({
    id,
    color: data.color
  })));

  // Handle drawing events
  socket.on('draw', (data) => {
    // Add user color to drawing data
    const drawingData = {
      ...data,
      userId: socket.id,
      color: activeUsers.get(socket.id)?.color || '#000000',
      timestamp: Date.now()
    };

    // Store in history (limit to last 1000 strokes for memory efficiency)
    drawingHistory.push(drawingData);
    if (drawingHistory.length > 1000) {
      drawingHistory.shift();
    }

    // Broadcast to all other clients
    socket.broadcast.emit('draw', drawingData);
  });

  // Handle cursor movement
  socket.on('cursor-move', (position) => {
    const userData = activeUsers.get(socket.id);
    if (userData) {
      userData.cursor = position;
      socket.broadcast.emit('cursor-update', {
        userId: socket.id,
        position,
        color: userData.color
      });
    }
  });

  // Handle clear canvas
  socket.on('clear-canvas', () => {
    drawingHistory.length = 0; // Clear history
    io.emit('clear-canvas');
  });

  // Handle undo
  socket.on('undo', () => {
    if (drawingHistory.length > 0) {
      const lastStroke = drawingHistory.pop();
      io.emit('undo', lastStroke);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
    activeUsers.delete(socket.id);
    
    // Broadcast updated active users
    io.emit('active-users', Array.from(activeUsers.entries()).map(([id, data]) => ({
      id,
      color: data.color
    })));
  });
});

// Helper function to generate random color
function generateRandomColor() {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    activeUsers: activeUsers.size,
    drawingHistory: drawingHistory.length 
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Ready to handle real-time whiteboard connections`);
});
