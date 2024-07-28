import { ref, onMounted, onUnmounted } from 'vue';
import io from 'socket.io-client';


export interface IConnect4Game {
    players: string[];
    board: (string | null)[][];
    currentPlayer: string;
    gameId: string,

}

export type IWinningCells = { row: number; col: number }[];

const socket = io('http://192.168.1.119:3001');
const session = ref<IConnect4Game | null>({
    board: Array(6).fill(null).map(() => Array(7).fill(null)),
    currentPlayer: '',
    players: [],
    gameId: '',
});

const isWaitingForOponent = ref(false)
const isWaitingToJoinGame = ref(false)
const winningCells = ref<IWinningCells | undefined>()

export function useConnet4GameSocket() {
    onMounted(() => {
        socket.on('gameCreated', (data) => {
            session.value = data.game;
        });

        socket.on('gameStarted', (data) => {
            session.value = data;
            isWaitingToJoinGame.value = false
            isWaitingForOponent.value = false
        });

        socket.on('waitingForOpponent', (message) => {
            console.log('waitingForOpponent')
            isWaitingForOponent.value = true
        })

        socket.on('moveMade', (game: IConnect4Game) => {
            console.log(game, 'moveMade')
            if (session.value && session.value.gameId === game.gameId) {
                session.value.board = game.board;
                session.value.currentPlayer = game.currentPlayer;
            }
        });

        socket.on('playerDisconnected', (data) => {
            // Handle player disconnection
            if (session.value && session.value.gameId === data.gameId) {
                // Handle disconnection logic here
                console.log({ data }, 'playerDisconnected')
            }
        });

        socket.on('gameEnded', (data) => {
            // Handle game end
            if (session.value && session.value.gameId === data.gameId) {
                session.value = null;
                alert('Game ended: ' + data.reason);
            }
        });

        socket.on('gameRejoined', (data) => {
            if (session.value && session.value.gameId === data.game.gameId) {
                session.value = data.game;
            }
        });

        socket.on('invitationCancelled', (data) => {
            // Handle invitation cancellation
            if (session.value && session.value.gameId === data.gameId) {
                // Handle invitation cancellation logic here
            }
        });

        socket.on('gameCreationCancelled', () => {
            // Handle game creation cancellation
            session.value = null;
            alert('Game creation was cancelled');
        });

        socket.on('joinRequestCancelled', () => {
            // Handle join request cancellation
            alert('Join request was cancelled');
        });

        socket.on('gameQuit', (data) => {
            // Handle player quitting the game
            if (session.value && session.value.gameId === data.gameId) {
                // Handle quit logic here
            }
        });

        socket.on('gameWon', (data: { winningCells: IWinningCells, game: IConnect4Game, winner: string }) => {
            // Handle game win
            if (session.value && session.value.gameId === data.game.gameId) {
                alert(`Player ${data.winner} won the game!`);
                winningCells.value = data?.winningCells
                // session.value = null;
            }
        });

        socket.on('error', (message) => {
            // Handle errors
            alert('Error: ' + message);
        });
    });

    const createGame = () => {
        isWaitingForOponent.value = true
        socket!.emit('createGame');
    }

    const joinGame = (gameId: string) => {
        isWaitingToJoinGame.value = true
        socket!.emit('joinGame'); //, gameId
    }

    const makeMove = (column: number) => {
        console.log({ column })
        socket!.emit('makeMove', { gameId: session.value?.gameId, column });
    }

    onUnmounted(() => {
        socket.disconnect();
    });

    return {
        socket,
        session,
        createGame,
        joinGame,
        makeMove,
        isWaitingForOponent,
        isWaitingToJoinGame,
        winningCells
    };
}
