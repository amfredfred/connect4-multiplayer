// GameCreationModule.ts
import { Socket, Server } from 'socket.io';
import { IModule } from './types';
import { connect4Sates } from '../states';
import { connect4Board, randomID } from '../../../utils';
import { IConnect4Game } from '../../../common/types';

export class GameCreationModule implements IModule {
    public readonly name = 'GameCreation';
    public readonly description = 'Handles game creation and player matchmaking';
    public readonly events = ['createGame', 'joinGame', 'invitePlayer', 'acceptInvitation', 'cancelGameCreation', 'cancelInvitation', 'cancelJoinRequest'];
    readonly io: Server;
    public states = connect4Sates

    constructor(io: Server) {
        this.io = io;
        this.setupEvents();
    }

    private setupEvents() {
        this.io.on('connection', (socket: Socket) => {
            socket.on('createGame', (manual: boolean = false) => this.createGame(socket, manual));
            socket.on('joinGame', (gameId: string) => this.joinGame(socket, gameId));
            socket.on('invitePlayer', (data: { gameId: string; playerId: string }) => this.invitePlayer(socket, data));
            socket.on('acceptInvitation', (gameId: string) => this.acceptInvitation(socket, gameId));
            socket.on('cancelGameCreation', () => this.cancelGameCreation(socket));
            socket.on('cancelInvitation', (gameId: string) => this.cancelInvitation(socket, gameId));
            socket.on('cancelJoinRequest', () => this.cancelJoinRequest(socket));
        });
    }


    private createGame(socket: Socket, manual: boolean) {
        const gameId = randomID();
        const game: IConnect4Game = {
            players: [socket.id],
            board: connect4Board(),
            currentPlayer: socket.id,
            gameId,
            isManual: manual
        };

        this.states.games[gameId] = game;
        this.states.gameCreationRequests[socket.id] = gameId;
        socket.join(gameId);

        if (manual) {
            socket.emit('gameCreated', { game });
        } else {
            if (this.states.waitingPlayers.length > 0) {
                const opponentId = this.states.waitingPlayers.shift()!;
                game.players.push(opponentId);
                this.io.to(opponentId).emit('gameCreated', { game });
                socket.emit('gameStarted', game);
                this.io.in(gameId).emit('gameStarted', game);
            } else {
                socket.emit('waitingForOpponent');
            }
        }
    }

    private joinGame(socket: Socket, gameId: string | null) {
        if (gameId) {
            const game = this.states.games[gameId];
            if (game && game.players.length === 1 && game.isManual) {
                game.players.push(socket.id);
                socket.join(gameId);
                this.io.in(gameId).emit('gameStarted', game);
            } else {
                socket.emit('error', 'Game not found or already full');
            }
        } else {
            const availableGame = Object.values(this.states.games).find(game =>
                !game.isManual && game.players.length === 1
            );

            if (availableGame) {
                availableGame.players.push(socket.id);
                socket.join(availableGame.gameId);
                this.io.in(availableGame.gameId).emit('gameStarted', availableGame);
            } else {
                this.states.waitingPlayers.push(socket.id);
                socket.emit('waitingToJoinGame');
            }
        }
    }

    private invitePlayer(socket: Socket, { gameId, playerId }: { gameId: string; playerId: string }) {
        const game = this.states.games[gameId];
        if (game && game.players.includes(socket.id)) {
            if (!game.invitedPlayers) {
                game.invitedPlayers = [];
            }
            game.invitedPlayers.push(playerId);
            this.io.to(playerId).emit('gameInvitation', { gameId, inviter: socket.id });
        } else {
            socket.emit('error', 'You are not in this game');
        }
    }

    private acceptInvitation(socket: Socket, gameId: string) {
        const game = this.states.games[gameId];
        if (game && game.invitedPlayers && game.invitedPlayers.includes(socket.id)) {
            game.players.push(socket.id);
            socket.join(gameId);
            game.invitedPlayers = game.invitedPlayers.filter(id => id !== socket.id);
            this.io.in(gameId).emit('gameStarted', game);
        } else {
            socket.emit('error', 'Invalid invitation');
        }
    }

    private cancelGameCreation(socket: Socket) {
        const gameId = this.states.gameCreationRequests[socket.id];
        if (gameId) {
            delete this.states.games[gameId];
            delete this.states.gameCreationRequests[socket.id];
            this.states.waitingPlayers = this.states.waitingPlayers.filter(id => id !== socket.id);
            socket.emit('gameCreationCancelled');
        } else {
            socket.emit('error', 'No game creation request found');
        }
    }

    private cancelInvitation(socket: Socket, gameId: string) {
        const game = this.states.games[gameId];
        if (game && game.invitedPlayers && game.invitedPlayers.includes(socket.id)) {
            game.invitedPlayers = game.invitedPlayers.filter(id => id !== socket.id);
            this.io.to(game.invitedPlayers).emit('invitationCancelled', { gameId });
            socket.emit('invitationCancelled', { gameId });
        } else {
            socket.emit('error', 'No invitation found or already accepted');
        }
    }

    private cancelJoinRequest(socket: Socket) {
        this.states.waitingPlayers = this.states.waitingPlayers.filter(id => id !== socket.id);
        socket.emit('joinRequestCancelled');
    }

}
