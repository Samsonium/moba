import { type NavMesh, NavMeshQuery } from 'recast-navigation';
import { threeToSoloNavMesh } from '@recast-navigation/three'
import {
    AmbientLight,
    BoxGeometry,
    CubeTextureLoader,
    DirectionalLight,
    Group,
    Mesh,
    MeshLambertMaterial,
    PerspectiveCamera,
    Raycaster,
    Scene,
    Vector2,
    Vector3,
    WebGLRenderer
} from 'three';
// @ts-ignore
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
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
        this.camera.position.set(4, 4, 4);
        this.camera.lookAt(0, 0, 0);

        this.scene = new Scene();

        this.players = [];
        this.player = this.createLocalPlayer(0, .5, 0);

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
        loader.load('/objects/map.glb', (gltf: any) => {
            const root = gltf.scene;
            root.castShadow = true;
            root.receiveShadow = true;
            for (const ch of root.children) {
                ch.castShadow = true;
                ch.receiveShadow = true;
            }

            const meshes: Mesh[] = [];
            root.traverse((child: any) => {
                console.log(child);
                if (child instanceof Mesh)
                    meshes.push(child);
            })

            const { navMesh, success } = threeToSoloNavMesh(
                meshes
            );
            this.navmesh = navMesh;
            this.pathfinder = new NavMeshQuery({ navMesh: this.navmesh! });

            this.scene.add(root.children[0]);
            this.scene.add(root);
        })

        // loader.load('/objects/map_move.glb', (gltf: GLTF) => {
        //     const root = gltf.scene;
        //     // root.children[0].visible = false;
        //
        //
        // })

        const ambLight = new AmbientLight(0xFFFFFF, 2);

        const dirLight = new DirectionalLight(0xFFFFFF, 5);
        dirLight.position.set(-1, 3, 1);
        dirLight.lookAt(0, 0, 0);
        dirLight.castShadow = true;

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
