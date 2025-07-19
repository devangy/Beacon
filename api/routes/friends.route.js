import express from 'express';
import asyncHandler from 'express-async-handler';
import { getFriends } from '../controllers/friendController.js';

const router = express.Router();

router.get('/:userId', asyncHandler(getFriends)); // get all user friends

export default router;