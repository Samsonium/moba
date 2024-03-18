import { type NavMesh, NavMeshQuery } from 'recast-navigation';
import { threeToSoloNavMesh } from '@recast-navigation/three'
import {
    AmbientLight,
    BoxGeometry,
    CubeTextureLoader,
    DirectionalLight,
    Group,
    Mesh,
    MeshLambertMaterial, Object3D,
    PerspectiveCamera,
    Raycaster,
    Scene,
    Vector2,
    Vector3,
    WebGLRenderer
} from 'three';
import { Tween } from '@tweenjs/tween.js';
// @ts-ignore
import { type GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import type PlayerNetData from '../network/player/PlayerNetData';

export default class Graphics {
    private readonly renderer: WebGLRenderer;
    private readonly camera: PerspectiveCamera;
    private readonly scene: Scene;
    private readonly raycaster: Raycaster;

    private navmesh: NavMesh | undefined;
    private pathfinder: NavMeshQuery | undefined;
    private movementInterval: any;

    /** Players added to the scene */
    private readonly players: {
        object: Group,
        data: PlayerNetData
    }[];

    /** Local player data */
    private readonly player: {
        object: Group,
        data: Omit<PlayerNetData, 'id'>
    };

    /** Render loop state */
    private renderStarted: boolean;

    public constructor(canvas: HTMLCanvasElement) {
        this.renderer = new WebGLRenderer({
            canvas,
            alpha: false,
            antialias: true
        });
        this.renderer.setSize(innerWidth, innerHeight);
        this.renderer.shadowMap.enabled = true;
        window.addEventListener('resize', this.handleResize.bind(this));

        this.camera = new PerspectiveCamera(45, innerWidth / innerHeight);

        this.scene = new Scene();
        this.raycaster = new Raycaster();

        this.players = [];
        this.player = this.createLocalPlayer(0, 0, 0);
        this.camera.position.set(10, 15, 10);
        this.camera.lookAt(0, 0, 0);

        this.renderStarted = false;
    }

    /** Setup scene with map and objects */
    public setupScene() {
        this.scene.background = new CubeTextureLoader()
            .setPath('/cubemap/')
            .load([
                'px.png', 'nx.png',
                'py.png', 'ny.png',
                'pz.png', 'nz.png'
            ]);

        const loader = new GLTFLoader();
        loader.load('/objects/map.glb', (gltf: GLTF) => {
            const root = gltf.scene;
            console.log(root.children);
            for (const ch of root.children) {
                ch.castShadow = true;
                ch.receiveShadow = true;
            }

            const meshes: Mesh[] = [];
            root.traverse((child: any) => {
                if (child instanceof Mesh && !['Cube', 'Cube.001', 'Cube.002', 'Cube.003'].includes(child.userData.name))
                    meshes.push(child);
            })

            const { navMesh, success } = threeToSoloNavMesh(
                meshes,
                {
                    cs: 0.2,
                    ch: 0.2,
                    walkableSlopeAngle: 30,
                    walkableHeight: 1,
                    walkableClimb: 4,
                    walkableRadius: 1,
                    maxEdgeLen: 6,
                    maxSimplificationError: 1.3,
                    minRegionArea: 4,
                    mergeRegionArea: 20,
                    maxVertsPerPoly: 6,
                    detailSampleDist: 8,
                    detailSampleMaxError: 1,
                }
            );
            this.navmesh = navMesh;
            this.pathfinder = new NavMeshQuery({ navMesh: this.navmesh! });

            this.scene.add(root);
        })

        const ambLight = new AmbientLight(0xFFFFFF, 2);

        const dirLight = new DirectionalLight(0xFFFFFF, 5);
        dirLight.position.set(-1, 3, 1);
        dirLight.lookAt(0, 0, 0);
        dirLight.castShadow = true;
        dirLight.shadow.autoUpdate = false;

        this.scene.add(ambLight);
        this.scene.add(dirLight);
    }

    /** Cleanup events */
    public destroy() {
        window.removeEventListener('resize', this.handleResize.bind(this));
    }

    /** Start animation */
    public begin() {
        if (this.renderStarted) return;
        this.renderStarted = true;
        this.renderStep();
    }

    /** Move character to specified position */
    public moveTo(position: Vector2) {
        clearInterval(this.movementInterval);
        this.raycaster.setFromCamera(position, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children,
            true);

        if (!intersects.length) return
        const current = this.player.object.position;
        const target = intersects[0].point;
        target.y += .2;

        const path = this.pathfinder!.computePath(current, target);
        console.log(path);

        let playerPosClone = this.player.object.position.clone();
        let parentTween: Tween<Vector3> | null = null;
        for (let i = 0; i < path.length; i++) {
            const pos = path[i];
            const prev = i > 0
                ? new Vector3(path[i - 1].x, path[i - 1].y, path[i - 1].z)
                : current;

            const dist = prev.distanceTo(pos);
            const duration = dist * 100;

            if (!parentTween) {
                parentTween = new Tween(playerPosClone)
                    .to(pos, duration);
            } else {
                parentTween.to(pos, duration);
            }
        }
        parentTween?.start();

        if (!parentTween) return;
        this.movementInterval = setInterval(() => {
            if (!parentTween!.update())
                clearInterval(this.movementInterval);

            this.player.object.position.copy(playerPosClone);
            // const posFrom = playerPosClone.clone().add(new Vector3(0, -5, 0));
            // this.raycaster.set(posFrom, new Vector3(0, 1, 0));
            // const floor = this.raycaster.intersectObject(this.navmeshObject!,
            //     true);
            //
            // if (floor.length) {
            //     const point = floor[0].point;
            //     console.log(`[${playerPosClone.toArray()}] -> [${point.toArray()}]`)
            //     this.player.object.position.copy(point);
            // }

            const {x,y,z} = this.player.object.position;
            this.camera.position.set(x + 10, y + 15, z + 10);
        }, 10);
    }

    /**
     * Add local player to scene
     * @param x X-coord
     * @param y Y-coord
     * @param z Z-coord
     */
    private createLocalPlayer(x: number, y: number, z: number) {
        const group = new Group();
        const character = new Mesh(
            new BoxGeometry(.5, 1, .35),
            new MeshLambertMaterial({color: 0x6DFF6D})
        );
        character.castShadow = true;
        character.receiveShadow = true;
        character.position.y = .2;
        group.add(character);

        group.position.set(x, y, z);
        this.scene.add(group);
        return {
            data: {
                nick: 'Player',
                hp: 100,
                mp: 100,
                position: group.position,
                rotation: group.rotation.y
            },
            object: group
        };
    }

    /** Handle window resize */
    private handleResize() {
        this.renderer.setSize(innerWidth, innerHeight);
        this.camera.updateProjectionMatrix();
        this.camera.aspect = innerWidth / innerHeight;
    }

    /** Render loop step */
    private renderStep() {
        if (!this.renderStarted) return;

        for (const player of this.players) {
            //
        }

        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.renderStep.bind(this));
    }
}
