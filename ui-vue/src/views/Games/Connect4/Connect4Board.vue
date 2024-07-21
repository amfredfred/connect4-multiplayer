<template>
    <div class="board">
        <div v-for="(row, rowIndex) in board" :key="rowIndex" class="row">
            <div v-for="(cell, colIndex) in row" :key="colIndex" class="cell"
                :class="{ 'player1': cell === players?.[0], 'player2': cell === players?.[1] }"
                @click="makeMove(colIndex)">
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { watchEffect } from 'vue';

const props = defineProps({
    board: Array,
    currentPlayer: String,
    players: Array
})

const emits = defineEmits(['makeMove'])
const makeMove = (column: number) => emits('makeMove', column);

watchEffect(() => {
    console.log(props.board, 'HA<ES')
})

</script>

<style scoped>
.board {
    display: grid;
    grid-template-rows: repeat(6, 1fr);
    grid-gap: 5px;
    background: black;
    scale: .9;
    padding: 10px;
    border-radius: 20px;
}

.row {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-gap: 5px;
}

.cell {
    width: 50px;
    height: 50px;
    background-color: #ddd;
    cursor: pointer;
    border-radius: 50px;
}

.cell.player1 {
    background-color: red;
}

.cell.player2 {
    background-color: yellow;
}
</style>
