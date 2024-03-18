import type KbLayout from './KbLayout';

/** Keyboard states */
export type KbState = {
    skills: Record<keyof KbLayout['skills'], boolean>;
    other: Record<keyof KbLayout['other'], boolean>;
}
