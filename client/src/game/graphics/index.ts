import {
    AmbientLight,
    CubeTextureLoader,
    DirectionalLight,
    Group,
    Mesh,
    Scene,
    PerspectiveCamera,
    Raycaster,
    Vector2,
    Vector3,
    WebGLRenderer,
    CylinderGeometry,
    MeshPhongMaterial,
    Object3D,
    Clock,
    CameraHelper,
    VSMShadowMap
} from 'three';
// @ts-ignore
import { Pathfinding, PathfindingHelper } from 'three-pathfinding';
// @ts-ignore
import { type GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import type PlayerNetData from '../network/player/PlayerNetData';

export default class Graphics {
    private readonly PF_ZONE = 'LOBBY';
    private readonly CAM_OFFSET = new Vector3(10, 20, 10);
    private readonly SUN_OFFSET = new Vector3(-10, 30, 10);

    private readonly renderer: WebGLRenderer;
    private readonly camera: PerspectiveCamera;
    private readonly scene: Scene;
    private readonly raycaster: Raycaster;
    private readonly clock: Clock;

    private readonly pathfinding: Pathfinding;
    private readonly pathfindingHelper: PathfindingHelper;
    private navmesh: Mesh | undefined;
    private groupID: any;
    private navpath: any;
    private sun: DirectionalLight | undefined;

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
        this.renderer.shadowMap.type = VSMShadowMap;

        window.addEventListener('resize', this.handleResize.bind(this));
        window.addEventListener('contextmenu', this.onRightClick.bind(this));

        this.camera = new PerspectiveCamera(45, innerWidth / innerHeight);

        this.scene = new Scene();
        this.raycaster = new Raycaster();
        this.clock = new Clock();

        this.pathfinding = new Pathfinding();
        this.pathfindingHelper = new PathfindingHelper();
        this.scene.add(this.pathfindingHelper);

        this.players = [];
        this.player = this.createLocalPlayer(0, 6.7, 0);
        this.camera.position.copy(this.player.object.position).add(this.CAM_OFFSET);
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
        loader.load('/objects/lobby_map.glb', (gltf: GLTF) => {
            const root = gltf.scene;
            root.castShadow = true;
            root.receiveShadow = true;

            root.traverse((child: Mesh) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            })

            this.scene.add(root);
        });
        loader.load('/objects/lobby_navmesh.gltf', (gltf: GLTF) => {
            gltf.scene.traverse((child: Object3D) => {
                if (!this.navmesh && child.isObject3D && child.children?.length) {
                    this.navmesh = child.children[0] as Mesh;
                    this.pathfinding.setZoneData(this.PF_ZONE, Pathfinding.createZone(this.navmesh.geometry));
                }
            });
        });

        const ambLight = new AmbientLight(0xFFFFFF, 1);
        ambLight.updateMatrixWorld();

        this.sun = new DirectionalLight(0xFFFFFF, 5);
        this.sun.castShadow = true;
        this.sun.shadow.mapSize.set(512, 512);
        this.sun.shadow.bias = 0.0001;
        this.sun.shadow.blurSamples = 8;
        this.sun.shadow.radius = 2;
        this.sun.shadow.camera.top = 50;
        this.sun.shadow.camera.left = -50;
        this.sun.shadow.camera.right = 50;
        this.sun.shadow.camera.bottom = -50;
        this.sun.position.copy(this.player.object.position).add(this.SUN_OFFSET);
        this.sun.target.position.copy(this.player.object.position).sub(this.SUN_OFFSET);
        this.sun.target.updateMatrixWorld();

        this.scene.add(new CameraHelper(this.sun.shadow.camera));

        const lightGroup = new Group();
        lightGroup.name = 'lighting';
        lightGroup.add(ambLight, this.sun);

        this.scene.add(lightGroup as any);
    }

    /** Cleanup events */
    public destroy() {
        window.removeEventListener('resize', this.handleResize.bind(this));
        window.removeEventListener('contextmenu', this.onRightClick.bind(this));
        this.scene.clear();
    }

    /** Start animation */
    public begin() {
        if (this.renderStarted) return;
        this.renderStarted = true;
        this.renderStep();
    }

    /**
     * Right click handler (event **contextmenu**)
     * @param {MouseEvent} e
     */
    public onRightClick(e: MouseEvent) {
        if (e.button !== 2) return;
        e.preventDefault();

        this.calcPath(new Vector2(
            (e.clientX / innerWidth) * 2 - 1,
            -(e.clientY / innerHeight) * 2 + 1
        ));
    }

    /** Calculate navigation path and start movement */
    private calcPath(position: Vector2) {
        this.raycaster.setFromCamera(position, this.camera);
        const res = this.raycaster.intersectObjects(this.scene.children);
        if (!res?.[0]?.point) return;

        const { point } = res[0];
        this.groupID = this.pathfinding.getGroup(this.PF_ZONE, this.player.object.position);
        const closest = this.pathfinding.getClosestNode(this.player.object.position, this.PF_ZONE, this.groupID);
        this.navpath = this.pathfinding.findPath(closest.centroid, point, this.PF_ZONE, this.groupID);

        // if (this.navpath) {
        //     this.pathfindingHelper.reset();
        //     this.pathfindingHelper.setPlayerPosition(this.player.object.position);
        //     this.pathfindingHelper.setTargetPosition(point);
        //     this.pathfindingHelper.setPath(this.navpath);
        // }

        if (!this.navpath?.length) return;
    }

    /** Move */
    private move(delta: number) {
        if (!this.navpath?.[0]) return;
        const targetPos = this.navpath[0];
        const distance = targetPos.clone().sub(this.player.object.position);
        if (distance.lengthSq() > .5 * .05) {
            distance.normalize();
            this.player.object.position.add(distance.multiplyScalar(delta * 4));
            this.camera.position.copy(this.player.object.position).add(this.CAM_OFFSET);

            this.sun!.position.copy(this.player.object.position).add(this.SUN_OFFSET);
            this.sun!.target.position.copy(this.player.object.position).sub(this.SUN_OFFSET);
            this.sun!.target.updateMatrixWorld();
        } else {
            this.navpath.shift();
        }
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
            new CylinderGeometry(.3, .3, 1.4),
            new MeshPhongMaterial({color: 0x6DFF6D})
        );
        character.castShadow = true;
        character.receiveShadow = true;
        character.position.y = .7;
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

        this.move(this.clock.getDelta());
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.renderStep.bind(this));
    }
}
