import { Socket } from 'socket.io';

export const handleTyping = (socket: Socket, io: any) => {
  socket.on('typing:start', (data: any) => {
    const { receiverId } = data;
    const senderId = socket.data.userId;

    const receiverSocketId = io.userSockets.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('typing:start', { userId: senderId });
    }
  });

  socket.on('typing:stop', (data: any) => {
    const { receiverId } = data;
    const senderId = socket.data.userId;

    const receiverSocketId = io.userSockets.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('typing:stop', { userId: senderId });
    }
  });
};
