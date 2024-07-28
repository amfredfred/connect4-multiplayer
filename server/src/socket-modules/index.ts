import { Server } from "socket.io";
import { Connect4Module } from "./connect-4-module";

export const setupSockets = (io: Server) => {
    try {
        const sockets = [Connect4Module]
        console.log('Setting up sockets: ', Date.now())
        sockets.map(socket => new socket(io))
        console.log('Setting up done: ', Date.now())
    } catch (error) {
        throw new Error(`setupSockets: ${error}`)
    }
}