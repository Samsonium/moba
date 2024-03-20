import {writable} from'svelte/store';
import type { assetList } from '../../lib/asset-list';
import type Assets from './index';

/** Assets store */
export const assetsStore = writable<Assets<typeof assetList> | null>(null);
