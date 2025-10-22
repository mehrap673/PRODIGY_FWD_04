import { Socket } from 'socket.io';
import User from '../../models/User';

export const handlePresence = (socket: Socket, io: any) => {
  socket.on('user:online', async () => {
    try {
      const userId = socket.data.userId;

      await User.findByIdAndUpdate(userId, {
        isOnline: true,
      });

      // Broadcast to all connected users
      socket.broadcast.emit('user:status', {
        userId,
        isOnline: true,
      });
    } catch (error) {
      console.error('Online status error:', error);
    }
  });

  socket.on('disconnect', async () => {
    try {
      const userId = socket.data.userId;

      if (userId) {
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        });

        // Broadcast to all connected users
        socket.broadcast.emit('user:status', {
          userId,
          isOnline: false,
        });

        // Remove from online users map
        io.userSockets.delete(userId);
      }
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  });
};
