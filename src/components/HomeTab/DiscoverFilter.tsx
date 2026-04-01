'use client';

import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';

import FilterIcon from '@/assets/filter.svg';
import RadioOff from '@/assets/radio.disable-no.svg';
import RadioOn from '@/assets/radio.yes.svg';
import { TypeFilter } from '@/components/TypeFilter/index.js';
import { SOCIAL_DISCOVER_SOURCE_LOGIN_REQUIRED } from '@/constants/computed.js';
import { HomeTab, type SocialSource } from '@/constants/enum.js';
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
                className="absolute right-0 top-10 z-50 flex min-w-[220px] flex-col gap-2 rounded-lg bg-lightBottom text-main shadow-lightS3 dark:bg-darkBottom"
                transition
                portal={false}
            >
                {({ close }) => {
                    const options = sources.map((source) => {
                        const isLogin = !!profilesAll[source]?.profileId;
                        const loginRequest =
                            HomeTab.Following === tab || SOCIAL_DISCOVER_SOURCE_LOGIN_REQUIRED.includes(source);

                        return {
                            value: source,
                            label:
                                loginRequest && !isLogin
                                    ? (source: SocialSource, selected: boolean) => (
                                          <div
                                              className="flex items-center gap-2"
                                              onClick={(event) => event.stopPropagation()}
                                          >
                                              {selected ? (
                                                  <RadioOn className="size-4 text-highlight" />
                                              ) : (
                                                  <RadioOff className="size-4 text-secondaryLine" />
                                              )}
                                              <div
                                                  className="text-highlight"
                                                  onClick={() => {
                                                      close();
                                                      openLoginModal({
                                                          source,
                                                      });
                                                  }}
                                              >
                                                  <Trans>Sign in to {resolveSourceName(source)}</Trans>
                                              </div>
                                          </div>
                                      )
                                    : resolveSourceName(source),
                        };
                    });
                    return (
                        <div className="flex flex-col gap-4 p-4">
                            <TypeFilter
                                multiple
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
