import express from 'express'
import { createServer } from 'node:http';
import { Server } from 'socket.io'
import cors from 'cors';



import authRouter from './routes/auth.route.js'


const app = express();
const server = createServer(app);


const io = new Server(server,{
    cors: {
      origin: "*",
    }
  });


app.use(cors({
  origin: '*' 
}));

app.use(express.json());
app.use(express.urlencoded({extended: true}));


app.use('/test', (req, res) => {
  res.json({
    message: 'Test route working!',
  });
});


app.use("/api/auth", authRouter);

  

io.on('connection', (socket) => {
  console.log('a user connected', socket.id);

    socket.on('message', (msg) => {
      console.log('Received message:', msg);
    })
});


app.use("/auth", authRouter);


//error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
})


server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});