// Connect4Module.ts
import { Server } from 'socket.io';
import { IModule } from './modules/types';
import { GameCreationModule } from './modules/GameCreationModule';
import { GamePlayModule } from './modules/GamePlayModule';
import { DisconnectModule } from './modules/DisconnectModule';

export class Connect4Module {
    private io: Server;
    private modules: IModule[] = [];

    constructor(io: Server) {
        this.io = io;
        this.initializeModules();
        this.io.on('connection', () => {
            console.log('New connection', { modulenames: this.getModuleNames() })
        })
    }

    private initializeModules() {
        const moduleClasses = [GameCreationModule, GamePlayModule, DisconnectModule];
        this.modules = moduleClasses.map(ModuleClass => {
            const module = new ModuleClass(this.io);
            console.log("Initialized Module: ", module.name)
            return module;
        });
    }

    public getModuleNames() {
        return this.modules.map(module => module.name);
    }
}