import { Trans } from '@lingui/react/macro';

import HomeSelectedIcon from '@/assets/home.selected.svg';
import HomeIcon from '@/assets/home.svg';
import { Tooltip } from '@/components/Tooltip.js';
import { PageRoute } from '@/constants/enum.js';
import { DEFAULT_SOCIAL_SOURCE } from '@/constants/index.js';
import { Link } from '@/esm/Link.js';
import { usePathname } from '@/esm/navigation.js';
import { classNames } from '@/helpers/classNames.js';
import { parseDiscoverPageUrl } from '@/helpers/parseDiscoverPageUrl.js';
import { parseFollowingPageUrl } from '@/helpers/parseFollowingPageUrl.js';
import { resolveDiscoverUrl } from '@/helpers/resolveDiscoverUrl.js';
import { resolveFollowingUrl } from '@/helpers/resolveFollowingUrl.js';
import { useIsLoginDiscoverSource } from '@/hooks/useIsLogin.js';
import { useNavigatorState } from '@/store/useNavigatorStore.js';

interface HomeEntryProps {
    collapsed?: boolean;
}

export function HomeEntry({ collapsed }: HomeEntryProps) {
    const pathname = usePathname();
    const isLogin = useIsLoginDiscoverSource();

    const homeUrl = isLogin ? resolveFollowingUrl(DEFAULT_SOCIAL_SOURCE) : resolveDiscoverUrl(DEFAULT_SOCIAL_SOURCE);

    const isSelected =
        pathname === PageRoute.Home || !!parseDiscoverPageUrl(pathname) || !!parseFollowingPageUrl(pathname);
    const Icon = isSelected ? HomeSelectedIcon : HomeIcon;

    return (
        <li
            className="flex w-full rounded-lg text-main outline-none"
            onClick={() => {
                useNavigatorState.getState().updateSidebarOpen(false);
            }}
        >
            <Link
                href={homeUrl}
                className={classNames('sidebar-nav-link flex w-full text-lg leading-6 outline-none md:px-2', {
                    'font-bold': isSelected,
                })}
            >
                <span className="flex items-center gap-x-3 rounded-lg px-2 py-2 md:px-4">
                    {collapsed ? (
                        <Tooltip content={<Trans>Home</Trans>} placement="right">
                            <Icon width={20} height={20} />
                        </Tooltip>
                    ) : (
                        <Icon width={20} height={20} />
                    )}
                    <span style={{ display: collapsed ? 'none' : 'inline' }}>{<Trans>Home</Trans>}</span>
                </span>
            </Link>
        </li>
    );
}
