<script lang="ts">
    import { init } from 'recast-navigation';
    import { onMount } from 'svelte';
    import { Vector2 } from 'three';
    import Graphics from './game/graphics';
    import Keyboard from './game/keyboard';
    import Network from './game/network';

    let canvas: HTMLCanvasElement;
    onMount(() => {
        init();
        const n = new Network();
        const g = new Graphics(canvas);
        const kb = new Keyboard();

        g.setupScene();
        g.begin();

        function handleRC(e: MouseEvent) {
            if (e.button != 2) return;
            e.preventDefault();

            const mouse = new Vector2();
            mouse.x = (e.clientX / innerWidth) * 2 - 1;
            mouse.y = -(e.clientY / innerHeight) * 2 + 1;

            g.moveTo(mouse);
        }

        window.addEventListener('contextmenu', handleRC);

        return () => {
            n.destroy();
            g.destroy();
            kb.destroy();
            window.removeEventListener('contextmenu', handleRC);
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
