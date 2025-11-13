import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { TimeRangeFilter } from '@/constants/enum.js';
import { createSelectors } from '@/helpers/createSelector.js';

interface FilterState {
    selectedChainId: number | null;
    selectedTimeRange: TimeRangeFilter;
    setSelectedChainId: (chainId: number | null) => void;
    setSelectedTimeRange: (timeRange: TimeRangeFilter) => void;
}

const useStateStore = create<FilterState, [['zustand/immer', unknown]]>(
    immer((set) => ({
        selectedChainId: null,
        selectedTimeRange: TimeRangeFilter.OneHour,
        setSelectedChainId: (chainId) => set({ selectedChainId: chainId }),
        setSelectedTimeRange: (timeRange) => set({ selectedTimeRange: timeRange }),
    })),
);

const useExploreTrendingFilterStoreBase = createSelectors(useStateStore);

export function useExploreTrendingFilterStore() {
    const { selectedChainId, selectedTimeRange, setSelectedChainId, setSelectedTimeRange } =
        useExploreTrendingFilterStoreBase();
    return {
        selectedChainId,
        selectedTimeRange,
        setSelectedChainId,
        setSelectedTimeRange,
    };
}
