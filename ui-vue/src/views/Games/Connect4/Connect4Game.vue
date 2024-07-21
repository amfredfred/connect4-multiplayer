<template>
    <div class="game">
        <Connect4Layout>
            <template #content>
                <Connect4GameStatus />
                <v-bottom-sheet v-model="isBottomSheetOpen">
                    <div class="new-player-menu">
                        <v-progress-circular indeterminate v-if="isWaitingForOponent" />
                        <v-progress-circular indeterminate color="red" v-if="isWaitingToJoinGame" />
                        <v-btn @click="createGame">create Game</v-btn>
                        <v-btn @click="joinGame">join Game</v-btn>
                    </div>
                </v-bottom-sheet>

                <Connect4Board :board="session.board" :currentPlayer="session.currentPlayer" :players="session.players"
                    @makeMove="makeMove" />


            </template>
        </Connect4Layout>

    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Connect4Board from './Connect4Board.vue';
import Connect4Layout from './Connect4Layout.vue'
import Connect4GameStatus from './Connect4GameStatus.vue';
import { useConnet4GameSocket } from './useConnet4GameSocket';

interface IGame {
    players: string[];
    board: (string | null)[][];
    currentPlayer: string;
    gameId: string
}

const session = ref<IGame>({
    board: [['', '',]],
    currentPlayer: '',
    players: [],
    gameId: '',
})

const { socket } = useConnet4GameSocket()
const isBottomSheetOpen = ref(true)
const isWaitingForOponent = ref(false)
const isWaitingToJoinGame = ref(false)


onMounted(() => {

    socket.on('gameCreated', ({ game }: { game: IGame }) => {
        console.log({ game })
        session.value = game
    });

    socket.on('gameStarted', (game: IGame) => {
        isWaitingToJoinGame.value = false
        isWaitingForOponent.value = false
        session.value = game
    });

    socket.on('moveMade', ({ board, currentPlayer }: { board: string[][], currentPlayer: string }) => {
        console.log({ board, currentPlayer })
        session.value.board = board;
        session.value.currentPlayer = currentPlayer;
    });

    socket.on('waitingForOpponent', (message) => {
        console.log('waitingForOpponent')
        isWaitingForOponent.value = true
    })

    socket.on('error', (error) => {
        console.log('error: ', error)
    })

    socket.on('waitingToJoinGame', (message) => {
        isWaitingToJoinGame.value = true
        console.log("waitingToJoinGame: ", message)
    })

    socket.on('gameEnded', () => {
        alert('Game ended');
    });

})

const createGame = () => {
    socket!.emit('createGame');
}

const joinGame = (gameId: string) => {
    socket!.emit('joinGame'); //, gameId
}

const makeMove = (column: number) => {
    console.log({ column })
    socket!.emit('makeMove', { gameId: session.value.gameId, column });
}

</script>

<style scoped>
.game {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
}

.new-player-menu {
    width: 100%;
    padding: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 1rem;
}
</style>
