import { writable, type Writable } from 'svelte/store';
import { LoadingManager } from 'three';
import { type LoaderInitFunc } from './AssetLoader';

/** Asset loaders in object */
type JobsList<T> = {
    [K in keyof T]: T[K] extends LoaderInitFunc<infer U> ? LoaderInitFunc<U> : never;
};

/** Loaded assets in object */
type AssetsList<T> = {
    [K in keyof JobsList<T>]: JobsList<T>[K] extends LoaderInitFunc<infer AT>
        ? AT
        : null;
};

export default class Assets<T = object> {
    private readonly manager: LoadingManager;
    public readonly progress: Writable<number>;

    /** Assets to load */
    private readonly jobs: JobsList<T>;

    /** Loaded assets */
    private assets: AssetsList<T> | null;

    /** Callback to be called when assets are loaded */
    private onReadyCallback: (() => void) | null;

    public constructor(jobs: JobsList<T>) {
        this.manager = new LoadingManager();
        this.progress = writable(0);
        this.jobs = jobs;
        this.assets = null;
        this.onReadyCallback = null;
    }

    /** Load all provided assets */
    public async loadAssets() {
        if (this.assets) return console.warn('Assets already loaded');
        const result = {} as AssetsList<T>;

        // Separate progresses for each asset
        const progress: {
            [key: string]: number
        } = Object.keys(this.jobs).map((key) => ({
            [key]: 0
        })).reduce((acc, now) => ({...acc, ...now}), {});
        const count = Object.keys(progress).length;

        // Create loaders
        for (const name in this.jobs) {
            const asset = await this.jobs[name](this.manager, (e) => {
                progress[name] = e.loaded / e.total;

                const total = Assets.calcTotalPercent(count, progress);
                this.progress.set(total);
            }).promise;

            result[name] = asset as any;
        }

        this.assets = result;
        this.progress.set(-1);
        this.onReadyCallback?.();
    }

    /** Get asset from asset storage */
    public getAsset<U extends keyof AssetsList<T>>(name: U): AssetsList<T>[U] | null {
        if (!this.assets) {
            console.warn('Assets is not loaded yet');
            return null;
        }

        return this.assets[name]
            ?? null;
    }

    /**
     * Set callback to be called when assets are loaded
     * @param callback
     */
    public onReady(callback: () => void) {
        this.onReadyCallback = callback;
    }

    /**
     * Calculate total percent based on object of percents
     * @param count items count
     * @param items object with percents
     * @private
     */
    private static calcTotalPercent(count: number, items: Record<string, number>): number {
        let total = 0

        for (const key in items)
            total += items[key];

        return total / count * 100;
    }
}
