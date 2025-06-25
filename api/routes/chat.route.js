// import { prisma } from '../utils/prismaClient.js';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { getUserChats } from '../controllers/authController.js';

const router = express.Router();

router.get('/getChats', asyncHandler(getUserChats));

export default router;