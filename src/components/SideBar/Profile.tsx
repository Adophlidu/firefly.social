'use client';

import { Trans } from '@lingui/react/macro';
import { useMemo } from 'react';

import ProfileSelectedIcon from '@/assets/profile.selected.svg';
import ProfileIcon from '@/assets/profile.svg';
import { Link } from '@/components/Link.js';
import { Tooltip } from '@/components/Tooltip.js';
import { PageRoute } from '@/constants/enum.js';
import { usePathname } from '@/esm/navigation.js';
import { classNames } from '@/helpers/classNames.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { isSameFireflyIdentity } from '@/helpers/isSameFireflyIdentity.js';
import { matchPath } from '@/helpers/matchPath.js';
import { parseProfileUrl } from '@/helpers/parseProfileUrl.js';
import { useCurrentFireflyProfilesAll } from '@/hooks/useCurrentFireflyProfiles.js';
import { useCurrentProfileFirstAvailable } from '@/hooks/useCurrentProfile.js';

interface ProfileProps {
    collapsed?: boolean;
}

export function Profile({ collapsed: sideBarCollapsed = false }: ProfileProps) {
    const profile = useCurrentProfileFirstAvailable();
    const profiles = useCurrentFireflyProfilesAll();

    const href = profile ? getProfileUrl(profile) : PageRoute.Profile;
    const pathname = usePathname();
    const isSelected = useMemo(() => {
        if (profiles.length) {
            const parsedProfileUrl = parseProfileUrl(pathname);
            return parsedProfileUrl
                ? profiles.some((x) =>
                      isSameFireflyIdentity(x.identity, {
                          source: parsedProfileUrl.source,
                          id: parsedProfileUrl.id,
                      }),
                  )
                : false;
        }
        return pathname === PageRoute.Profile || !!matchPath(`/profile/:source`, pathname, false);
    }, [pathname, profiles]);

    const Icon = isSelected ? ProfileSelectedIcon : ProfileIcon;

    return (
        <Link
            href={href}
            className={classNames('sidebar-nav-link flex w-full text-lg leading-6 outline-none md:px-4', {
                'font-bold': isSelected,
            })}
        >
            <span className="flex items-center gap-x-3 rounded-lg px-2 py-2 md:px-4">
                {sideBarCollapsed ? (
                    <Tooltip content={<Trans>Profile</Trans>} placement="right">
                        <Icon width={20} height={20} />
                    </Tooltip>
                ) : (
                    <Icon width={20} height={20} />
                )}
                <span style={{ display: sideBarCollapsed ? 'none' : 'inline' }}>
                    <Trans>Profile</Trans>
                </span>
            </span>
        </Link>
    );
}
