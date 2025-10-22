import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Message from '../models/Message';
import Contact from '../models/Contact';
import { uploadImage, uploadAudio } from '../services/cloudinary.service';
import { sendSuccess, sendError } from '../utils/response';

// Upload image
export const uploadImageHandler = async (req: AuthRequest, res: Response) => {
  try {
    console.log('📸 Image upload request received');
    console.log('User:', req.user?._id);
    console.log('File:', req.file);

    if (!req.file) {
      console.log('❌ No file uploaded');
      return sendError(res, 400, 'No file uploaded');
    }

    console.log('📁 File details:', {
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    console.log('☁️ Uploading to Cloudinary...');
    const imageUrl = await uploadImage(req.file.path);
    console.log('✅ Upload successful!');
    console.log('🔗 URL:', imageUrl);

    sendSuccess(res, 200, 'Image uploaded successfully', { url: imageUrl });
  } catch (error: any) {
    console.error('❌ Image upload error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    sendError(res, 500, error.message || 'Image upload failed');
  }
};

// Upload audio
export const uploadAudioHandler = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🎤 Audio upload request received');
    
    if (!req.file) {
      console.log('❌ No file uploaded');
      return sendError(res, 400, 'No file uploaded');
    }

    console.log('☁️ Uploading to Cloudinary...');
    const audioUrl = await uploadAudio(req.file.path);
    console.log('✅ Upload successful:', audioUrl);

    sendSuccess(res, 200, 'Audio uploaded successfully', { url: audioUrl });
  } catch (error: any) {
    console.error('❌ Audio upload error:', error);
    console.error('Error message:', error.message);
    sendError(res, 500, error.message || 'Audio upload failed');
  }
};

// Get chat history
export const getChatHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Verify they are contacts
    const isContact = await Contact.findOne({
      user: currentUserId,
      contact: userId,
    });

    if (!isContact) {
      return sendError(res, 403, 'You can only view messages from your contacts');
    }

    // Get messages between the two users
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId },
      ],
    })
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar')
      .populate({
        path: 'replyTo',
        select: 'content type sender image',
        populate: { path: 'sender', select: 'name' }
      })
      .populate('reactions.user', 'name')
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      {
        sender: userId,
        receiver: currentUserId,
        isRead: false,
      },
      {
        isRead: true,
      }
    );

    sendSuccess(res, 200, 'Chat history fetched successfully', { messages });
  } catch (error: any) {
    sendError(res, 500, error.message || 'Server error');
  }
};

// Get unread message count
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const unreadCount = await Message.countDocuments({
      receiver: req.user._id,
      isRead: false,
    });

    sendSuccess(res, 200, 'Unread count fetched', { count: unreadCount });
  } catch (error: any) {
    sendError(res, 500, error.message || 'Server error');
  }
};

// Delete message
export const deleteMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      return sendError(res, 404, 'Message not found');
    }

    // Only sender can delete
    if (message.sender.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Not authorized to delete this message');
    }

    await message.deleteOne();

    sendSuccess(res, 200, 'Message deleted successfully', null);
  } catch (error: any) {
    sendError(res, 500, error.message || 'Server error');
  }
};

// NEW: Edit message
export const editMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return sendError(res, 400, 'Message content cannot be empty');
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return sendError(res, 404, 'Message not found');
    }

    // Only sender can edit
    if (message.sender.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Not authorized to edit this message');
    }

    // Can only edit text messages
    if (message.type !== 'text') {
      return sendError(res, 400, 'Only text messages can be edited');
    }

    message.content = content.trim();
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar')
      .populate({
        path: 'replyTo',
        select: 'content type sender image',
        populate: { path: 'sender', select: 'name' }
      })
      .populate('reactions.user', 'name');

    sendSuccess(res, 200, 'Message edited successfully', { message: populatedMessage });
  } catch (error: any) {
    sendError(res, 500, error.message || 'Server error');
  }
};

// NEW: Add/Remove reaction
export const toggleReaction = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return sendError(res, 400, 'Emoji is required');
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return sendError(res, 404, 'Message not found');
    }

    const userId = req.user._id;
    const existingReaction = message.reactions.find(
      (r) => r.user.toString() === userId.toString() && r.emoji === emoji
    );

    if (existingReaction) {
      // Remove reaction
      message.reactions = message.reactions.filter(
        (r) => !(r.user.toString() === userId.toString() && r.emoji === emoji)
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
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar')
      .populate({
        path: 'replyTo',
        select: 'content type sender image',
        populate: { path: 'sender', select: 'name' }
      })
      .populate('reactions.user', 'name');

    sendSuccess(res, 200, 'Reaction toggled successfully', { message: populatedMessage });
  } catch (error: any) {
    sendError(res, 500, error.message || 'Server error');
  }
};
