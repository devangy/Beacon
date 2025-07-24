import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import authRouter from './routes/auth.route.js';
import chatRouter from './routes/chat.route.js';
import friendRouter from './routes/friends.route.js';
import messageRouter from "./routes/message.route.js";


const app = express(); 
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


//  check if folder or create
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// morgan logging to file
const logStream = fs.createWriteStream(
  path.join(__dirname, 'logs', 'access.log'), { flags: 'a' }
);

app.use(morgan('combined', { stream: logStream })); // File logs
// app.use(morgan('dev'));  // dev logging in console

// middlewares
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Test Route
app.use('/test', (req, res) => {
  res.json({ message: 'Test route working!' });
});

app.use("/api/auth", authRouter);
app.use("/api/chats", chatRouter);
app.use("/api/friends", friendRouter);
app.use("/api/messages", messageRouter);

io.on('connection', (socket) => {
  console.log('a user connected', socket.id);

  socket.on('message', (msg) => {
    console.log('Received message:', msg);
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Start Server
server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});
