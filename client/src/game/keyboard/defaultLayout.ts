import type KbLayout from './KbLayout';

/** Default keyboard layout */
export const defaultLayout: KbLayout = {
    skills: {
        s1: {
            keys: ['KeyQ']
        },
        s2: {
            keys: ['KeyW']
        },
        s3: {
            keys: ['KeyE']
        },
        ult: {
            keys: ['KeyR']
        }
    },
    other: {
        map: {
            keys: ['KeyM']
        },
        shop: {
            keys: ['KeyB']
        },
        leaderboard: {
            keys: ['Tab']
        },
    }
};
