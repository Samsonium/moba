import { Vector3 } from './game/Vector3';

export interface SocketData {

    /** Player identifier */
    id: string;

    /** Display name */
    nick: string;

    /** Health points */
    hp: number;

    /** Mana points */
    mp: number;

    /** Player's position */
    position: Vector3;

    /** Player's Y-coord rotation */
    rotation: number;
}
