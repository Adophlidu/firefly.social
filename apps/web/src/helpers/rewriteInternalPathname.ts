import { ChannelTabType, SocialProfileCategory, WalletProfileCategory } from '@dimensiondev/enums';
import urlcat from 'urlcat';

import { isFollowCategory } from '@/helpers/isFollowCategory.js';
import { isProfilePageSource, isSocialSource } from '@/helpers/isSource.js';
import { parseClubUrl } from '@/helpers/parseClubUrl.js';
import { parseProfileUrl } from '@/helpers/parseProfileUrl.js';
import { resolveProfileSourceInURL, resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';

/**
 * Internal URL rewrites applied by BOTH the server middleware (before
 * matching) and the client router (hydrateApp's rewritePathname), so both
 * sides compute the same route for a URL:
 * - /profile/:source/:id/:follow-category → /profile/:source/:id/relation/:category
 * - /profile/:source/:id → /profile/:source/:id/:default-category
 * - /club/:source/:id → /club/:source/:id/posts
 * The `_internal` marker the middleware adds to prevent redirect loops is
 * irrelevant on the client (matching only).
 */
export function rewriteInternalPathname(pathname: string): string {
    const parsedProfileUrl = parseProfileUrl(pathname);
    if (parsedProfileUrl?.category && isFollowCategory(parsedProfileUrl.category)) {
        return urlcat(`/profile/:source/:id/relation/:category`, {
            ...parsedProfileUrl,
            source: resolveProfileSourceInURL(parsedProfileUrl.source),
        });
    }

    if (
        !parsedProfileUrl?.category &&
        !!parsedProfileUrl?.source &&
        !!parsedProfileUrl.id &&
        isProfilePageSource(parsedProfileUrl.source)
    ) {
        return urlcat(`/profile/:source/:id/:category`, {
            source: resolveProfileSourceInURL(parsedProfileUrl.source),
            id: parsedProfileUrl.id,
            category: isSocialSource(parsedProfileUrl.source)
                ? SocialProfileCategory.Feed
                : WalletProfileCategory.Transactions,
        });
    }

    const parsedClubUrl = parseClubUrl(new URL(pathname, 'http://internal'));
    if (!parsedClubUrl?.type && !!parsedClubUrl?.source && !!parsedClubUrl.id) {
        return urlcat(`/club/:source/:id/:type`, {
            source: resolveSourceInUrl(parsedClubUrl.source),
            id: parsedClubUrl.id,
            type: ChannelTabType.Posts,
        });
    }

    return pathname;
}
