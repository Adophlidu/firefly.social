import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { createSelectors } from '@/helpers/createSelector.js';

export type SearchPredictionEventStatus = 'active' | 'resolved';

interface SearchPredictionFilterState {
    eventStatus: SearchPredictionEventStatus | undefined;
    setEventStatus: (eventStatus?: SearchPredictionEventStatus) => void;
}

const useSearchPredictionFilterStoreBase = create<SearchPredictionFilterState, [['zustand/immer', never]]>(
    immer((set) => ({
        eventStatus: 'active',
        setEventStatus: (eventStatus) =>
            set((state) => {
                state.eventStatus = eventStatus;
            }),
    })),
);

export const useSearchPredictionFilterStore = createSelectors(useSearchPredictionFilterStoreBase);
