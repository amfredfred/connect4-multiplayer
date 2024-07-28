import { Server } from "socket.io";
import { connect4Sates } from "../../states";

// IModule.ts
export interface IModule {
    io: Server
    name: string;
    description: string;
    states: typeof connect4Sates
    events: string[];
}
