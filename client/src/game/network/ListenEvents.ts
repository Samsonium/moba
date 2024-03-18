import type MessageNetData from './message/MessageNetData';
import type PlayerNetData from './player/PlayerNetData';

/** Listening events from socket */
export default interface ListenEvents {

    /** Game state update */
    gameState: (players: PlayerNetData[]) => void;

    /** Incoming message */
    message: (data: MessageNetData) => void;
}
