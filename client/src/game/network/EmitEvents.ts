import type PlayerNetData from './player/PlayerNetData';

export default interface EmitEvents {

    /** Expose player data for connection */
    expose: (nick: string) => void;

    /** Send player state */
    playerUpdate: (data: PlayerNetData) => void;
}
