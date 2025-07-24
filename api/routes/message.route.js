import express from 'express';
import asyncHandler from 'express-async-handler';

import { getChatMessages } from '../controllers/messageController.js';

const router = express.Router();

router.get('/:chatId', asyncHandler(getChatMessages)); // get all user friends

export default router;