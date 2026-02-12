import urlcat from 'urlcat';

import { ClubType, SearchType, Source } from '@/constants/enum.js';
import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';

const TYPES_WITHOUT_SOURCE = [SearchType.Profiles, SearchType.NFTs, SearchType.Tokens, SearchType.Prediction];

function resolveClubType(source: Source, clubType?: ClubType) {
    if (clubType) return clubType;

    switch (source) {
        case Source.Farcaster:
            return ClubType.FarcasterChannel;
        case Source.Lens:
            return ClubType.LensGroup;
        case Source.Bsky:
            return ClubType.BskyFeed;
        default:
            return clubType || ClubType.FarcasterChannel;
    }
}

export function resolveSearchUrl(query: string, type?: SearchType, source?: Source, clubType?: ClubType) {
    // TODO: Support search articles
    const resolvedSource = !source || source === Source.Article ? Source.Twitter : source;
    const resolvedType = type === SearchType.Channels ? SearchType.Clubs : type || SearchType.Posts;

    if (resolvedType === SearchType.Clubs) {
        return urlcat('/search/:type/:clubType', {
            type: resolvedType,
            clubType: resolveClubType(resolvedSource, clubType),
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
