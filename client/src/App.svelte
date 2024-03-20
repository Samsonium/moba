<script lang="ts">
    import { onMount } from 'svelte';
    import { assetsStore } from './game/assets/assets.store';
    import { assetList } from './lib/asset-list';
    import Assets from './game/assets';
    import Network from './game/network';
    import Graphics from './game/graphics';
    import Keyboard from './game/keyboard';

    $assetsStore = new Assets<typeof assetList>(assetList);
    $assetsStore.loadAssets();

    let canvas: HTMLCanvasElement;
    onMount(() => {
        let n: Network,
            g: Graphics,
            kb: Keyboard;

        $assetsStore!.onReady(() => {
            n = new Network();
            g = new Graphics(canvas);
            kb = new Keyboard();

            g.setupScene();
            g.begin();
        });

        return () => {
            n.destroy();
            g.destroy();
            kb.destroy();
            assetsStore.set(null);
        }
    });

    $: progress = $assetsStore?.progress;
</script>

{#if typeof $progress === 'number' && $progress !== -1}
    <div class="preloader">
        <p>Загрузка...</p>
        <div class="progress-bar">
            <div class="progress" style="--p: {$progress}%"></div>
        </div>
    </div>
{/if}

<canvas bind:this={canvas}></canvas>

<style>
    .preloader {
        position: fixed;
        z-index: 10;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-flow: column;
        align-items: center;
        justify-content: center;
        background: #242424;
    }

    .preloader .progress-bar {
        width: 100%;
        max-width: 200px;
        height: 4px;
        border-radius: 2px;
        background: #747bff30;
    }

    .preloader .progress-bar .progress {
        width: var(--p);
        height: 100%;
        background: #747bff;
    }

    canvas {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
    }
</style>
