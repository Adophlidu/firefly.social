'use client';

import HomeSelectedIcon from '@dimensiondev/assets/home.selected.svg';
import HomeIcon from '@dimensiondev/assets/home.svg';
import { DEFAULT_SOCIAL_SOURCE } from '@dimensiondev/constants/computed';
import { PageRoute } from '@dimensiondev/enums';
import { Trans } from '@lingui/react/macro';

import { BaseMenuItem } from '@/components/SideBar/BaseMenuItem.js';
import { usePathname } from '@/esm/navigation.js';
import { parseDiscoverPageUrl } from '@/helpers/parseDiscoverPageUrl.js';
import { parseFollowingPageUrl } from '@/helpers/parseFollowingPageUrl.js';
import { resolveDiscoverUrl } from '@/helpers/resolveDiscoverUrl.js';
import { resolveFollowingUrl } from '@/helpers/resolveFollowingUrl.js';
import { useIsLoginDiscoverSource } from '@/hooks/useIsLogin.js';
import { useNavigatorState } from '@/store/useNavigatorStore.js';

interface HomeEntryProps {
    collapsed: boolean;
}

export function HomeEntry({ collapsed }: HomeEntryProps) {
    const pathname = usePathname();
    const isLogin = useIsLoginDiscoverSource();
    const { updateSidebarOpen } = useNavigatorState();

    const homeUrl = isLogin ? resolveFollowingUrl(DEFAULT_SOCIAL_SOURCE) : resolveDiscoverUrl(DEFAULT_SOCIAL_SOURCE);

    const isSelected =
        pathname === PageRoute.Home || !!parseDiscoverPageUrl(pathname) || !!parseFollowingPageUrl(pathname);
    const Icon = isSelected ? HomeSelectedIcon : HomeIcon;

    return (
        <li
            className="text-main flex w-full rounded-lg outline-none"
            onClick={() => {
                updateSidebarOpen(false);
            }}
        >
            <BaseMenuItem
                href={homeUrl}
                isSelected={isSelected}
                collapsed={collapsed}
                menuName={<Trans>Home</Trans>}
                icon={<Icon width={20} height={20} />}
            />
        </li>
    );
}
