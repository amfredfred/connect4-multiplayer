// gameState.ts
import { IConnect4Game } from '../../../common/types';

export const connect4Sates = {
    games: {} as { [key: string]: IConnect4Game },
    waitingPlayers: [] as string[],
    gameCreationRequests: {} as { [key: string]: string }
};
