import { Vector3 } from './game/Vector3';
import { SocketData } from './SocketData';

export interface ServerEvents {

    /**
     * Send assigned ID to player
     * @param id assigned ID
     */
    exposeEnd: (id: string) => void;

    /**
     * Push game state to sockets
     * @param players array of players data
     */
    gameState: (players: SocketData[]) => void;
}
