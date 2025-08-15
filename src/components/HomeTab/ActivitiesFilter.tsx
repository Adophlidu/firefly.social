import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { memo, useMemo } from 'react';

import CheckIcon from '@/assets/check.svg';
import FilterIcon from '@/assets/filter.svg';
import MiniFilterIcon from '@/assets/mini-filter.svg';
import MirrorIon from '@/assets/mirror.xyz.svg';
import ParagraphIcon from '@/assets/paragraph.svg';
import SnapshotIcon from '@/assets/snapshot.svg';
import { LimoIcon } from '@/components/LimoIcon.js';
import { ActivitiesPlatform } from '@/constants/enum.js';
import { captureArticlePlatformFilterTabEvent } from '@/providers/telemetry/captureFilterTabEvent.js';
import { ActivitiesFilterNamespace, useActivitiesFilterStore } from '@/store/useActivitiesFilterStore.js';

const ActivitiesPlatforms = [
    {
        platform: ActivitiesPlatform.Snapshot,
        icon: SnapshotIcon,
    },
    {
        platform: ActivitiesPlatform.Mirror,
        icon: MirrorIon,
    },
    {
        platform: ActivitiesPlatform.Paragraph,
        icon: ParagraphIcon,
    },
    {
        platform: ActivitiesPlatform.Limo,
        icon: LimoIcon,
    },
];

interface ActivitiesFilterProps {
    namespace: ActivitiesFilterNamespace;
    hasLimo?: boolean;
}

export const ActivitiesFilter = memo<ActivitiesFilterProps>(function ActivitiesFilter({ namespace, hasLimo = false }) {
    const { selectedPlatform, setSelectedPlatform } = useActivitiesFilterStore(
        namespace,
        !hasLimo ? [ActivitiesPlatform.Limo] : undefined,
    );

    const validPlatforms = useMemo(
        () =>
            !hasLimo ? ActivitiesPlatforms.filter((x) => x.platform !== ActivitiesPlatform.Limo) : ActivitiesPlatforms,
        [hasLimo],
    );
    const Icon = useMemo(() => {
        const PlatformIcon = validPlatforms.find(({ platform }) => platform === selectedPlatform)?.icon || FilterIcon;

        return <PlatformIcon width={24} height={24} />;
    }, [selectedPlatform, validPlatforms]);

    return (
        <Menu>
            {({ close }) => (
                <div>
                    <MenuButton
                        className="size-6 text-placeholder outline-none"
                        onMouseEnter={(e) => e.currentTarget.click()}
                    >
                        {Icon}
                    </MenuButton>
                    <MenuItems
                        transition
                        anchor="bottom end"
                        className="z-50 origin-top-right !overflow-visible font-normal outline-none transition data-[closed]:scale-95 data-[closed]:opacity-0"
                        onMouseLeave={() => close()}
                    >
                        <div className="w-full -translate-y-5 transform pt-5">
                            <div className="flex w-full flex-col gap-2 overflow-y-auto rounded-[8px] bg-primaryBottom py-3 shadow-messageShadow">
                                <MenuItem key="all">
                                    <div
                                        className="flex w-full cursor-pointer items-center gap-2 bg-clip-padding px-3 py-1 hover:bg-bg"
                                        onClick={() => {
                                            setSelectedPlatform(null);
                                            close();
                                            captureArticlePlatformFilterTabEvent(namespace);
                                        }}
                                    >
                                        {selectedPlatform === null ? (
                                            <CheckIcon width={16} height={16} className="text-highlight" />
                                        ) : (
                                            <div className="size-4" />
                                        )}
                                        <div className="flex h-[22px] flex-row items-center gap-1 text-medium">
                                            <MiniFilterIcon width={15} height={15} />
                                            <span>
                                                <Trans>All</Trans>
                                            </span>
                                        </div>
                                    </div>
                                </MenuItem>
                                {validPlatforms.map(({ platform, icon }) => {
                                    const PlatformIcon = icon;
                                    return (
                                        <MenuItem key={platform}>
                                            <div
                                                className="flex w-full cursor-pointer flex-row items-center gap-2 bg-clip-padding px-3 py-1 hover:bg-bg"
                                                onClick={() => {
                                                    setSelectedPlatform(platform);
                                                    close();
                                                    captureArticlePlatformFilterTabEvent(namespace, platform);
                                                }}
                                            >
                                                {selectedPlatform === platform ? (
                                                    <CheckIcon width={16} height={16} className="text-highlight" />
                                                ) : (
                                                    <div className="size-4" />
                                                )}
                                                <div className="flex h-[22px] flex-row items-center gap-1 text-medium">
                                                    <PlatformIcon width={15} height={15} className="shrink-0" />
                                                    <span>{platform}</span>
                                                </div>
                                            </div>
                                        </MenuItem>
                                    );
                                })}
                            </div>
                        </div>
                    </MenuItems>
                </div>
            )}
        </Menu>
    );
});
