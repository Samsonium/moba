import type { KeyShortcut } from './KeyShortcut';

/** Keyboard layout for the game */
export default interface KbLayout {
    skills: Record<'s1' | 's2' | 's3' | 'ult', KeyShortcut>;
    other: Record<'map' | 'shop' | 'leaderboard', KeyShortcut>;
}
