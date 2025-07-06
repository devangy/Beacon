// import { prisma } from '../utils/prismaClient.js';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { getUserChats , startNewChat} from '../controllers/chatController.js';

const router = express.Router();

router.get('/', asyncHandler(getUserChats)); // get all user chats

router.post('/new-chat', asyncHandler((startNewChat)))

export default router;