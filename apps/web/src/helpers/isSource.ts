import type { ProfilePageSource, SocialSource, SocialSourceInURL, SourceInURL } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';

import {
    BOOKMARK_SOURCES,
    DISCOVER_SOURCES,
    FOLLOWING_SOURCES,
    NOTIFICATION_SOURCES,
    PROFILE_PAGE_SOURCES,
    SOCIAL_DISCOVER_SOURCE,
    SORTED_SOCIAL_SOURCES,
} from '@/constants/computed.js';
import type {
    BookmarkSource,
    DiscoverSource,
    FollowingSource,
    NotificationSource,
    SocialDiscoverSource,
} from '@/constants/enum.js';
import { resolveSourceInUrl, resolveSourceInUrlForApi } from '@/helpers/resolveSourceInUrl.js';

export function isDiscoverSource(source: string): source is DiscoverSource {
    return (DISCOVER_SOURCES as string[]).includes(source);
}

export function isFollowingSource(source: string): source is FollowingSource {
    return FOLLOWING_SOURCES.includes(source as FollowingSource);
}

export function isSocialDiscoverSource(source: string): source is SocialDiscoverSource {
    return SOCIAL_DISCOVER_SOURCE.includes(source as SocialDiscoverSource);
}

export function isNotificationSource(source: string): source is NotificationSource {
    return NOTIFICATION_SOURCES.includes(source as NotificationSource);
}

export function isBookmarkSource(source: string): source is BookmarkSource {
    return BOOKMARK_SOURCES.includes(source as BookmarkSource);
}

export function isProfilePageSource(source: string): source is ProfilePageSource {
    return PROFILE_PAGE_SOURCES.includes(source as ProfilePageSource);
}

export function isSocialSource(source?: Source): source is SocialSource {
    if (!source) return false;
    return SORTED_SOCIAL_SOURCES.includes(source as SocialSource);
}

export function isSocialSourceInUrl(sourceInUrl?: SourceInURL): sourceInUrl is SocialSourceInURL {
    if (!sourceInUrl) return false;
    return SORTED_SOCIAL_SOURCES.some(
        (source) => resolveSourceInUrl(source) === sourceInUrl || resolveSourceInUrlForApi(source) === sourceInUrl,
    );
}

export function isWalletSource(source: string): source is Source.Wallet | Source.WalletMix {
    return [Source.Wallet, Source.WalletMix].includes(source as Source.Wallet | Source.WalletMix);
}
