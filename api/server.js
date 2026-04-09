import { createServer } from "node:http";
import { Server } from "socket.io";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import authRouter from "./routes/auth.route.js";
import chatRouter from "./routes/chat.route.js";
import friendRouter from "./routes/friends.route.js";
import messageRouter from "./routes/message.route.js";
import compression from "compression";
import pino from "pino";
import pinoHttp from "pino-http";
import pinoPretty from "pino-pretty";
import pkg from "pino-multi-stream";
import helmet from "helmet";
// import { saveMessageToDB } from "./controllers/messageController.js";
import { prisma } from "./utils/prismaClient.js";
import { ensureBotUser } from "./utils/botUser.js";
import { getAIResponse } from "./controllers/aiController.js";
import express from "express";

const { multistream } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3082;

//  check if folder or create
if (!fs.existsSync("logs")) {
    fs.mkdirSync("logs");
}

// creating a write stream for logs
const logStream = fs.createWriteStream(
    path.join(__dirname, "logs", "access.log"),
    { flags: "a" },
);

// Streams:  Console + File Stream
const streams = [
    { stream: pinoPretty({ colorize: true }) }, // Console
    { stream: logStream }, // File
];

const logger = pino({}, multistream(streams));

const app = express();
const server = createServer(app);
export const io = new Server(server, {
    cors: { origin: "*" },
});

// middlewares
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
        contentSecurityPolicy: false,
    }),
);
app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
// pino-http logger
app.use(pinoHttp({ logger }));

// Test Route
app.use("/test", (req, res) => {
    res.json({ message: "Test route working!" });
});

app.use("/api/auth", authRouter);

// Check if a chat is an AI chat (must be before chatRouter)
app.get("/api/chats/is-ai/:chatId", async (req, res) => {
    try {
        const chat = await prisma.chat.findUnique({
            where: { id: req.params.chatId },
            select: { isAI: true },
        });
        res.json({ isAI: chat?.isAI ?? false });
    } catch (err) {
        res.json({ isAI: false });
    }
});

app.use("/api/chats", chatRouter);
app.use("/api/friends", friendRouter);
app.use("/api/messages", messageRouter);

