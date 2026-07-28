'use client';

import { FollowCategory } from '@dimensiondev/enums';
import { Trans } from '@lingui/react/macro';
import { compact } from 'lodash-es';
import { type PropsWithChildren, useMemo } from 'react';

import { SecondTabs } from '@/components/Tabs/SecondTabs.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { narrowToSocialSource } from '@/helpers/narrowToSocialSource.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export function FollowPageLayout({
    children,
    category,
    profile,
}: PropsWithChildren<{ category: FollowCategory; profile: Profile }>) {
    const source = narrowToSocialSource(profile.source);
    const myProfile = useCurrentProfile(source);

    const tabs = useMemo(
        () =>
            compact([
                !isSameProfile(myProfile, profile)
                    ? {
                          title: <Trans>Followers you know</Trans>,
                          value: FollowCategory.Mutuals,
                          link: getProfileUrl(profile, FollowCategory.Mutuals),
                      }
                    : null,
                {
                    title: <Trans>Following</Trans>,
                    value: FollowCategory.Following,
                    link: getProfileUrl(profile, FollowCategory.Following),
                },
                {
                    title: <Trans>Followers</Trans>,
                    value: FollowCategory.Followers,
                    link: getProfileUrl(profile, FollowCategory.Followers),
                },
            ]),
        [myProfile, profile],
    );

    return (
        <>
            <SecondTabs<FollowCategory> items={tabs} current={category} />
            {children}
        </>
    );
}
