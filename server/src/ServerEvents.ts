import { Vector3 } from './game/Vector3';

export interface ServerEvents {
    gameState: (players: {
        id: string;
        nick: string;
        hp: number;
        mp: number;
        position: Vector3;
        rotation: Vector3;
    }[]) => void
}
