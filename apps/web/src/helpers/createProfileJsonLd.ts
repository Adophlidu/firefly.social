import { SITE_URL_OFFICIAL } from '@dimensiondev/constants/static';
import urlcat from 'urlcat';

import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

type ProfileJsonLdSource = Pick<Profile, 'source' | 'profileId' | 'displayName' | 'handle'> &
    Partial<Pick<Profile, 'bio' | 'pfp' | 'followerCount'>>;

interface InteractionCounter {
    '@type': 'InteractionCounter';
    interactionType: string;
    userInteractionCount: number;
}

interface PersonJsonLd {
    '@type': 'Person';
    name: string;
    alternateName: string;
    identifier: string;
    description?: string;
    image?: string;
    url?: string;
    interactionStatistic?: InteractionCounter[];
}

export interface ProfilePageJsonLd {
    '@context': 'https://schema.org';
    '@type': 'ProfilePage';
    mainEntity: PersonJsonLd;
}

/**
 * Build a schema.org ProfilePage JSON-LD object for profile rich results.
 * @see https://developers.google.com/search/docs/appearance/structured-data/profile-page
 */
export function createProfileJsonLd(profile: ProfileJsonLdSource): ProfilePageJsonLd {
    const profilePath = getProfileUrl({ source: profile.source, handle: profile.handle });

    const mainEntity: PersonJsonLd = {
        '@type': 'Person',
        // remote data may omit displayName even though the type claims it is present
        name: profile.displayName?.trim() || `@${profile.handle}`,
        alternateName: `@${profile.handle}`,
        identifier: profile.profileId,
    };
    if (profile.bio) mainEntity.description = profile.bio;
    if (profile.pfp) mainEntity.image = profile.pfp;
    if (profilePath) mainEntity.url = urlcat(SITE_URL_OFFICIAL, profilePath);
    if (typeof profile.followerCount === 'number' && Number.isFinite(profile.followerCount)) {
        mainEntity.interactionStatistic = [
            {
                '@type': 'InteractionCounter',
                interactionType: 'https://schema.org/FollowAction',
                userInteractionCount: profile.followerCount,
            },
        ];
    }

    return {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        mainEntity,
    };
}

/**
 * Serialize JSON-LD for embedding in a <script type="application/ld+json"> tag.
 * Escapes `<` to prevent script-context injection from user-provided content.
 */
export function serializeJsonLd(jsonLd: ProfilePageJsonLd): string {
    return JSON.stringify(jsonLd).replace(/</g, '\\u003c');
}
