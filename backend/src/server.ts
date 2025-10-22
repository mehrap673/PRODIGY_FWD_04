import app from './app';
import { connectDB } from './config/database';
import { Server } from 'socket.io';
import http from 'http';
import { initializeSocket } from './socket';

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

// Initialize socket handlers
initializeSocket(io);

// Start server
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Socket.IO running`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
