'use client';

import { Trans } from '@lingui/react/macro';
import { useMemo } from 'react';

import ProfileSelectedIcon from '@/assets/profile.selected.svg';
import ProfileIcon from '@/assets/profile.svg';
import { BaseMenuItem } from '@/components/SideBar/BaseMenuItem.js';
import { PageRoute } from '@/constants/enum.js';
import { usePathname } from '@/esm/navigation.js';
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
        <BaseMenuItem
            href={href}
            isSelected={isSelected}
            collapsed={sideBarCollapsed}
            menuName={<Trans>Profile</Trans>}
            icon={<Icon width={20} height={20} />}
        />
    );
}
