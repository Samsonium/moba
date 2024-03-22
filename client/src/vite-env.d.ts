/// <reference types="svelte" />
/// <reference types="vite/client" />

declare module 'three-pathfinding' {
    import { Object3D, type Vector3, type BufferGeometry } from 'three';

    export class Pathfinding {
        public setZoneData(zoneName: string, zoneData: any): void;
        public getGroup(zone: string, position: Vector3): any;
        public getClosestNode(position: Vector3, zone: string, group: any): {centroid: Vector3};
        public findPath(start: Vector3, end: Vector3, zone: string, group: any): Vector3[];
        public static createZone(geom: BufferGeometry): any;
    }

    export class PathfindingHelper extends Object3D {}
}

declare module 'three/examples/jsm/loaders/GLTFLoader' {
    import type { Group } from 'three';

    export interface GLTF {
        scene: Group;
    }
}

declare module 'three/examples/jsm/utils/SkeletonUtils' {
    import type { Group } from 'three';

    export function clone(object: Group): Group;
}
