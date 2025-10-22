import { Socket } from 'socket.io';
import Message from '../../models/Message';
import Contact from '../../models/Contact';

export const handleMessage = (socket: Socket, io: any) => {
  // Send text message (with optional reply)
  socket.on('message:send', async (data: any) => {
    try {
      const { receiverId, content, type = 'text', image, audio, replyTo } = data;
      const senderId = socket.data.userId;

      // Verify they are contacts
      const isContact = await Contact.findOne({
        user: senderId,
        contact: receiverId,
      });

      if (!isContact) {
        socket.emit('message:error', { message: 'Can only send messages to contacts' });
        return;
      }

      // Create message
      const messageData: any = {
        sender: senderId,
        receiver: receiverId,
        content,
        image,
        audio,
        type,
        isRead: false,
      };

      // Add reply if provided
      if (replyTo) {
        messageData.replyTo = replyTo;
      }

      const message = await Message.create(messageData);

      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'name avatar isOnline')
        .populate('receiver', 'name avatar isOnline')
        .populate({
          path: 'replyTo',
          select: 'content type sender image',
          populate: { path: 'sender', select: 'name' }
        })
        .populate('reactions.user', 'name');

      // Emit to sender (confirmation)
      socket.emit('message:sent', populatedMessage);

      // Emit to receiver (if online)
      const receiverSocketId = io.userSockets.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('message:receive', populatedMessage);
      }
    } catch (error: any) {
      console.error('Message send error:', error);
      socket.emit('message:error', { message: error.message });
    }
  });

  // Edit message
  socket.on('message:edit', async (data: any) => {
    try {
      const { messageId, content } = data;
      const senderId = socket.data.userId;

      const message = await Message.findById(messageId);

      if (!message) {
        socket.emit('message:error', { message: 'Message not found' });
        return;
      }

      if (message.sender.toString() !== senderId) {
        socket.emit('message:error', { message: 'Not authorized' });
        return;
      }

      if (message.type !== 'text') {
        socket.emit('message:error', { message: 'Can only edit text messages' });
        return;
      }

      message.content = content;
      message.isEdited = true;
      message.editedAt = new Date();
      await message.save();

      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'name avatar isOnline')
        .populate('receiver', 'name avatar isOnline')
        .populate({
          path: 'replyTo',
          select: 'content type sender image',
          populate: { path: 'sender', select: 'name' }
        })
        .populate('reactions.user', 'name');

      // Emit to sender
      socket.emit('message:edited', populatedMessage);

      // Emit to receiver
      const receiverSocketId = io.userSockets.get(message.receiver.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('message:edited', populatedMessage);
      }
    } catch (error: any) {
      console.error('Edit message error:', error);
      socket.emit('message:error', { message: error.message });
    }
  });

  // Toggle reaction
  socket.on('message:reaction', async (data: any) => {
    try {
      const { messageId, emoji } = data;
      const userId = socket.data.userId;

      const message = await Message.findById(messageId);

      if (!message) {
        socket.emit('message:error', { message: 'Message not found' });
        return;
      }

      const existingReaction = message.reactions.find(
        (r) => r.user.toString() === userId && r.emoji === emoji
      );

      if (existingReaction) {
        // Remove reaction
        message.reactions = message.reactions.filter(
          (r) => !(r.user.toString() === userId && r.emoji === emoji)
        );
      } else {
        // Add reaction
        message.reactions.push({
          user: userId,
          emoji,
          createdAt: new Date(),
        });
      }

      await message.save();

      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'name avatar isOnline')
        .populate('receiver', 'name avatar isOnline')
        .populate({
          path: 'replyTo',
          select: 'content type sender image',
          populate: { path: 'sender', select: 'name' }
        })
        .populate('reactions.user', 'name');

      // Emit to both users
      socket.emit('message:reacted', populatedMessage);
      
      const otherUserId = message.sender.toString() === userId 
        ? message.receiver.toString() 
        : message.sender.toString();
      
      const otherSocketId = io.userSockets.get(otherUserId);
      if (otherSocketId) {
        io.to(otherSocketId).emit('message:reacted', populatedMessage);
      }
    } catch (error: any) {
      console.error('Reaction error:', error);
      socket.emit('message:error', { message: error.message });
    }
  });

  // Mark messages as read
  socket.on('message:read', async (data: any) => {
    try {
      const { senderId } = data;
      const receiverId = socket.data.userId;

      await Message.updateMany(
        {
          sender: senderId,
          receiver: receiverId,
          isRead: false,
        },
        {
          isRead: true,
        }
      );

      // Notify sender that messages were read
      const senderSocketId = io.userSockets.get(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit('message:read', { userId: receiverId });
      }
    } catch (error: any) {
      console.error('Mark as read error:', error);
    }
  });
};
