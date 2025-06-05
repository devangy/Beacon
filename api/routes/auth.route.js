// import { prisma } from '../utils/prismaClient.js';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { handleLogin } from '../controllers/authController.js';

const router = express.Router();

// POST /api/auth/github
router.post('/github', asyncHandler(handleLogin));

// Add other auth routes here
// router.post('/login', handleLogin);
// router.post('/register', handleRegister);
// router.post('/logout', handleLogout);
// router.get('/me', authenticateToken, getCurrentUser);

export default router;