import { Server, Socket } from 'socket.io';
import { connect4Board, randomID } from '../../utils';
import { IConnect4Game } from '../../common/types'

class Connect4Module {
    private games: { [key: string]: IConnect4Game } = {};
    private waitingPlayers: string[] = [];
    private gameCreationRequests: { [key: string]: string } = {}; // { playerId: gameId }
    private io: Server;

    constructor(io: Server) {
        this.io = io;
        this.setupSocket();
    }

    private setupSocket() {
        this.io.on('connection', (socket: Socket) => {
            console.log('New client connected', socket.id);

            // Handle player rejoining
            socket.on('rejoinGame', (gameId: string) => {
                console.log(`Rejoin game request from ${socket.id}, gameId: ${gameId}`);
                this.rejoinGame(socket, gameId);
            });


            // Create a new game
            socket.on('createGame', (manual: boolean = false) => {
                console.log(`Create game request from ${socket.id}, manual: ${manual}`);
                this.createGame(socket, manual);
            });

            // Join an existing game
            socket.on('joinGame', (gameId: string) => {
                console.log(`Join game request from ${socket.id}, gameId: ${gameId}`);
                this.joinGame(socket, gameId);
            });

            // Handle game invitations (manual pairing)
            socket.on('invitePlayer', (data: { gameId: string; playerId: string }) => {
                console.log(`Invitation from ${socket.id} to ${data.playerId}, gameId: ${data.gameId}`);
                this.invitePlayer(socket, data);
            });

            // Handle game invitation acceptance (manual pairing)
            socket.on('acceptInvitation', (gameId: string) => {
                console.log(`Accept invitation from ${socket.id}, gameId: ${gameId}`);
                this.acceptInvitation(socket, gameId);
            });

            // Handle game cancellation
            socket.on('cancelGameCreation', () => {
                console.log(`Cancel game creation request from ${socket.id}`);
                this.cancelGameCreation(socket);
            });

            socket.on('cancelInvitation', (gameId: string) => {
                console.log(`Cancel invitation request from ${socket.id}, gameId: ${gameId}`);
                this.cancelInvitation(socket, gameId);
            });

            socket.on('cancelJoinRequest', () => {
                console.log(`Cancel join request from ${socket.id}`);
                this.cancelJoinRequest(socket);
            });

            // Handle player quitting a game
            socket.on('quitGame', () => {
                console.log(`Quit game request from ${socket.id}`);
                this.quitGame(socket);
            });

            // Handle a move by a player
            socket.on('makeMove', (data: { gameId: string; column: number }) => {
                console.log(`Move by ${socket.id}, gameId: ${data.gameId}, column: ${data.column}`);
                this.makeMove(socket, data);
            });

            // Handle disconnection
            socket.on('disconnect', () => {
                console.log('Client disconnected', socket.id);
                this.handleDisconnect(socket);
            });
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

        this.games[gameId] = game;
        this.gameCreationRequests[socket.id] = gameId; // Track game creation request
        socket.join(gameId);

        if (manual) {
            socket.emit('gameCreated', { game });
        } else {
            if (this.waitingPlayers.length > 0) {
                const opponentId = this.waitingPlayers.shift()!;
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
            const game = this.games[gameId];
            if (game && game.players.length === 1 && game.isManual) {
                game.players.push(socket.id);
                socket.join(gameId);
                this.io.in(gameId).emit('gameStarted', game);
            } else {
                socket.emit('error', 'Game not found or already full');
            }
        } else {
            const availableGame = Object.values(this.games).find(game =>
                !game.isManual && game.players.length === 1
            );

            if (availableGame) {
                availableGame.players.push(socket.id);
                socket.join(availableGame.gameId);
                this.io.in(availableGame.gameId).emit('gameStarted', availableGame);
            } else {
                this.waitingPlayers.push(socket.id);
                socket.emit('waitingToJoinGame');
            }
        }
    }

    private invitePlayer(socket: Socket, { gameId, playerId }: { gameId: string; playerId: string }) {
        const game = this.games[gameId];
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
        const game = this.games[gameId];
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
        const gameId = this.gameCreationRequests[socket.id];
        if (gameId) {
            delete this.games[gameId];
            delete this.gameCreationRequests[socket.id];
            this.waitingPlayers = this.waitingPlayers.filter(id => id !== socket.id);
            socket.emit('gameCreationCancelled');
        } else {
            socket.emit('error', 'No game creation request found');
        }
    }

    private cancelInvitation(socket: Socket, gameId: string) {
        const game = this.games[gameId];
        if (game && game.invitedPlayers && game.invitedPlayers.includes(socket.id)) {
            game.invitedPlayers = game.invitedPlayers.filter(id => id !== socket.id);
            this.io.to(game.invitedPlayers).emit('invitationCancelled', { gameId });
            socket.emit('invitationCancelled', { gameId });
        } else {
            socket.emit('error', 'No invitation found or already accepted');
        }
    }

    private cancelJoinRequest(socket: Socket) {
        this.waitingPlayers = this.waitingPlayers.filter(id => id !== socket.id);
        socket.emit('joinRequestCancelled');
    }

    private quitGame(socket: Socket) {
        for (const gameId in this.games) {
            const game = this.games[gameId];
            if (game.players.includes(socket.id)) {
                game.players = game.players.filter(player => player !== socket.id);

                if (game.players.length === 0) {
                    delete this.games[gameId];
                    this.io.in(gameId).emit('gameEnded', { reason: 'Player quit' });
                } else {
                    game.currentPlayer = game.players[0]; // Reset current player if needed
                    this.io.in(gameId).emit('playerQuit', { game, playerId: socket.id });
                }
                break;
            }
        }

        // Remove from waiting players queue if present
        this.waitingPlayers = this.waitingPlayers.filter(id => id !== socket.id);
        socket.emit('gameQuit');
    }

    private rejoinGame(socket: Socket, gameId: string) {
        const game = this.games[gameId];
        if (game) {
            if (!game.players.includes(socket.id)) {
                game.players.push(socket.id);
            }
            socket.join(gameId);
            this.io.in(gameId).emit('gameRejoined', { game, playerId: socket.id });
            socket.emit('gameRejoined', { game });
        } else {
            socket.emit('error', 'Game not found');
        }
    }

    private makeMove(socket: Socket, { gameId, column }: { gameId: string; column: number }) {
        const game = this.games[gameId];
        if (game && game.players.includes(socket.id) && game.currentPlayer === socket.id) {
            const board = game.board;
            const row = this.getAvailableRow(board, column);
            if (row !== -1) {
                board[row][column] = socket.id;
                game.currentPlayer = game.players.find(p => p !== socket.id) || '';
                this.io.in(gameId).emit('moveMade', game);

                // Check for a win
                const winningCells = this.checkWin(board, row, column, socket.id);
                if (winningCells) {
                    this.io.in(gameId).emit('gameWon', { winner: socket.id, winningCells, game });
                }
            } else {
                socket.emit('error', 'Column is full');
            }
        } else {
            socket.emit('error', 'Invalid move or not your turn');
        }
    }

    private getAvailableRow(board: IConnect4Game['board'], column: number): number {
        for (let row = board.length - 1; row >= 0; row--) {
            if (!board[row][column]) {
                return row;
            }
        }
        return -1;
    }

    private checkWin(board: (string | null)[][], row: number, column: number, playerId: string): { row: number, col: number }[] | null {
        const directions = [
            { row: 0, col: 1 },  // Horizontal
            { row: 1, col: 0 },  // Vertical
            { row: 1, col: 1 },  // Diagonal down-right
            { row: 1, col: -1 }  // Diagonal down-left
        ];

        for (const { row: dRow, col: dCol } of directions) {
            const line = [{ row, col: column }];
            for (let i = 1; i < 4; i++) {
                const r = row + dRow * i;
                const c = column + dCol * i;
                if (r >= 0 && r < board.length && c >= 0 && c < board[0].length && board[r][c] === playerId) {
                    line.push({ row: r, col: c });
                } else {
                    break;
                }
            }
            for (let i = 1; i < 4; i++) {
                const r = row - dRow * i;
                const c = column - dCol * i;
                if (r >= 0 && r < board.length && c >= 0 && c < board[0].length && board[r][c] === playerId) {
                    line.push({ row: r, col: c });
                } else {
                    break;
                }
            }
            if (line.length >= 4) {
                return line;
            }
        }
        return null;
    }

    private handleDisconnect(socket: Socket) {
        for (const gameId in this.games) {
            const game = this.games[gameId];
            if (game.players.includes(socket.id)) {
                game.players = game.players.filter(player => player !== socket.id);

                if (game.players.length === 0) {
                    delete this.games[gameId];
                    this.io.in(gameId).emit('gameEnded', { reason: 'Player disconnected' });
                } else {
                    game.currentPlayer = game.players[0]; // Reset current player if needed
                    this.io.in(gameId).emit('playerDisconnected', { gameId, remainingPlayers: game.players });
                }
                break;
            }
        }

        // Remove from waiting players queue if present
        this.waitingPlayers = this.waitingPlayers.filter(id => id !== socket.id);
    }
}

export { Connect4Module };