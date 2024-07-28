import { Socket, Server } from 'socket.io';
import { IModule } from './types';
import { connect4Sates } from '../states';
import { IConnect4Game } from '@src/common/types';

export class GamePlayModule implements IModule {
    public readonly name = 'GamePlay';
    public readonly description = 'Handles gameplay logic and moves';
    public readonly events = ['makeMove', 'quitGame', 'rejoinGame'];
    readonly io: Server;
    public states = connect4Sates


    constructor(io: Server) {
        this.io = io;
        this.setupEvents();
    }

    private setupEvents() {
        this.io.on('connection', (socket: Socket) => {
            socket.on('makeMove', (data: { gameId: string; column: number }) => this.makeMove(socket, data));
            socket.on('quitGame', () => this.quitGame(socket));
            socket.on('rejoinGame', (gameId: string) => this.rejoinGame(socket, gameId));
        });
    }

    private quitGame(socket: Socket) {
        for (const gameId in this.states.games) {
            const game = this.states.games[gameId];
            if (game.players.includes(socket.id)) {
                game.players = game.players.filter(player => player !== socket.id);

                if (game.players.length === 0) {
                    delete this.states.games[gameId];
                    this.io.in(gameId).emit('gameEnded', { reason: 'Player quit' });
                } else {
                    game.currentPlayer = game.players[0]; // Reset current player if needed
                    this.io.in(gameId).emit('playerQuit', { game, playerId: socket.id });
                }
                break;
            }
        }

        // Remove from waiting players queue if present
        this.states.waitingPlayers = this.states.waitingPlayers.filter(id => id !== socket.id);
        socket.emit('gameQuit');
    }

    private rejoinGame(socket: Socket, gameId: string) {
        const game = this.states.games[gameId];
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
        const game = this.states.games[gameId];
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
}
