import { prisma } from "./prismaClient.js";

const BOT_GITHUB_ID = 0; // Sentinel value for bot user
const BOT_USERNAME = "Baburao AI Assistant";
const BOT_AVATAR_URL = "https://avatars.githubusercontent.com/u/219565346?v=4";

// Ensure the bot user exists in the database, return it
export async function ensureBotUser() {
    const botUser = await prisma.user.upsert({
        where: { githubId: BOT_GITHUB_ID },
        update: { avatarUrl: BOT_AVATAR_URL },
        create: {
            githubId: BOT_GITHUB_ID,
            username: BOT_USERNAME,
            avatarUrl: BOT_AVATAR_URL,
            isBot: true,
        },
    });

    console.log("Bot user ready:", botUser.id);
    return botUser;
}

// Create default friend + AI chat for a new user
export async function setupBotForNewUser(userId) {
    const botUser = await prisma.user.findFirst({
        where: { githubId: BOT_GITHUB_ID },
    });

    if (!botUser) {
        console.error("Bot user not found, cannot setup for new user");
        return;
    }

    // Create bidirectional friend relationships
    await prisma.friend.upsert({
        where: {
            userId_friendId: { userId: userId, friendId: botUser.id },
        },
        update: {},
        create: {
            userId: userId,
            friendId: botUser.id,
            status: "accepted",
        },
    });

    await prisma.friend.upsert({
        where: {
            userId_friendId: { userId: botUser.id, friendId: userId },
        },
        update: {},
        create: {
            userId: botUser.id,
            friendId: userId,
            status: "accepted",
        },
    });

    // Create AI chat with both as members
    const existingChat = await prisma.chat.findFirst({
        where: {
            isAI: true,
            members: {
                some: { userId: userId },
            },
        },
    });

    if (existingChat) {
        console.log("AI chat already exists for user", userId);
        return existingChat;
    }

    const aiChat = await prisma.chat.create({
        data: {
            isAI: true,
            members: {
                create: [
                    { user: { connect: { id: userId } } },
                    { user: { connect: { id: botUser.id } } },
                ],
            },
        },
    });

    // Send a welcome message from the bot
    const botMember = await prisma.member.findFirst({
        where: { userId: botUser.id, chatId: aiChat.id },
    });

    await prisma.message.create({
        data: {
            chatId: aiChat.id,
            senderId: botUser.id,
            memberId: botMember.id,
            payload: "Hey! I'm Baburao, your AI assistant. Ask me anything!",
        },
    });

    console.log("AI chat created for user", userId, "chatId:", aiChat.id);
    return aiChat;
}
