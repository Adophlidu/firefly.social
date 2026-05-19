import { SORTED_PROFILE_SOURCES } from '@dimensiondev/constants/computed';
import type { SocialSource } from '@dimensiondev/enums';
import { notFound, redirect, RedirectType } from 'next/navigation.js';
import type { ReactNode } from 'react';

import { formatFireflyProfilesFromWalletProfiles } from '@/helpers/formatFireflyProfilesFromWalletProfiles.js';
import { resolveProfileUrl } from '@/helpers/resolveProfileUrl.js';
import { getAllRelatedProfileInfo } from '@/providers/firefly/endpoint/getAllRelatedProfileInfo.js';
import type { FireflyProfile } from '@/providers/types/Firefly.js';

export async function RedirectWithFireflyUID({ uid }: { uid: string }): Promise<ReactNode | never> {
    const relatedProfile = await getAllRelatedProfileInfo({ uid }, false);
    if (!relatedProfile) notFound();

    const profiles = formatFireflyProfilesFromWalletProfiles(relatedProfile) as FireflyProfile[];
    const sortProfilesWithSource = SORTED_PROFILE_SOURCES.map((source) => {
        return profiles
            .filter((profile) => profile.identity.source === source)
            .sort((a, b) => {
                const priorityA = a.isDefault ? 1 : 0;
                const priorityB = b.isDefault ? 1 : 0;
                return priorityB - priorityA;
            });
    }).filter((profiles) => profiles.length);

    const topProfile = sortProfilesWithSource?.[0]?.[0];
    if (!topProfile) notFound();

    redirect(
        resolveProfileUrl(topProfile.identity.source as SocialSource, topProfile.displayName),
        RedirectType.replace,
    );
}
