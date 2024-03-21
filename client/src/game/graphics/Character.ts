import { assetsStore } from '../assets/assets.store';
import { Group, Vector3 } from 'three';
import type Graphics from './index';

/** Playable character class */
export default class Character {
    protected readonly object: Group;
    protected readonly g: Graphics;

    public constructor(g: Graphics, initial: Vector3) {
        this.object = new Group();
        this.g = g;

        const charModel = assetsStore.getAsset('yBot');
        if (!charModel) throw new Error('Assets are not loaded');

        charModel.traverse(object => {
            object.castShadow = true;
            object.receiveShadow = true;
        })
        charModel.scale.multiplyScalar(.015);
        this.object.add(charModel);
        this.object.position.copy(initial);

        this.g.currentScene.add(this.object);
    }

    /** Get character's position */
    public get position() {
        return this.object.position;
    }
}
