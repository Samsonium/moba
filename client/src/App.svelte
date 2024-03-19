<script lang="ts">
    import { onMount } from 'svelte';
    import { Vector2 } from 'three';
    import Graphics from './game/graphics';
    import Keyboard from './game/keyboard';
    import Network from './game/network';

    let canvas: HTMLCanvasElement;
    onMount(() => {
        const n = new Network();
        const g = new Graphics(canvas);
        const kb = new Keyboard();

        g.setupScene();
        g.begin();

        return () => {
            n.destroy();
            g.destroy();
            kb.destroy();
        }
    });
</script>

<canvas bind:this={canvas}></canvas>

<style>
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
