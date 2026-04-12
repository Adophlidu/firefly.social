import { atomWithStorage, createJSONStorage } from 'jotai/utils';

import type { ThemeMode } from '@/constants/enum.js';

export const themeStorageAtom = atomWithStorage<{
    state: {
        themeMode: ThemeMode;
    };
    version: number;
} | null>(
    'global-theme-state',
    null,
    typeof window !== 'undefined' ? createJSONStorage(() => window.localStorage) : undefined,
    {
        getOnInit: true,
    },
);
