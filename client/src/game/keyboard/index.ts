import { defaultLayout } from './defaultLayout';
import type KbLayout from './KbLayout';
import type { KbState } from './KbState';

/** Keyboard events manager */
export default class Keyboard {

    /** Keyboard layout */
    private readonly layout: KbLayout;

    /** Keyboard state */
    private readonly state: KbState;

    public constructor(layout?: KbLayout) {
        this.layout = layout ?? defaultLayout;
        this.state = {
            skills: {
                s1: false,
                s2: false,
                s3: false,
                ult: false
            },
            other: {
                map: false,
                shop: false,
                leaderboard: false
            }
        };
    }

    /** Initialize keyboard events */
    public init() {
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    /** Cleanup events */
    public destroy() {
        window.removeEventListener('keydown', this.handleKeyDown.bind(this));
        window.removeEventListener('keyup', this.handleKeyUp.bind(this));
    }

    /** Search key in defined layout */
    private searchInLayout(key: string) {
        let path: [string, string] | null = null;

        for (const group in this.layout) {
            const items = Object.entries(this.layout[group as keyof KbLayout]);
            for (const [name, shortcut] of items) {
                if (shortcut.keys.includes(key)) {
                    path = [group, name];
                    break;
                }
            }
        }

        return path ? path : null;
    }

    /** Handle keydown event */
    private handleKeyDown(e: KeyboardEvent) {
        const shortcut = this.searchInLayout(e.code);
        if (!shortcut) return;
        e.preventDefault();

        // @ts-ignore
        this.state[shortcut[0]][shortcut[1]] = true;
    }

    /** Handle keyup event */
    private handleKeyUp(e: KeyboardEvent) {
        const shortcut = this.searchInLayout(e.code);
        if (!shortcut) return;
        e.preventDefault();

        // @ts-ignore
        this.state[shortcut[0]][shortcut[1]] = true;
    }
}
