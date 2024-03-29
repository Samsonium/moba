import { assetsStore } from '../assets/assets.store';
import { Easing, Tween } from '@tweenjs/tween.js';
import { Pathfinding, PathfindingHelper } from 'three-pathfinding';
import {Euler, Vector2, Vector3, type Mesh, type Object3D} from 'three';
import Character from './Character';
import type Graphics from './index';
import type PlayerNetData from '../network/player/PlayerNetData';

/** Local character class */
export default class LocalCharacter extends Character {

    /** Pathfinding zone name */
    private readonly pfZone = 'LOCAL_LOBBY';

    /** Network socket player data */
    private readonly netData: PlayerNetData;

    /** Pathfinding class */
    private readonly pf: Pathfinding;

    /** Helper for pathfinding debug */
    private readonly pfHelper: PathfindingHelper;

    /** Navmesh for pathfinding */
    private navmesh: Mesh | undefined;

    /** Actual array of pathfinding points */
    private navpath: Vector3[] | undefined;

    /** Pathfinding group ID */
    private groupID: any;

    /** Tween for rotation */
    private tweenRotation: Tween<Euler> | undefined;

    public constructor(g: Graphics, initial: Vector3) {
        super(g, initial, 'local');
        this.pf = new Pathfinding();

        this.object.name = 'local_character';

        // For debugging purposes in future
        this.pfHelper = new PathfindingHelper();
        this.g.currentScene.add(this.pfHelper);
        this.g.updateShadowCaster(initial);

        // Load navmesh
        const navmesh = assetsStore.getAsset('lobbyNavmesh');
        if (!navmesh) throw new Error('No navmesh found');
        navmesh.scene.traverse((node: Object3D) => {
            if (!this.navmesh && node.isObject3D && node.children?.length) {
                this.navmesh = node.children[0] as Mesh;
                this.pf.setZoneData(this.pfZone, Pathfinding.createZone(this.navmesh.geometry));
            }
        });

        // Init network data
        this.netData = {
            id: '',
            nick: 'Player',
            hp: 100,
            mp: 100,
            position: initial,
            rotation: this.object.rotation.y
        };

        // Setup events
        window.addEventListener('click', this.handleLeftClick.bind(this));
        window.addEventListener('contextmenu', this.handleRightClick.bind(this));
    }

    /** Cleanup LocalCharacter class */
    public destroy() {
        window.removeEventListener('click', this.handleLeftClick.bind(this));
        window.removeEventListener('contextmenu', this.handleRightClick.bind(this));
        super.destroy();
    }

    /**
     * Calculate navpath to target
     * @param target click position
     */
    public calculatePath(target: Vector2): void {
        const point = this.g.rayCast(target)?.point;
        if (!point) return;

        // Retrieve group id
        this.groupID = this.pf.getGroup(this.pfZone, this.position);

        // Generate navpath
        const closest = this.pf.getClosestNode(this.position, this.pfZone, this.groupID);
        this.navpath = this.pf.findPath(closest.centroid, point, this.pfZone, this.groupID);

        if (this.navpath?.length)
            this.rotateByPath(this.navpath[0]);

        if (import.meta.env.DEV) {
            if (!this.navpath) {
                console.warn('No path found');
                return;
            }

            this.pfHelper.reset();
            this.pfHelper.setPlayerPosition(closest.centroid);
            this.pfHelper.setTargetPosition(point);
            this.pfHelper.setPath(this.navpath);
        }
    }

    /**
     * Update player state
     * @param delta Clock delta
     */
    public update(delta: number): void {
        super.update(delta);

        this.g.updateShadowCaster(this.position);
        this.tweenRotation?.update();
        this.netData.position = this.position;
        this.netData.rotation = this.rotation.y;

        if (!this.navpath?.length) {
            if (this.charAction !== this.charActions.aIdle)
                this.fadeAnimation('aRun', 'aIdle');

            return;
        }

        const target = this.navpath[0];
        const distance = target.clone().sub(this.position);

        if (distance.lengthSq() < .5 * .05) {
            this.navpath.shift();

            if (this.navpath?.length)
                this.rotateByPath(this.navpath[0]);

            return;
        }

        distance.normalize();
        this.position.add(distance.multiplyScalar(delta * 5));

        if (this.charAction !== this.charActions.aRun)
            this.fadeAnimation('aIdle', 'aRun');
    }

    /** Get player's network data */
    public get net() {
        return this.netData;
    }

    /** Set health points */
    public set hp(value: number) {
        this.netData.hp = value;
    }

    /** Set mana points */
    public set mp(value: number) {
        this.netData.mp = value;
    }

    public set id(value: string) {
        this.netData.id = value;
    }

    /**
     * Rotate character towards target
     * @param target target position
     */
    private rotateByPath(target: Vector3) {
        const direction = target.clone().sub(this.position);

        this.tweenRotation?.stop();

        const targetRotation = Math.atan2(direction.x, direction.z);
        const currentRotation = this.object.rotation.y;

        // Calculate the shortest angular distance to rotate

        let shortestAngle = ((targetRotation - currentRotation + Math.PI) % (Math.PI * 2)) - Math.PI;

        // Ensure shortestAngle is within the range of -PI to PI
        if (shortestAngle <= -Math.PI) {
            shortestAngle += Math.PI * 2;
        } else if (shortestAngle > Math.PI) {
            shortestAngle -= Math.PI * 2;
        }

        this.tweenRotation = new Tween(this.object.rotation).to({
            y: (this.object.rotation.y + shortestAngle) % (Math.PI * 2)
        }, 300);
        this.tweenRotation.easing(Easing.Quintic.Out).start();
    }

    /** Handle left mouse click */
    private handleLeftClick(e: MouseEvent): void {
        if (e.button !== 0) return;
        e.preventDefault();
    }

    /** Hande right mouse click */
    private handleRightClick(e: MouseEvent): void {
        if (e.button !== 2) return;
        e.preventDefault();
        this.calculatePath(new Vector2(
            (e.clientX / innerWidth) * 2 - 1,
            -(e.clientY / innerHeight) * 2 + 1,
        ));
    }
}
