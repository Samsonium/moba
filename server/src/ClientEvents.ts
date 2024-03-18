import { Vector3 } from './game/Vector3';

export interface ClientEvents {
    playerUpdate: (player: {
        position: Vector3;
        rotation: Vector3;
    }) => void;

    expose: (name: string) => void;
}
