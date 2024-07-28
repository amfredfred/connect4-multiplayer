<template>
    <div class="board">
        <div v-for="(row, rowIndex) in board" :key="rowIndex" class="row">
            <div v-for="(cell, colIndex) in row" :key="colIndex" class="cell" :class="{
                'player1': cell === players?.[0],
                'player2': cell === players?.[1],
                'winning-cell': isWinningCell(rowIndex, colIndex),
                'falling': animationState[rowIndex] === colIndex
            }" @click="handleCellClick(colIndex)">
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { IConnect4Game } from './useConnet4GameSocket';
import DropSound from '../../../assets/audio/drop-sound.mp3'
import ClickSound from '../../../assets/audio/click-sound.mp3'


type IWinningCells = { row: number, col: number }[];

const sounds = {
    drop: DropSound,
    click: ClickSound
}

const props = defineProps({
    board: Array,
    currentPlayer: String,
    players: Array,
    winningCells: Array
});

const emits = defineEmits(['makeMove']);

const isWinningCell = (row: number, col: number): boolean =>
    (props?.winningCells as IWinningCells)?.some(cell => cell.row === row && cell.col === col);

const animationState = ref<{ [key: number]: number }>({});

const makeMove = (column: number) => {
    emits('makeMove', column);
    const row = findRowForColumn(column);
    if (row !== -1) {
        animationState.value = { ...animationState.value, [row]: column };
    }
};

const findRowForColumn = (column: number): number => {
    const board = props.board as IConnect4Game['board'];
    for (let row = board.length - 1; row >= 0; row--) {
        if (!board[row][column]) {
            return row;
        }
    }
    return -1;
};

const handleCellClick = (column: number) => {
    // playSound('click');
    makeMove(column);
};

watch(() => props.board, () => {
    setTimeout(() => {
        playSound('click');
        animationState.value = {};
    }, 500); // Match the duration of your animation
}, { deep: true });

const playSound = (type: 'click' | 'drop') => {
    const audio = new Audio(sounds[type]);
    audio?.play?.();
};
</script>

<style scoped>
.board {
    display: grid;
    grid-template-rows: repeat(6, 1fr);
    grid-gap: 5px;
    background: rgb(1, 63, 55);
    scale: .9;
    padding: 10px;
    border-radius: 20px;
    overflow: hidden;
    isolation: isolate;
}

.row {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-gap: 5px;
}

.cell {
    width: 50px;
    height: 50px;
    background-color: #ffffff;
    cursor: pointer;
    border-radius: 50px;
    position: relative;
    transition: background-color 0.3s ease;
    /* overflow: hidden; */
    isolation: isolate;
    z-index: 1;
    border: 5px solid rgb(9, 44, 39);
}

/* Apply color for players */
.cell.player1 {
    background-color: red;
}

.cell.player2 {
    background-color: yellow;
}

.winning-cell {
    border: 5px solid green;
}

/* Animation for bouncing cells */
@keyframes bounce {
    0% {
        transform: translateY(-100vh);
    }

    50% {
        transform: translateY(30px);
        opacity: 1;
    }

    70% {
        transform: translateY(-10px);
    }

    100% {
        transform: translateY(0);
    }
}

.cell.falling {
    z-index: -1 !important;
}

.cell.falling::after {
    animation: bounce .4s ease forwards;
    width: 100%;
    height: 100%;
    background: inherit;
    content: 'O';
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: -1;
    position: absolute;
    border-radius: inherit;
    /* Apply the falling animation */
}
</style>
