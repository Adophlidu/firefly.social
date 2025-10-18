'use client';

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { first } from 'lodash-es';

import CheckIcon from '@/assets/check.svg';
import FilterIcon from '@/assets/filter.svg';
import MiniFilterIcon from '@/assets/mini-filter.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { HomeTab, type SocialSource } from '@/constants/enum.js';
import { SOCIAL_DISCOVER_SOURCE_LOGIN_REQUIRED } from '@/constants/index.js';
import { classNames } from '@/helpers/classNames.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { useSocialDiscoverSourcesWithWhitelist } from '@/hooks/useSocialDiscoverSourcesWithWhitelist.js';
import { capturePostPlatformFilterTabEvent } from '@/providers/telemetry/captureFilterTabEvent.js';
import { useDiscoverStoreWithTab } from '@/store/useDiscoverStore.js';

interface Props {
    tab: HomeTab;
}

function PlatformItem({
    source,
    loginRequest = false,
    tab,
    onClose,
}: {
    tab: HomeTab;
    source: SocialSource;
    loginRequest?: boolean;
    onClose?: () => void;
}) {
    const { selectedSources, setFilteredPlatform } = useDiscoverStoreWithTab(tab);
    const checked = selectedSources.includes(source);
    const isLogin = useIsLogin(source);

    return (
        <ClickableButton
            className={classNames(
                'flex w-full cursor-pointer flex-row items-center gap-2 bg-clip-padding px-3 py-1 hover:bg-bg',
                {
                    'text-placeholder': !checked || (loginRequest && !isLogin),
                },
            )}
            onClick={() => {
                onClose?.();
                if (loginRequest && !isLogin) {
                    openLoginModal({
                        source,
                    });
                    return;
                }
                setFilteredPlatform(source);
                capturePostPlatformFilterTabEvent('home', source);
            }}
        >
            {checked ? <CheckIcon width={16} height={16} className="text-highlight" /> : <div className="size-4" />}
            <div className="flex h-[22px] flex-row items-center gap-1 text-medium">
                <SocialSourceIcon source={source} width={15} height={15} className="shrink-0" />
                {loginRequest && !isLogin ? (
                    <span className="text-highlight">
                        <Trans>Sign in</Trans>
                    </span>
                ) : (
                    <span>{resolveSourceName(source)}</span>
                )}
            </div>
        </ClickableButton>
    );
}

export function DiscoverFilter({ tab }: Props) {
    const { selectedSources, resetFilteredPlatform } = useDiscoverStoreWithTab(tab);
    const sources = useSocialDiscoverSourcesWithWhitelist(tab);

    const selectedSource = first(selectedSources);

    function getMenuItems() {
        return sources.map((source) => {
            return (
                <MenuItem key={source}>
                    {({ close }) => (
                        <PlatformItem
                            source={source}
                            tab={tab}
                            loginRequest={
                                [HomeTab.Following].includes(tab) ||
                                SOCIAL_DISCOVER_SOURCE_LOGIN_REQUIRED.includes(source)
                            }
                            onClose={close}
                        />
                    )}
                </MenuItem>
            );
        });
    }

    return (
        <Menu>
            {({ close }) => (
                <div key="discover-filter">
                    <MenuButton
                        className="size-6 text-placeholder outline-none"
                        onMouseEnter={(e) => e.currentTarget.click()}
                    >
                        {selectedSource ? (
                            <SocialSourceIcon size={24} source={selectedSource} />
                        ) : (
                            <FilterIcon width={24} height={24} />
                        )}
                    </MenuButton>
                    <MenuItems
                        transition
                        anchor="bottom end"
                        className="z-50 origin-top-right !overflow-visible font-normal outline-none transition data-[closed]:scale-95 data-[closed]:opacity-0"
                        onMouseLeave={() => close()}
                    >
                        <div className="w-full -translate-y-5 pt-5">
                            <div className="flex w-full flex-col gap-2 overflow-y-auto rounded-[8px] bg-primaryBottom py-3 shadow-messageShadow">
                                <MenuItem key="all">
                                    <a
                                        className="flex w-full cursor-pointer items-center gap-2 bg-clip-padding px-3 py-1 hover:bg-bg"
                                        onClick={() => {
                                            close();
                                            resetFilteredPlatform();
                                            capturePostPlatformFilterTabEvent('home');
                                        }}
                                    >
                                        {selectedSource ? (
                                            <div className="size-4" />
                                        ) : (
                                            <CheckIcon width={16} height={16} className="text-highlight" />
                                        )}
                                        <div className="flex h-[22px] flex-row items-center gap-1 text-medium">
                                            <MiniFilterIcon width={15} height={15} />
                                            <span>
                                                <Trans>All</Trans>
                                            </span>
                                        </div>
                                    </a>
                                </MenuItem>
                                {getMenuItems()}
                            </div>
                        </div>
                    </MenuItems>
                </div>
            )}
        </Menu>
    );
}
