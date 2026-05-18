'use client';

import FilterIcon from '@dimensiondev/assets/filter.svg';
import type { SocialSource } from '@dimensiondev/enums';
import { HomeTab } from '@dimensiondev/enums';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';

import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { TypeFilter } from '@/components/TypeFilter/index.js';
import { SOCIAL_DISCOVER_SOURCE_LOGIN_REQUIRED, SORTED_SOCIAL_SOURCES } from '@/constants/computed.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import { useDiscoverStoreWithTab } from '@/hooks/useDiscoverStoreWithTab.js';
import { useSocialDiscoverSourcesWithWhitelist } from '@/hooks/useSocialDiscoverSourcesWithWhitelist.js';
import { capturePostPlatformFilterTabEvent } from '@/providers/telemetry/captureFilterTabEvent.js';

interface Props {
    tab: HomeTab;
}

export function DiscoverFilter({ tab }: Props) {
    const { selectedSources, setFilteredPlatform } = useDiscoverStoreWithTab(tab);
    const sources = useSocialDiscoverSourcesWithWhitelist(tab);
    const profilesAll = useCurrentProfilesAll();

    return (
        <Popover className="relative flex items-center justify-center">
            <PopoverButton className="p-2 outline-none">
                <FilterIcon width={24} height={24} />
            </PopoverButton>
            <PopoverPanel
                className="bg-lightBottom text-main shadow-lightS3 dark:bg-darkBottom absolute right-0 top-10 z-50 flex min-w-[220px] flex-col gap-2 rounded-lg"
                transition
                portal={false}
            >
                {({ close }) => {
                    const sortedSources = [...sources].sort((a, b) => {
                        const aLogin = !!profilesAll[a]?.profileId;
                        const bLogin = !!profilesAll[b]?.profileId;
                        if (aLogin !== bLogin) return aLogin ? -1 : 1;
                        const rank = (s: SocialSource) => {
                            const i = SORTED_SOCIAL_SOURCES.indexOf(s);
                            return i === -1 ? SORTED_SOCIAL_SOURCES.length : i;
                        };
                        return rank(a) - rank(b);
                    });
                    const options = sortedSources.map((source) => {
                        const isLogin = !!profilesAll[source]?.profileId;
                        const loginRequest =
                            HomeTab.Following === tab || SOCIAL_DISCOVER_SOURCE_LOGIN_REQUIRED.includes(source);

                        return {
                            value: source,
                            icon: <SocialSourceIcon source={source} size={20} mono className="text-current" />,
                            label: resolveSourceName(source),
                            signInAction: loginRequest && !isLogin,
                            onSignIn: () => {
                                close();
                                openLoginModal({
                                    source,
                                });
                            },
                        };
                    });
                    return (
                        <div className="flex flex-col p-4">
                            <TypeFilter
                                multiple
                                title={<Trans>Platform filter</Trans>}
                                options={options}
                                selectedOptions={selectedSources}
                                onOptionsChange={(platforms: SocialSource[], newSource?: SocialSource) => {
                                    setFilteredPlatform(platforms);

                                    if (newSource) {
                                        capturePostPlatformFilterTabEvent('home', newSource);
                                    }
                                }}
                            />
                        </div>
                    );
                }}
            </PopoverPanel>
        </Popover>
    );
}
