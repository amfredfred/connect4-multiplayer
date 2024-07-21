export const randomID = (): string => {
    return Math.random().toString(36).substr(2, 9);
};

export const connect4Board = () => Array(6).fill(null).map(() => Array(7).fill(null))