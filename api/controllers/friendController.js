import dotenv from "dotenv";
dotenv.config();
import { prisma } from "../utils/prismaClient.js";

export const getFriends = async (req, res) => {
  try {
    const friends = await prisma.user.findMany({
      where: { id: req.params.userId },
      include: {
        friends: {
          where: {
            status: "accepted", // ✅ This is correct now
          },
          include: {
            friend: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    console.log("all friends", friends);

    res.status(200).json({
      success: true,
      data: friends,
      message: "Friends retrieved successfully",
    });
  } catch (error) {
    console.error("Error retrieving friends:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve friends",
      error: error.message || "Unknown error",
    });
  }
};
