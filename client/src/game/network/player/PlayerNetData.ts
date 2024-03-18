import type { NetVector3 } from './NetVector3';

/** Socket player data */
export default interface PlayerNetData {

    /** Player ID */
    id: string;

    /** Player name */
    nick: string;

    /** Health */
    hp: number;

    /** Mana */
    mp: number;

    /** Player's position */
    position: NetVector3;

    /** Y-coord rotation */
    rotation: number;
}