app.post("/api/keys/get", async (req, res) => {
    try {
        const { userId } = req.body;
        console.log("userIdofothermemenr", userId);

        // Get the user's most recent public key.
        // ML-KEM public keys are safe to reuse — each encapsulation
        // produces a unique ciphertext and shared secret.
        const pk = await prisma.publicKey.findFirst({
            where: {
                userId: userId,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        if (!pk) {
            return res.status(404).json({
                success: false,
                message: "No public key found for this user.",
            });
        }

        const pkbase64 = Buffer.from(pk.key).toString("base64");

        console.log("get public keybase64: ", pk);

        return res.status(200).json({
            success: true,
            pk: pkbase64,
        });
    } catch (err) {
        console.error("get public keys: ", err);
    }
});

app.post("/api/keys", async (req, res) => {
    try {
        const { userId, publicKey } = req.body;

        if (!userId) {
            return res.status(400).json({ error: "userId required" });
        }

        let bytesDecoded = Buffer.from(publicKey, "base64");

        await prisma.publicKey.create({
            data: {
                userId: userId,
                key: bytesDecoded,
            },
        });

        return res.status(200).json({
            success: true,
            message: "User public keys received",
        });
    } catch (err) {
        console.error("GET KEYS ERROR:", err);
        return res
            .status(500)
            .json({ success: false, error: "Internal server error" });
    }
});

// endpoint uploading ciphertext which contains the Shared secret key
app.post("/api/ciphertext", async (req, res) => {
    try {
        const { ciphertext, receiverId, userId, chatId } = req.body;

        let decoded_ct = Buffer.from(ciphertext, "base64");
        console.log("server: received decoded_ct", decoded_ct);

        const keyExchange = await prisma.keyExchange.create({
            data: {
                ciphertext: decoded_ct,
                userId: userId,
                chatId: chatId,
                receiverId: receiverId,
                isDelivered: false,
            },
        });

        console.log("keyExchange", keyExchange);

        return res.status(200).json({
            success: true,
            message: "Ciphertext uploaded successfully!",
        });
    } catch (err) {
        console.error(err);
        return res
            .status(500)
            .json({ success: false, error: "Internal server error" });
    }
});

// endpoint for getting a shared secret key for a chat using chatId
app.post("/api/ciphertext/get", async (req, res) => {
    try {
        const { chatId, userId, receiverId } = req.body;

        const ssk = await prisma.keyExchange.findFirst({
            where: {
                chatId: chatId,
                userId: userId,
                receiverId: receiverId,
                isDelivered: false,
            },
        });

        if (!ssk) {
            return res.status(200).json({
                success: false,
                message: "Ciphertext not found on the server!",
            });
        }

        console.log("ciphertext in db:", ssk.ciphertext);
        console.log("ssk ciphertext get", ssk);
        res.status(200).json({
            success: true,
            chatId: ssk.chatId,
            receiverId: ssk.receiverId,
            ciphertext: Buffer.from(ssk.ciphertext).toString("base64"),
            message: "ciphertext already exists on server!",
        });
    } catch (err) {
        console.error(err);
        return res
            .status(500)
            .json({ success: false, error: "Internal server error" });
    }
});

io.on("connection", (socket) => {
    console.log("a user connected", socket.id);
    // socket.socket.on("key-exchange", async (callback) => {});
    //

    socket.on("chat:join", async (userId, chatId) => {
        console.log("Joined chat", userId, chatId);
        socket.join(chatId);
    });

    socket.on("message", async (newMessage, callback) => {
        try {
            console.log("Received message:", newMessage);

            // retrieving the member info the user is part of from userId and chatId
            const member = await prisma.member.findFirst({
                where: {
                    userId: newMessage.userId,
                    chatId: newMessage.chatId,
                },
            });

            console.log("memberfromuserid", member);

            if (!member) {
                console.error("Member not found for userId:", newMessage.userId, "chatId:", newMessage.chatId);
                if (callback) callback({ success: false, error: "Member not found" });
                return;
            }

            const savedMessage = await prisma.message.create({
                data: {
                    chatId: member.chatId,
                    senderId: newMessage.userId,
                    memberId: member.id,
                    payload: newMessage.payload,
                },
            });

            console.log("Saved messageDB:", savedMessage);

            // emit message to all users in the chat
            io.to(member.chatId).emit("message", savedMessage);

            // Send success response with the saved message
            if (callback) callback({ success: true, message: savedMessage });
            console.log("saved message", savedMessage);

            // Check if this is an AI chat - if so, generate bot reply
            const chat = await prisma.chat.findUnique({
                where: { id: newMessage.chatId },
            });

            if (chat && chat.isAI) {
                // Get the bot user's member record in this chat
                const botUser = await prisma.user.findFirst({
                    where: { isBot: true },
                });

                if (!botUser || newMessage.userId === botUser.id) return;

                const botMember = await prisma.member.findFirst({
                    where: {
                        userId: botUser.id,
                        chatId: newMessage.chatId,
                    },
                });

                if (!botMember) return;

                // Call AI API (payload is plaintext for AI chats)
                const aiReply = await getAIResponse(newMessage.payload);

                const botMessage = await prisma.message.create({
                    data: {
                        chatId: newMessage.chatId,
                        senderId: botUser.id,
                        memberId: botMember.id,
                        payload: aiReply,
                    },
                });

                console.log("Bot reply saved:", botMessage);

                // Send bot reply to room and directly to sender's socket as fallback
                io.to(newMessage.chatId).emit("message", botMessage);
                socket.emit("message", botMessage);
            }
        } catch (err) {
            console.error("Error in message handler:", err);
            if (callback) callback({ success: false, error: "Internal error" });
        }
    });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
});

// Start Server
server.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // Ensure bot user exists on startup
    try {
        await ensureBotUser();
    } catch (err) {
        console.error("Failed to initialize bot user:", err);
    }
});
