import type { Group, LoadingManager } from 'three';
// @ts-ignore
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
// @ts-ignore
import { type GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export type LoaderInitFunc<T> = (
    lm: LoadingManager,
    onProgress: (e: ProgressEvent) => void
) => AssetLoader<T>;

/** Asset loader class */
export default class AssetLoader<T = any> {
    private readonly loadPromise: Promise<T>;

    private constructor(loadPromise: Promise<T>) {
        this.loadPromise = loadPromise;
    }

    /** Get load promise */
    public get promise() {
        return this.loadPromise;
    }

    /** Create GLTF loader */
    public static createGLTF(path: string): LoaderInitFunc<GLTF> {
        return (lm, onProgress) => {
            const loader = new GLTFLoader(lm);
            return new AssetLoader(loader.loadAsync(path, onProgress));
        }
    }

    /** Create FBX loader */
    public static createFBX(path: string): LoaderInitFunc<Group> {
        return (lm, onProgress) => {
            const loader = new FBXLoader(lm);
            return new AssetLoader(loader.loadAsync(path, onProgress));
        }
    }
}
