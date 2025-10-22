import express from 'express';
import {
  getChatHistory,
  uploadImageHandler,
  uploadAudioHandler,
  getUnreadCount,
  deleteMessage,
  editMessage,
  toggleReaction,
} from '../controllers/message.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/chat/:userId', getChatHistory);
router.post('/upload/image', upload.single('image'), uploadImageHandler);
router.post('/upload/audio', upload.single('audio'), uploadAudioHandler);
router.get('/unread/count', getUnreadCount);
router.delete('/:messageId', deleteMessage);
router.put('/:messageId/edit', editMessage); // NEW: Edit message
router.post('/:messageId/reaction', toggleReaction); // NEW: Toggle reaction

export default router;
