// routes/user.routes.ts
import express from 'express';
import {
  getMe,
  updateProfile,
  updateAvatar,
  getUserById,
  deleteAccount,
  changePassword,
} from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';  // ADD THIS

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/me', getMe);
router.put('/me', updateProfile);

// ADD MULTER MIDDLEWARE HERE
router.put('/me/avatar', upload.single('avatar'), updateAvatar);

router.put('/me/password', changePassword);
router.delete('/me', deleteAccount);
router.get('/:userId', getUserById);

export default router;
