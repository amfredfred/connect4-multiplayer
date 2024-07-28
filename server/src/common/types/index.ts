export type IWinningCells = { row: number; col: number }[];

export interface IConnect4Game {
    players: string[];
    board: (string | null)[][];
    currentPlayer: string;
    gameId: string;
    isManual: boolean;
    invitedPlayers?: string[];
}