'use client';

import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import ActivityIcon from '@/assets/activity.svg';
import BookmarkSelectedIcon from '@/assets/bookmark.selected.svg';
import BookmarkIcon from '@/assets/bookmark.svg';
import CircleShareIcon from '@/assets/circle-share.svg';
import ExploreSelectedIcon from '@/assets/explore.selected.svg';
import ExploreIcon from '@/assets/explore.svg';
import NotificationSelectedIcon from '@/assets/notification.selected.svg';
import NotificationIcon from '@/assets/notification.svg';
import ProfileSelectedIcon from '@/assets/profile.selected.svg';
import ProfileIcon from '@/assets/profile.svg';
import SettingsSelectedIcon from '@/assets/setting.selected.svg';
import SettingsIcon from '@/assets/setting.svg';
import { Link } from '@/components/Link.js';
import { OpenFireflyAppButton } from '@/components/OpenFireflyAppButton.js';
import { ExclusiveEvents } from '@/components/SideBar/ExclusiveEvents.js';
import { HomeEntry } from '@/components/SideBar/HomeEntry.js';
import { NotificationMenu } from '@/components/SideBar/NotificationMenu.js';
import { Post } from '@/components/SideBar/Post.js';
import { Profile } from '@/components/SideBar/Profile.js';
import { Tooltip } from '@/components/Tooltip.js';
import { PageRoute } from '@/constants/enum.js';
import { DEFAULT_BOOKMARK_SOURCE, DEFAULT_EXPLORE_TYPE, DEFAULT_NOTIFICATION_SOURCE } from '@/constants/index.js';
import { dynamic } from '@/esm/dynamic.js';
import { usePathname } from '@/esm/navigation.js';
import { classNames } from '@/helpers/classNames.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';
import { resolveBookmarkUrl } from '@/helpers/resolveBookmarkUrl.js';
import { resolveExploreUrl } from '@/helpers/resolveExploreUrl.js';
import { resolveNotificationUrl } from '@/helpers/resolveNotificationUrl.js';
import { useIsLarge } from '@/hooks/useMediaQuery.js';
import { useNavigatorState } from '@/store/useNavigatorStore.js';

const Footer = dynamic(() => import('@/components/SideBar/Footer.js').then((x) => x.Footer), {
    ssr: false,
});

interface MenuProps {
    collapsed?: boolean;
}

export const Menu = memo(function Menu({ collapsed = false }: MenuProps) {
    const pathname = usePathname();
    const isDesktop = useIsLarge();

    return (
        <nav className="relative flex min-h-[658px] flex-1 flex-col">
            <menu role="list" className="flex flex-1 flex-col gap-y-7">
                <li className="flex overflow-hidden">
                    <menu role="list" className="w-full overflow-hidden">
                        <HomeEntry collapsed={collapsed} />
                        {[
                            {
                                href: resolveExploreUrl(DEFAULT_EXPLORE_TYPE),
                                name: <Trans>Explore</Trans>,
                                icon: ExploreIcon,
                                selectedIcon: ExploreSelectedIcon,
                                match: () => pathname.startsWith(PageRoute.Explore),
                            },
                            {
                                href: resolveNotificationUrl(DEFAULT_NOTIFICATION_SOURCE),
                                name: <Trans>Notifications</Trans>,
                                icon: NotificationIcon,
                                selectedIcon: NotificationSelectedIcon,
                                match: () => pathname.startsWith(PageRoute.Notifications),
                            },
                            {
                                href: resolveBookmarkUrl(DEFAULT_BOOKMARK_SOURCE),
                                name: <Trans>Bookmarks</Trans>,
                                icon: BookmarkIcon,
                                selectedIcon: BookmarkSelectedIcon,
                                match: () => isRoutePathname(pathname, PageRoute.Bookmarks),
                            },
                            {
                                href: '/profile',
                                name: <Trans>Profile</Trans>,
                                icon: ProfileIcon,
                                selectedIcon: ProfileSelectedIcon,
                            },
                            {
                                href: PageRoute.Events,
                                name: <Trans>Exclusive Events</Trans>,
                                icon: ActivityIcon,
                                selectedIcon: ActivityIcon,
                            },
                            {
                                href: isDesktop ? '/settings/general' : PageRoute.Settings,
                                name: <Trans>Settings</Trans>,
                                icon: SettingsIcon,
                                selectedIcon: SettingsSelectedIcon,
                                match: () => isRoutePathname(pathname, PageRoute.Settings),
                            },
                        ].map((item) => {
                            const isSelected = Boolean(item.match?.());
                            const Icon = isSelected ? item.selectedIcon : item.icon;

                            return (
                                <li
                                    className="flex w-full rounded-lg text-main outline-none"
                                    key={item.href}
                                    onClick={() => {
                                        useNavigatorState.getState().updateSidebarOpen(false);
                                    }}
                                >
                                    {{
                                        [PageRoute.Events]: <ExclusiveEvents />,
                                        [PageRoute.Profile]: <Profile collapsed={collapsed} />,
                                    }[item.href] ??
                                        (isRoutePathname(item.href, PageRoute.Notifications) ? (
                                            <NotificationMenu
                                                path={item.href}
                                                isSelected={isSelected}
                                                collapsed={collapsed}
                                                menuName={item.name}
                                            />
                                        ) : (
                                            <Link
                                                href={item.href}
                                                className={classNames(
                                                    'sidebar-nav-link flex w-full text-lg leading-6 outline-none md:px-2',
                                                    { 'font-bold': isSelected },
                                                )}
                                            >
                                                <span className="flex items-center gap-x-3 rounded-lg px-2 py-2 md:px-4">
                                                    {collapsed ? (
                                                        <Tooltip content={item.name} placement="right">
                                                            <Icon width={20} height={20} />
                                                        </Tooltip>
                                                    ) : (
                                                        <Icon width={20} height={20} />
                                                    )}
                                                    <span style={{ display: collapsed ? 'none' : 'inline' }}>
                                                        {item.name}
                                                    </span>
                                                </span>
                                            </Link>
                                        ))}
                                </li>
                            );
                        })}

                        <li className="md:hidden">
                            <OpenFireflyAppButton className="flex w-full items-center gap-x-3 p-2 text-fireflyBrand">
                                <CircleShareIcon width={20} height={20} />
                                <span className="text-lg font-bold leading-6">
                                    <Trans>Mobile App</Trans>
                                </span>
                            </OpenFireflyAppButton>
                        </li>
                        <Post collapsed={collapsed} />
                    </menu>
                </li>
            </menu>
            <Footer />
        </nav>
    );
});
