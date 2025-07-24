import dotenv from "dotenv";
dotenv.config();
import { prisma } from "../utils/prismaClient.js";

export const getFriends = async (req, res) => {
  try {

    const { userId  } = req.params

    if(!userId) return res.status(400).json({message: "UserID not provided" , success: false}) 

    const friends = await prisma.friend.findMany({
      where: {
        userId: userId,
        status: "accepted",
      },
      select: {
        friend: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });


    const actualFriends = friends.map((f) => f.friend);


    console.log("all friends", friends);
    res.status(200).json({
      success: true,
      data: actualFriends,
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
