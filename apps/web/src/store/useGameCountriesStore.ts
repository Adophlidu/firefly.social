import { Locale } from '@dimensiondev/enums';
import { runInSafeAsync } from '@dimensiondev/utils';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { createSelectors } from '@/helpers/createSelector.js';
import { type GameCountry, getGameCountries } from '@/providers/firefly/prediction/getGameCountries.js';

interface GameCountriesState {
    gameCountries: Record<Locale, GameCountry[]>;
    fetchGameCountries: () => Promise<void>;
}

const useGameCountriesStoreBase = create<
    GameCountriesState,
    [['zustand/persist', unknown], ['zustand/immer', unknown]]
>(
    persist(
        immer((set, get) => ({
            gameCountries: {
                [Locale.en]: [],
                [Locale.zhHans]: [],
                [Locale.zhHant]: [],
                [Locale.es]: [],
                [Locale.ja]: [],
                [Locale.ko]: [],
            },
            async fetchGameCountries() {
                // Skip if we already have data for any locale (restored from sessionStorage).
                if (Object.values(get().gameCountries).some((list) => list.length)) return;

                const allLocales = Object.values(Locale);
                const countries = await runInSafeAsync(() =>
                    Promise.all(allLocales.map((locale) => getGameCountries(locale))),
                );
                if (!countries) return;

                set((state) => {
                    allLocales.forEach((locale, index) => {
                        const data = countries[index];
                        if (data?.length) {
                            state.gameCountries[locale] = data;
                        }
                    });
                });
            },
        })),
        {
            storage: createJSONStorage(() => sessionStorage),
            name: 'game-countries',
            partialize: (state) => ({ gameCountries: state.gameCountries }),
            onRehydrateStorage: () => (state) => {
                state?.fetchGameCountries();
            },
        },
    ),
);

export const useGameCountriesStore = createSelectors(useGameCountriesStoreBase);
