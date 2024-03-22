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
    PCFSoftShadowMap
} from 'three';
import { assetsStore } from '../assets/assets.store';

/** Render loop handler callback function */
type RenderHandler = (delta: number) => void;

/** Main render class */
export default class Graphics {

    // -------- [ CONST VECTOR OFFSETS ]

    private readonly CAM_OFFSET = new Vector3(10, 20, 10);
    private readonly SUN_OFFSET = new Vector3(-10, 30, 10);

    // -------- [ THREE JS FEATURES ]

    private readonly renderer: WebGLRenderer;
    private readonly camera: PerspectiveCamera;
    private readonly scene: Scene;
    private readonly raycaster: Raycaster;
    private readonly clock: Clock;

    /** Array of render loop handlers */
    private readonly renderHandlers: RenderHandler[];

    /** Direct light as sun */
    private sun: DirectionalLight | undefined;

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
        this.renderer.shadowMap.type = PCFSoftShadowMap;

        window.addEventListener('resize', this.handleResize.bind(this));

        this.camera = new PerspectiveCamera(45, innerWidth / innerHeight);

        this.scene = new Scene();
        this.raycaster = new Raycaster();
        this.clock = new Clock();

        this.renderStarted = false;
        this.renderHandlers = [];
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

        const lobbyMap = assetsStore.getAsset('lobbyMap');
        if (!lobbyMap) throw new Error('Assets is not loaded yet');
        const root = lobbyMap.scene;
        root.castShadow = true;
        root.receiveShadow = true;
        root.traverse((child: Object3D) => {
            if ('isMesh' in child && child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        this.scene.add(root);

        const ambLight = new AmbientLight(0xFFFFFF, 1);
        ambLight.updateMatrixWorld();

        this.sun = new DirectionalLight(0xFFFFFF, 8);
        this.sun.castShadow = true;
        this.sun.shadow.mapSize.set(2048, 2048);
        this.sun.shadow.blurSamples = 4;
        this.sun.shadow.radius = 1;
        this.sun.shadow.camera.top = 50;
        this.sun.shadow.camera.left = -50;
        this.sun.shadow.camera.right = 50;
        this.sun.shadow.camera.bottom = -50;

        const lightGroup = new Group();
        lightGroup.name = 'lighting';
        lightGroup.add(ambLight, this.sun);

        this.scene.add(lightGroup as any);
    }

    /** Cleanup events */
    public destroy() {
        window.removeEventListener('resize', this.handleResize.bind(this));
        this.scene.clear();
    }

    /** Start animation */
    public begin() {
        if (this.renderStarted) return;
        this.renderStarted = true;
        this.renderStep();
    }

    /**
     * Add render loop handler
     * @param handler function to handle render loop
     */
    public addRenderHandler(handler: RenderHandler) {
        this.renderHandlers.push(handler);
    }

    /**
     * Cast ray to specified position using raycaster
     * @param position Target position
     */
    public rayCast(position: Vector2) {
        this.raycaster.setFromCamera(position, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children);
        return intersects?.[0] ?? null;
    }

    /**
     * Update sun camera and active perspective camera
     * @param position target position
     */
    public updateShadowCaster(position: Vector3) {
        this.camera.position.copy(position).add(this.CAM_OFFSET);
        this.camera.lookAt(position);

        if (!this.sun) return;
        this.sun.position.copy(position).add(this.SUN_OFFSET);
        this.sun.target.position.copy(position).sub(this.SUN_OFFSET);
        this.sun.target.updateMatrixWorld();
    }

    /** Get scene */
    public get currentScene() {
        return this.scene;
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

        for (const handler of this.renderHandlers)
            handler(this.clock.getDelta());

        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.renderStep.bind(this));
    }
}
