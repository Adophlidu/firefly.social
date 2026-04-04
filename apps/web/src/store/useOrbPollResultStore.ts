import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { createSelectors } from '@/helpers/createSelector.js';

interface OrbPollResultStore {
    pollResult: Record<string, Record<string, string[]>>;
    addPollResult: (profileId: string, pollId: string, options: string[]) => void;
    removePollResult: (profileId: string, pollId: string) => void;
}

const useOrbPollResultStoreBase = create<OrbPollResultStore, [['zustand/persist', unknown], ['zustand/immer', never]]>(
    persist(
        immer((set) => ({
            pollResult: {},
            addPollResult: (profileId: string, pollId: string, options: string[]) =>
                set((state) => {
                    state.pollResult[profileId] = {
                        ...state.pollResult[profileId],
                        [pollId]: options,
                    };
                }),
            removePollResult: (profileId: string, pollId: string) =>
                set((state) => {
                    const oldRecord = state.pollResult[profileId] || {};
                    const keys = Object.keys(oldRecord);
                    if (!keys.includes(pollId)) return;

                    state.pollResult[profileId] = Object.fromEntries(
                        Object.entries(oldRecord).filter(([key]) => key !== pollId),
                    );
                }),
        })),
        {
            name: 'orb-poll-result',
            storage: createJSONStorage(() => sessionStorage),
        },
    ),
);

export const useOrbPollResultStore = createSelectors(useOrbPollResultStoreBase);
