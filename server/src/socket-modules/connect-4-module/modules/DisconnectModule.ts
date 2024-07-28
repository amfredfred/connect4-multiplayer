import { Socket, Server } from 'socket.io';
import { IModule } from './types';
import { connect4Sates } from '../states';

export class DisconnectModule implements IModule {
    public readonly name = 'Disconnect';
    public readonly description = 'Handles player disconnections and cleanups';
    public readonly events = ['disconnect'];
    readonly io: Server;
    public states = connect4Sates

    constructor(io: Server) {
        this.io = io;
        this.setupEvents();
    }

    private setupEvents() {
        this.io.on('connection', (socket: Socket) => {
            socket.on('disconnect', () => this.handleDisconnect(socket));
        });
    }

    private handleDisconnect(socket: Socket) {
        for (const gameId in this.states.games) {
            const game = this.states.games[gameId];
            if (game.players.includes(socket.id)) {
                game.players = game.players.filter(player => player !== socket.id);

                if (game.players.length === 0) {
                    delete this.states.games[gameId];
                    this.io.in(gameId).emit('gameEnded', { reason: 'Player disconnected' });
                } else {
                    game.currentPlayer = game.players[0];
                    this.io.in(gameId).emit('playerDisconnected', { gameId, remainingPlayers: game.players });
                }
                break;
            }
        }

        // Remove from waiting players queue if present
        this.states.waitingPlayers = this.states.waitingPlayers.filter(id => id !== socket.id);
    }
}
