<template>
    <v-container>
        <v-alert v-if="status" type="info">
            {{ status }}
        </v-alert>
        <v-alert v-if="error" type="error">
            {{ error }}
        </v-alert>
    </v-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useConnet4GameSocket } from './useConnet4GameSocket';

const { socket, game } = useConnet4GameSocket();
const status = computed(() => {
    if (game.value.currentPlayer === socket.id) {
        return 'Your turn!';
    }
    return `Waiting for ${game.value.currentPlayer.slice(0, 10)} to move...`;
});

const error = computed(() => {
    // Handle errors if needed
    return null; // Replace with actual error handling
});

</script>

<style scoped>
/* Add custom styles if needed */
</style>
