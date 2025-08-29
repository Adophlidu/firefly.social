import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { memo, useMemo } from 'react';

import FilterIcon from '@/assets/filter.svg';
import { TypeFilter } from '@/components/TypeFilter/index.js';
import { ActivitiesPlatform } from '@/constants/enum.js';
import { captureArticlePlatformFilterTabEvent } from '@/providers/telemetry/captureFilterTabEvent.js';
import { ActivitiesFilterNamespace, useActivitiesFilterStore } from '@/store/useActivitiesFilterStore.js';

const ActivitiesPlatforms = [
    {
        platform: ActivitiesPlatform.Snapshot,
        label: <Trans>Snapshot DAO</Trans>,
    },
    {
        platform: ActivitiesPlatform.Mirror,
        label: <Trans>Mirror article</Trans>,
    },
    {
        platform: ActivitiesPlatform.Paragraph,
        label: <Trans>Paragraph article</Trans>,
    },
    {
        platform: ActivitiesPlatform.Limo,
        label: <Trans>Limo</Trans>,
    },
];

interface ActivitiesFilterProps {
    namespace: ActivitiesFilterNamespace;
    hasLimo?: boolean;
}

export const ActivitiesFilter = memo<ActivitiesFilterProps>(function ActivitiesFilter({ namespace, hasLimo = false }) {
    const { selectedPlatforms, setSelectedPlatforms } = useActivitiesFilterStore(
        namespace,
        !hasLimo ? [ActivitiesPlatform.Limo] : undefined,
    );

    const validPlatforms = useMemo(() => {
        return hasLimo
            ? ActivitiesPlatforms
            : ActivitiesPlatforms.filter((x) => x.platform !== ActivitiesPlatform.Limo);
    }, [hasLimo]);

    const filter = (
        <Popover className="relative flex items-center justify-center">
            <PopoverButton className="p-2 outline-none">
                <FilterIcon width={24} height={24} />
            </PopoverButton>
            <PopoverPanel
                anchor="bottom end"
                className="z-50 flex min-w-[220px] flex-col gap-2 rounded-lg bg-lightBottom text-main shadow-lightS3 dark:bg-darkBottom"
                transition
                portal
            >
                <div className="flex flex-col gap-4 p-4">
                    <TypeFilter
                        multiple
                        options={validPlatforms.map((x) => {
                            return { value: x.platform, label: x.label };
                        })}
                        selectedOptions={selectedPlatforms}
                        onOptionsChange={(platforms: ActivitiesPlatform[]) => {
                            setSelectedPlatforms(platforms);
                            captureArticlePlatformFilterTabEvent(namespace, platforms);
                        }}
                    />
                </div>
            </PopoverPanel>
        </Popover>
    );
    return filter;
});
