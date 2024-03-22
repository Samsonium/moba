import { assetsStore } from '../assets/assets.store';
import { Group, Vector3 } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils';
import type Graphics from './index';

/** Playable character class */
export default class Character {
    private readonly role: string | undefined;

    protected readonly object: Group;
    protected readonly g: Graphics;

    public constructor(g: Graphics, initial: Vector3, role: string = 'network') {
        this.role = role;
        this.object = new Group();
        this.g = g;

        const charModelAsset = assetsStore.getAsset('yBot');
        if (!charModelAsset) throw new Error('Assets are not loaded');

        const charModel = clone(charModelAsset.scene);
        charModel.traverse(object => {
            if ('isMesh' in object && object.isMesh) {
                object.castShadow = true;
                object.receiveShadow = true;
            }
        });

        charModel.scale.setScalar(1.5);
        this.object.add(charModel);
        this.object.name = 'character';
        this.object.position.copy(initial);

        this.g.currentScene.add(this.object);

        if (import.meta.env.DEV)
            console.log('Created new character:', role);
    }

    /** Destroy character */
    public destroy() {
        this.g.currentScene.remove(this.object);
        if (import.meta.env.DEV)
            console.log(`Character destroyed [${this.role}]`);
    }

    /** Get character's position */
    public get position() {
        return this.object.position;
    }

    /** Get character's rotation */
    public get rotation() {
        return this.object.rotation;
    }
}
