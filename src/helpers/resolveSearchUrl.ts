import urlcat from 'urlcat';

import { CommunityType, SearchType, Source } from '@/constants/enum.js';
import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';

const TYPES_WITHOUT_SOURCE = [SearchType.Profiles, SearchType.NFTs, SearchType.Tokens];

function resolveCommunityType(source: Source, communityType?: CommunityType) {
    if (communityType) return communityType;

    switch (source) {
        case Source.Farcaster:
            return CommunityType.FarcasterChannel;
        case Source.Lens:
            return CommunityType.LensGroup;
        case Source.Bsky:
            return CommunityType.BskyFeed;
        default:
            return communityType || CommunityType.FarcasterChannel;
    }
}

export function resolveSearchUrl(query: string, type?: SearchType, source?: Source, communityType?: CommunityType) {
    // TODO: Support search articles
    const resolvedSource = !source || source === Source.Article ? Source.Farcaster : source;
    const resolvedType = type === SearchType.Channels ? SearchType.Communities : type || SearchType.Posts;

    if (resolvedType === SearchType.Communities) {
        return urlcat('/search/:type/:communityType', {
            type: resolvedType,
            communityType: resolveCommunityType(resolvedSource, communityType),
            q: query,
        });
    }

    const ignoreSource = TYPES_WITHOUT_SOURCE.includes(resolvedType);
    return urlcat(ignoreSource ? '/search/:type' : '/search/:source/:type', {
        type: resolvedType,
        q: query,
        source: ignoreSource ? undefined : resolveSourceInUrl(resolvedSource),
    });
}
