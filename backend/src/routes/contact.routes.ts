import express from 'express';
import {
  sendContactRequest,
  getPendingRequests,
  getSentRequests,
  acceptContactRequest,
  rejectContactRequest,
  getContacts,
  searchUsers,
  removeContact,
} from '../controllers/contact.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.post('/request', sendContactRequest);
router.get('/requests/pending', getPendingRequests);
router.get('/requests/sent', getSentRequests);
router.post('/accept/:requestId', acceptContactRequest);
router.post('/reject/:requestId', rejectContactRequest);
router.get('/', getContacts);
router.get('/search', searchUsers);
router.delete('/:contactId', removeContact);

export default router;
