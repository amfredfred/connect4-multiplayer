<template>
    <div class="connect4-layout">
        <div class="connect4-inner-layout">
            <slot name="content"></slot>
        </div>
    </div>
</template>


<script setup lang="ts"></script>

<style scoped>
.connect4-layout {
    background: red;
    height: 100vh;
    width: 100vw;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

.connect4-inner-layout {
    margin: auto;
}
</style>