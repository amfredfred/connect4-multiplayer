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
                <Connect4Board :winningCells="winningCells" :board="session?.board"
                    :currentPlayer="session?.currentPlayer" :players="session?.players" @makeMove="makeMove" />
            </template>
        </Connect4Layout>

    </div>
</template>

<script setup lang="ts">
import Connect4Board from './Connect4Board.vue';
import Connect4Layout from './Connect4Layout.vue'
import Connect4GameStatus from './Connect4GameStatus.vue';
import { useConnet4GameSocket } from './useConnet4GameSocket';
import { ref } from 'vue';

const { session, createGame, makeMove, joinGame, isWaitingForOponent, isWaitingToJoinGame, winningCells } = useConnet4GameSocket()
const isBottomSheetOpen = ref(true)

</script>

<style scoped>
.game {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    overflow: hidden;
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
