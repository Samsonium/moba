import { Vector3 } from './game/Vector3';
import { SocketData } from './SocketData';

export interface ServerEvents {
    gameState: (players: {
        id: string;
        nick: string;
        hp: number;
        mp: number;
        position: Vector3;
        rotation: Vector3;
    }[]) => void

    /**
     * Push game state to sockets
     * @param players array of players data
     */
    gameState: (players: SocketData[]) => void;
}
