'use client';

import FilterIcon from '@dimensiondev/assets/filter.svg';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { memo } from 'react';

import { PredictionPlatformName } from '@/components/Prediction/PredictionPlatformName.js';
import { TypeFilter } from '@/components/TypeFilter/index.js';
import { SORTED_BETS_PLATFORM } from '@/constants/computed.js';
import { type PredictionPlatform } from '@/constants/enum.js';
import {
    type PredictionFilterNamespace,
    usePredictionSourceFilterStore,
} from '@/store/usePredictionSourceFilterStore.js';

interface PredictionPlatformFilterProps {
    namespace: PredictionFilterNamespace;
}

export const PredictionPlatformFilter = memo<PredictionPlatformFilterProps>(function PredictionPlatformFilter({
    namespace,
}) {
    const { platforms, setPlatforms } = usePredictionSourceFilterStore(namespace);

    return (
        <Popover className="relative flex items-center justify-center">
            <PopoverButton className="p-2 outline-none">
                <FilterIcon width={24} height={24} />
            </PopoverButton>
            <PopoverPanel
                className="absolute right-0 top-10 z-50 flex min-w-[220px] flex-col gap-2 rounded-lg bg-lightBottom text-main shadow-lightS3 dark:bg-darkBottom"
                transition
            >
                <div className="flex flex-col gap-4 p-4">
                    <TypeFilter
                        multiple
                        options={SORTED_BETS_PLATFORM.map((x) => {
                            return { value: x, label: <PredictionPlatformName platform={x} /> };
                        })}
                        selectedOptions={platforms}
                        onOptionsChange={(value: PredictionPlatform[]) => {
                            setPlatforms(value);
                        }}
                    />
                </div>
            </PopoverPanel>
        </Popover>
    );
});
