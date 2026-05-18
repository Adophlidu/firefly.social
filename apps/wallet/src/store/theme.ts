import type { ThemeMode } from '@dimensiondev/enums';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';

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
