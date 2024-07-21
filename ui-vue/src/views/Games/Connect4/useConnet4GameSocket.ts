import { ref, onMounted, onUnmounted } from 'vue';
import io from 'socket.io-client';


interface IGame {
    players: string[];
    board: (string | null)[][];
    currentPlayer: string;
    gameId: string
}

const socket = io('http://192.168.1.119:3000');
const game = ref<IGame>({
    board: [['', '',]],
    currentPlayer: '',
    players: [],
    gameId: '',
});

export function useConnet4GameSocket() {
    onMounted(() => {
        socket.on('gameCreated', (data) => {
            game.value = data.game;
        });

        socket.on('gameStarted', (data) => {
            game.value = data;
        });

        socket.on('moveMade', (data) => {
            if (game.value && game.value.gameId === data.gameId) {
                game.value.board = data.board;
                game.value.currentPlayer = data.currentPlayer;
            }
        });

        socket.on('playerDisconnected', (data) => {
            // Handle player disconnection
        });

        socket.on('gameEnded', () => {
            // Handle game end
        });

        socket.on('error', (message) => {
            // Handle errors
        });
    });

    onUnmounted(() => {
        socket.disconnect();
    });

    return { socket, game };
}
