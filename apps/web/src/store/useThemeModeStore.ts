import type { ThemeMode } from '@dimensiondev/enums';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { createSelectors } from '@/helpers/createSelector.js';

interface ThemeModeState {
    themeMode: ThemeMode;
    setThemeMode: (mode: ThemeMode) => void;
}

const useThemeModeStateBase = create<ThemeModeState, [['zustand/persist', unknown], ['zustand/immer', unknown]]>(
    persist(
        immer((set) => ({
            themeMode: 'default',
            setThemeMode: (mode) => {
                set((state) => {
                    state.themeMode = mode;
                });
            },
        })),
        {
            name: 'global-theme-state',
        },
    ),
);

export const useThemeModeStore = createSelectors(useThemeModeStateBase);
