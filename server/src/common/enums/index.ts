namespace C4Game {
    export namespace Recv {
        export const CreateGame = 'createGame';
        export const JoinGame = 'joinGame';
        export const RejoinGame = 'rejoinGame';
        export const InvitePlayer = 'invitePlayer';
        export const AcceptInvite = 'acceptInvite';
        export const CancelGame = 'cancelGame';
        export const QuitGame = 'quitGame';
        export const MakeMove = 'makeMove';
        export const Disconnect = 'disconnect';
    }

    export namespace Emit {
        export const GameCreated = 'gameCreated';
        export const GameStarted = 'gameStarted';
        export const MoveMade = 'moveMade';
        export const GameWon = 'gameWon';
        export const PlayerDisconnected = 'playerDisconnected';
        export const Error = 'error';
        export const GameRejoined = 'gameRejoined';
    }
}
