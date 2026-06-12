import dotenv from "dotenv";
dotenv.config();
import { prisma } from "../utils/prismaClient.js";

export const getFriends = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId)
            return res
                .status(400)
                .json({ message: "UserID not provided", success: false });

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
            message: "Friends retrieved",
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

export const searchUsers = async (req, res) => {
    try {
        const { userId, query } = req.params;

        if (!userId)
            return res
                .status(400)
                .json({ message: "UserID not provided", success: false });
        if (!query)
            return res
                .status(400)
                .json({ message: "Search query not provided", success: false });

        // Get current user's friends
        const userFriends = await prisma.friend.findMany({
            where: {
                userId: userId,
                status: "accepted",
            },
            select: {
                friendId: true,
            },
        });

        const friendIds = userFriends.map((f) => f.friendId);

        // Search for users matching the query, excluding current user and existing friends
        const users = await prisma.user.findMany({
            where: {
                username: {
                    contains: query,
                    mode: "insensitive",
                },
                id: {
                    notIn: [userId, ...friendIds],
                },
            },
            select: {
                id: true,
                username: true,
                avatarUrl: true,
            },
            take: 10, // Limit to 10 results
        });

        res.status(200).json({
            success: true,
            data: users,
            message: "Users found",
        });
    } catch (error) {
        console.error("Error searching users:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to search users",
            error: error.message || "Unknown error",
        });
    }
};

export const addFriend = async (req, res) => {
    try {
        const { userId, friendId } = req.params;

        if (!userId)
            return res
                .status(400)
                .json({ message: "UserID not provided", success: false });
        if (!friendId)
            return res
                .status(400)
                .json({ message: "Friend ID not provided", success: false });

        if (userId === friendId)
            return res
                .status(400)
                .json({
                    message: "Cannot add yourself as a friend",
                    success: false,
                });

        // Check if friendship already exists
        const existingFriendship = await prisma.friend.findUnique({
            where: {
                userId_friendId: {
                    userId: userId,
                    friendId: friendId,
                },
            },
        });

        if (existingFriendship) {
            return res.status(400).json({
                message: "Friendship request already exists",
                success: false,
            });
        }

        // Create friendship with "accepted" status for instant add
        const newFriendship = await prisma.friend.create({
            data: {
                userId: userId,
                friendId: friendId,
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

        // Also create the reverse relationship
        await prisma.friend.create({
            data: {
                userId: friendId,
                friendId: userId,
                status: "accepted",
            },
        });

        res.status(201).json({
            success: true,
            data: newFriendship.friend,
            message: "Friend added successfully",
        });
    } catch (error) {
        console.error("Error adding friend:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to add friend",
            error: error.message || "Unknown error",
        });
    }
};
