import { assetsStore } from '../assets/assets.store';
import { AnimationAction, AnimationMixer, Group, Vector3 } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils';
import type Graphics from './index';

/** Playable character class */
export default class Character {
    private readonly role: string | undefined;

    protected readonly object: Group;
    protected readonly g: Graphics;

    /** Animations list */
    private readonly actions: Record<'aIdle' | 'aRun' | string, AnimationAction>;

    /** Animations mixer */
    private mixer: AnimationMixer | null;

    /** Active animation action */
    private currentAction: AnimationAction | undefined;

    public constructor(g: Graphics, initial: Vector3, role: string = 'network') {
        this.role = role;
        this.object = new Group();
        this.g = g;

        const charModelAsset = assetsStore.getAsset('yBot');
        if (!charModelAsset) throw new Error('Assets are not loaded');

        const charModel = clone(charModelAsset);
        charModel.traverse(object => {
            if ('isMesh' in object && object.isMesh) {
                object.castShadow = true;
                object.receiveShadow = true;
            }
        });

        charModel.scale.setScalar(.015);
        this.object.add(charModel);
        this.object.name = 'character';
        this.object.position.copy(initial);

        this.g.currentScene.add(this.object);

        // Setup actions
        this.actions = {};
        this.mixer = null;
        this.setupAnimations();

        if (import.meta.env.DEV)
            console.log('Created new character:', role);
    }

    /** Destroy character */
    public destroy() {
        this.g.currentScene.remove(this.object);
        if (import.meta.env.DEV)
            console.log(`Character destroyed [${this.role}]`);
    }

    public update(delta: number) {
        this.charMixer?.update(delta);
    }

    /** Cross-fade animations */
    public fadeAnimation(fromName: string, toName: string) {
        if (this.currentAction === this.actions[toName])
            return;

        this.actions[fromName].fadeOut(.1);
        this.actions[toName].reset().fadeIn(.1).play();
        this.currentAction = this.actions[toName];

        if (import.meta.env.DEV)
            console.log(`Character ${this.role} faded from ${fromName} to ${toName}`);
    }

    /** Get character's position */
    public get position() {
        return this.object.position;
    }

    /** Get character's rotation */
    public get rotation() {
        return this.object.rotation;
    }

    /** Get character's animations mixer */
    protected get charMixer() {
        return this.mixer;
    }

    /** Get current animation action */
    protected get charAction(): AnimationAction | undefined {
        return this.currentAction;
    }

    /** Get character's animations list */
    protected get charActions() {
        return this.actions;
    }

    /** Setup animation features for character */
    private setupAnimations() {
        this.mixer = new AnimationMixer(this.object.children[0]);

        // Retrieve clips
        const names: ('aIdle' | 'aRun')[] = ['aIdle', 'aRun'];
        names.forEach((n) => {
            const asset = assetsStore.getAsset(('yBot_' + n) as `yBot_${'aIdle' | 'aRun'}`);
            if (!asset) throw new Error('Cannot load animation ' + n);

            const assetClone = clone(asset);

            // Retrieve and rename animation
            const animation = assetClone.animations[0];
            animation.name = n;

            this.actions[n] = this.mixer!.clipAction(animation);
            this.actions[n].play();
        });
    }
}
