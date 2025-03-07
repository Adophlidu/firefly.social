import {
    type BookmarkSource,
    type DiscoverSource,
    type ProfilePageSource,
    type SocialDiscoverSource,
    type SocialSource,
    type SocialSourceInURL,
    Source,
    SourceInURL,
} from '@/constants/enum.js';
import {
    BOOKMARK_SOURCES,
    DISCOVER_SOURCES,
    SOCIAL_DISCOVER_SOURCE,
    SORTED_PROFILE_SOURCES,
    SORTED_SOCIAL_SOURCES,
} from '@/constants/index.js';
import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';

export function isDiscoverSource(source: string): source is DiscoverSource {
    return (DISCOVER_SOURCES as string[]).includes(source);
}

export function isSocialDiscoverSource(source: string): source is SocialDiscoverSource {
    return SOCIAL_DISCOVER_SOURCE.includes(source as SocialDiscoverSource);
}

export function isBookmarkSource(source: string): source is BookmarkSource {
    return BOOKMARK_SOURCES.includes(source as BookmarkSource);
}

export function isProfilePageSource(source: string): source is ProfilePageSource {
    return SORTED_PROFILE_SOURCES.includes(source as ProfilePageSource);
}

export function isSocialSource(source?: Source): source is SocialSource {
    if (!source) return false;
    return SORTED_SOCIAL_SOURCES.includes(source as SocialSource);
}

export function isSocialSourceInUrl(sourceInUrl?: SourceInURL): sourceInUrl is SocialSourceInURL {
    if (!sourceInUrl) return false;
    return SORTED_SOCIAL_SOURCES.map(resolveSourceInUrl).includes(sourceInUrl);
}
