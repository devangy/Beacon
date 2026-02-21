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
app.use("/api/chats", chatRouter);
app.use("/api/friends", friendRouter);
app.use("/api/messages", messageRouter);

app.post("/api/keys/get", async (req, res) => {
    try {
        const { userId } = req.body;
        console.log("userIdofothermemenr", userId);

        const pk = await prisma.publicKey.findFirst({
            where: {
                userId: userId,
                isUsed: false,
            },
        });

        if (!pk) {
            return res.status(404).json({
                success: false,
                message: "No unused key found for this user.",
            });
        }

        // update key status to used once fetched
        const updateUsed = await prisma.publicKey.update({
            where: {
                id: pk.id,
            },
            data: {
                isUsed: true,
            },
        });

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

        console.log("ciphertext in db:", ssk.ciphertext);

        if (ssk) {
            console.log("ssk ciphertext get", ssk);
            res.status(200).json({
                success: true,
                chatId: ssk.chatId,
                receiverId: ssk.receiverId,
                ciphertext: Buffer.from(ssk.ciphertext).toString("base64"),
                message: "ciphertext already exists on server!",
            });
        } else {
            res.status(404).json({
                success: false,
                message: "Ciphertext not found on the server!",
            });
        }
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
        console.log("Received message:", newMessage);
        // callback("This is ack");

        // retrieving the member info the user is part of from userId and chatId
        const member = await prisma.member.findFirst({
            where: {
                userId: newMessage.userId,
                chatId: newMessage.chatId,
            },
        });

        console.log("memberfromuserid", member);

        const savedMessage = await prisma.message.create({
            data: {
                chatId: member.chatId,
                senderId: newMessage.userId,
                memberId: member.id,
                payload: newMessage.payload,
                // createdAt: newMessage.createdAt
            },
        });

        console.log("Saved messageDB:", savedMessage);

        // emit message to all users in the chat
        io.to(member.chatId).emit("message", savedMessage);

        // Send success response with the saved message
        callback({ success: true, message: savedMessage });
        console.log("saved message", savedMessage);
    });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
});

// Start Server
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
