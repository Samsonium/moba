import { Vector3 } from './game/Vector3';

/** Player update incoming data */
type PlayerIncomingData = {

    /** Position */
    position: Vector3;

    /** Y-coord rotation */
    rotation: number;
};

export interface ClientEvents {

    /**
     * Get state from the player's socket
     * @param player player's position and Y-rotation
     */
    playerUpdate: (player: PlayerIncomingData) => void;

    /**
     * Get player's name to add to the server
     * @param name display name
     */
    expose: (name: string) => void;
}
