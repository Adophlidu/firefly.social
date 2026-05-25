'use client';

import CircleShareIcon from '@dimensiondev/assets/circle-share.svg';
import CupIcon from '@dimensiondev/assets/cup.svg';
import SettingsSelectedIcon from '@dimensiondev/assets/setting.selected.svg';
import SettingsIcon from '@dimensiondev/assets/setting.svg';
import { PageRoute, STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs/web';
import { Trans } from '@lingui/react/macro';
import { compact } from 'lodash-es';
import { memo } from 'react';

import { OpenFireflyAppButton } from '@/components/OpenFireflyAppButton.js';
import { BaseMenuItem } from '@/components/SideBar/BaseMenuItem.js';
import { BookmarkMenu } from '@/components/SideBar/BookmarkMenu.js';
import { ExclusiveEvents } from '@/components/SideBar/ExclusiveEvents.js';
import { ExploreEntranceMenu } from '@/components/SideBar/ExploreEntranceMenu.js';
import { GenesisSparksMenu } from '@/components/SideBar/GenesisSparksMenu.js';
import { HomeEntry } from '@/components/SideBar/HomeEntry.js';
import { NotificationMenu } from '@/components/SideBar/NotificationMenu.js';
import { Post } from '@/components/SideBar/Post.js';
import { Profile } from '@/components/SideBar/Profile.js';
import { dynamic } from '@/esm/dynamic.js';
import { usePathname } from '@/esm/navigation.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';
import { useIsLarge } from '@/hooks/useMediaQuery.js';
import { useMounted } from '@/hooks/useMounted.js';
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
    const mounted = useMounted();
    const { updateSidebarOpen } = useNavigatorState();

    const settingsHref = mounted && isDesktop ? '/settings/general' : PageRoute.Settings;

    return (
        <nav className="relative flex min-h-[658px] flex-1 flex-col">
            <menu role="list" className="flex flex-1 flex-col gap-y-7">
                <li className="flex overflow-hidden">
                    <menu role="list" className="w-full overflow-hidden">
                        <HomeEntry collapsed={collapsed} />
                        {compact([
                            {
                                href: PageRoute.Explore,
                                name: <Trans>Explore</Trans>,
                                match: () => pathname.startsWith(PageRoute.Explore),
                            },
                            {
                                href: PageRoute.Notifications,
                                name: <Trans>Notifications</Trans>,
                                match: () => pathname.startsWith(PageRoute.Notifications),
                            },
                            {
                                href: PageRoute.Bookmarks,
                                name: <Trans>Bookmarks</Trans>,
                                match: () => isRoutePathname(pathname, PageRoute.Bookmarks),
                            },
                            {
                                href: '/profile',
                                name: <Trans>Profile</Trans>,
                            },
                            envs.external.NEXT_PUBLIC_SPARKS === STATUS.Enabled
                                ? {
                                      href: PageRoute.Sparks,
                                      name: <Trans>Genesis Sparks</Trans>,
                                      match: () => isRoutePathname(pathname, PageRoute.Sparks),
                                  }
                                : undefined,
                            envs.external.NEXT_PUBLIC_WORLD_CUP === STATUS.Enabled
                                ? {
                                      href: PageRoute.WorldCup,
                                      name: <Trans>World Cup</Trans>,
                                      icon: CupIcon,
                                      selectedIcon: CupIcon,
                                      match: () => isRoutePathname(pathname, PageRoute.WorldCup),
                                  }
                                : undefined,
                            {
                                href: PageRoute.Events,
                                name: <Trans>Exclusive Events</Trans>,
                                match: () => isRoutePathname(pathname, PageRoute.Events),
                            },
                            {
                                href: settingsHref,
                                name: <Trans>Settings</Trans>,
                                icon: SettingsIcon,
                                selectedIcon: SettingsSelectedIcon,
                                match: () => isRoutePathname(pathname, PageRoute.Settings),
                            },
                        ]).map((item) => {
                            const isSelected = Boolean(item.match?.());
                            const Icon = isSelected ? item.selectedIcon : item.icon;

                            return (
                                <li
                                    className="flex w-full rounded-lg text-main outline-none"
                                    key={item.href}
                                    onClick={() => {
                                        updateSidebarOpen(false);
                                    }}
                                >
                                    {{
                                        [PageRoute.Events]: (
                                            <ExclusiveEvents isSelected={isSelected} collapsed={collapsed} />
                                        ),
                                        [PageRoute.Profile]: <Profile collapsed={collapsed} />,
                                        [PageRoute.Notifications]: (
                                            <NotificationMenu isSelected={isSelected} collapsed={collapsed} />
                                        ),
                                        [PageRoute.Bookmarks]: (
                                            <BookmarkMenu isSelected={isSelected} collapsed={collapsed} />
                                        ),
                                        [PageRoute.Sparks]: (
                                            <GenesisSparksMenu isSelected={isSelected} collapsed={collapsed} />
                                        ),
                                        [PageRoute.Explore]: (
                                            <ExploreEntranceMenu isSelected={isSelected} collapsed={collapsed} />
                                        ),
                                    }[item.href] ?? (
                                        <BaseMenuItem
                                            href={item.href}
                                            isSelected={isSelected}
                                            collapsed={collapsed}
                                            menuName={item.name}
                                            icon={Icon ? <Icon width={20} height={20} /> : <></>}
                                        />
                                    )}
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
