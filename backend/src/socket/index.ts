import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import { handleMessage } from './handlers/message.handler';
import { handleTyping } from './handlers/typing.handler';
import { handlePresence } from './handlers/presence.handler';

// Extend Server type
declare module 'socket.io' {
  interface Server {
    userSockets: Map<string, string>;
  }
}

export const initializeSocket = (io: Server) => {
  // Store user socket IDs
  io.userSockets = new Map<string, string>();

  // Socket authentication middleware
  io.use((socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = verifyToken(token);
      socket.data.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }

  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;
    console.log(`✅ User connected: ${userId}`);

    // Store socket ID for this user
    io.userSockets.set(userId, socket.id);

    // Register handlers
    handleMessage(socket, io);
    handleTyping(socket, io);
    handlePresence(socket, io);

    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${userId}`);
    });
  });
};
