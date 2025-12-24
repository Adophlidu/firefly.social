'use client';

import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { memo } from 'react';

import FilterIcon from '@/assets/filter.svg';
import { BetsPlatformName } from '@/components/Bets/BetsPlatformName.js';
import { TypeFilter } from '@/components/TypeFilter/index.js';
import { SORTED_BETS_PLATFORM } from '@/constants/computed.js';
import { BetsPlatform } from '@/constants/enum.js';
import { BetsFilterNamespace, useBetsSourceFilterStore } from '@/store/useBetsSourceFilterStore.js';

interface BetsPlatformFilterProps {
    namespace: BetsFilterNamespace;
}

export const BetsPlatformFilter = memo<BetsPlatformFilterProps>(function BetsPlatformFilter({ namespace }) {
    const { platforms, setPlatforms } = useBetsSourceFilterStore(namespace);

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
                            return { value: x, label: <BetsPlatformName platform={x} /> };
                        })}
                        selectedOptions={platforms}
                        onOptionsChange={(value: BetsPlatform[]) => {
                            setPlatforms(value);
                        }}
                    />
                </div>
            </PopoverPanel>
        </Popover>
    );
});
