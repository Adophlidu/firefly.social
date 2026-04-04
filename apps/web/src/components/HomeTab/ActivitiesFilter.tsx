'use client';

import FilterIcon from '@dimensiondev/assets/filter.svg';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { memo, useEffect, useMemo } from 'react';

import { TypeFilter } from '@/components/TypeFilter/index.js';
import { ActivitiesPlatform, Locale } from '@/constants/enum.js';
import { useLocale } from '@/helpers/getCookies.js';
import { captureArticlePlatformFilterTabEvent } from '@/providers/telemetry/captureFilterTabEvent.js';
import { type ActivitiesFilterNamespace, useActivitiesFilterStore } from '@/store/useActivitiesFilterStore.js';

interface ActivitiesFilterProps {
    namespace: ActivitiesFilterNamespace;
    hasLimo?: boolean;
    hasMatters?: boolean;
}

export const ActivitiesFilter = memo<ActivitiesFilterProps>(function ActivitiesFilter({
    namespace,
    hasLimo = false,
    hasMatters = true,
}) {
    const locale = useLocale();
    const { selectedPlatforms, setSelectedPlatforms } = useActivitiesFilterStore(
        namespace,
        !hasLimo ? [ActivitiesPlatform.Limo] : undefined,
    );

    const validPlatforms = useMemo(() => {
        const isChinese = locale === Locale.zhHans || locale === Locale.zhHant;

        return [
            {
                platform: ActivitiesPlatform.Snapshot,
                label: <Trans>Snapshot DAO</Trans>,
            },
            {
                platform: ActivitiesPlatform.Paragraph,
                label: <Trans>Paragraph article</Trans>,
            },
            {
                platform: ActivitiesPlatform.Limo,
                label: <Trans>Limo article</Trans>,
            },
            {
                platform: ActivitiesPlatform.Matters,
                label: <Trans>Matters article</Trans>,
            },
        ].filter((x) => {
            if (!hasLimo && x.platform === ActivitiesPlatform.Limo) return false;
            if (x.platform === ActivitiesPlatform.Matters && (!hasMatters || !isChinese)) return false;
            return true;
        });
    }, [hasLimo, hasMatters, locale]);

    useEffect(() => {
        const validPlatformValues = validPlatforms.map((x) => x.platform);
        const invalidSelectedPlatforms = selectedPlatforms.filter(
            (platform) => !validPlatformValues.includes(platform),
        );

        if (invalidSelectedPlatforms.length > 0) {
            const newSelectedPlatforms = selectedPlatforms.filter((platform) => validPlatformValues.includes(platform));
            setSelectedPlatforms(newSelectedPlatforms);
        }
    }, [validPlatforms, selectedPlatforms, setSelectedPlatforms]);

    return (
        <Popover className="relative flex items-center justify-center">
            <PopoverButton className="p-2 outline-none">
                <FilterIcon width={24} height={24} />
            </PopoverButton>
            <PopoverPanel
                className="bg-lightBottom text-main shadow-lightS3 dark:bg-darkBottom absolute right-0 top-10 z-50 flex min-w-[220px] flex-col gap-2 rounded-lg"
                transition
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
});
