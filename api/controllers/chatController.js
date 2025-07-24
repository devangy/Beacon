import { prisma } from "../utils/prismaClient.js";
import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";

export const getUserChats = async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = req.headers.authorization.split(" ")[1]; // extracting token by splitting Bearer Token into array and accesing token [1]

  if (!token) return res.status(401).json({ message: "Unauthorized: No token provided" });

  const payload = jwt.verify(token, process.env.JWT_SECRET);
  const userId = payload.id;

  console.log("userId extrct", userId);


  // all chats of the user with members details
  const chats = await prisma.chat.findMany({
    where: {
      members: {
        some: {
          userId: userId,
        },
      },
    },
    select: {
      id: true,
      isGroup: true,
      members: {
        select: {
          user: {
            select: {
              id: true,
              username: true, // Only include specific fields
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  console.log("allchat", chats);

  res.status(200).json({
    success: true,
    data: chats,
    message: "all user chats fetched",
  });
};

const userId = "ae2ac7dc-403f-48ba-8dfe-e1837a2db958";

// getUserChats(userId)

export const startNewChat = async (req, res) => {
  const { friendId } = req.body;
  console.log("friend here:", friendId);

  // check if a chat with this friendId exists in DB

  const existingChat = await prisma.chat.findFirst({
    where: {
      members: {
        every: {
          userId: {
            in: [currentUserId, friendId],
          },
        },
      },
    },
    include: {
      members: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!existingChat) {
    res.status(200).json({
      success: true,
      message: "Existing chat with this user already exists",
      data: existingChat,
    });
  }

  // create a chat with both the user and the user's friendId

  const newChat = await prisma.chat.create({
    data: {
      members: {
        create: [
          { user: { connect: { id: currentUserId } } },
          { user: { connect: { id: friendId } } },
        ],
      },
    },
  });

  res.status(200).json({
    success: true,
    message: "New Chat created with the user",
    data: {
      data: newChat,
    },
  });
};

// startNewChat(userId, friendId);
