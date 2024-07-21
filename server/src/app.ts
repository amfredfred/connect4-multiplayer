import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { connect4Board, randomID } from './utils';
import { GameConnect4Manager } from './sockets/connect4';

// Initialize Express and HTTP server
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "HEAD"]
    }
});

app.use(cors());

// Serve a basic response
app.get('/', (req, res) => {
    res.send('Connect 4 Multiplayer Server');
});


new GameConnect4Manager(io);


// Export the server instance
export { server };