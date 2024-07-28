import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { setupSockets } from './socket-modules';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "HEAD"]
    }
});

app.use(cors());

app.get('/', (req, res) => {
    res.send('Connect 4 Multiplayer Server');
});

setupSockets(io)

// Export the server instance
export { server };