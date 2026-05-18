import { PredictionPlatform, Source } from '@dimensiondev/enums';
import { parseUrl } from '@dimensiondev/utils';

import { SearchType } from '@/constants/enum.js';
import {
    FARCASTER_PROFILE_REGEX,
    HEY_POST_REGEX,
    HEY_PROFILE_REGEX,
    ORB_POST_REGEX,
    ORB_PROFILE_REGEX,
    POLYMARKET_EVENT_REGEX,
    X_PROFILE_REGEX,
} from '@/constants/regexp.js';
import { matchDomainSuffix } from '@/helpers/matchDomainSuffix.js';

export enum SearchUrlKind {
    Post = 'post',
    Profile = 'profile',
    Prediction = 'prediction',
    FireflyInternal = 'firefly_internal',
}

export interface SearchUrlResult {
    kind: SearchUrlKind;
    searchType: SearchType;
    source?: Source;
    platform?: PredictionPlatform;
    identifier?: string;
    secondaryId?: string;
    isMultiple?: boolean;
    internalPath?: string;
}

function resolveTwitterUrl(url: URL): SearchUrlResult | null {
    const tweetMatch = url.pathname.match(/^\/([A-Za-z0-9_]{1,15})\/status\/(\d+)(?:\/.*)?\/?$/);
    if (tweetMatch) {
        return {
            kind: SearchUrlKind.Post,
            searchType: SearchType.Posts,
            source: Source.Twitter,
            identifier: tweetMatch[2],
            secondaryId: tweetMatch[1],
        };
    }

    const twitterWebTweetMatch = url.pathname.match(/^\/i\/web\/status\/(\d+)(?:\/.*)?\/?$/);
    if (twitterWebTweetMatch) {
        return {
            kind: SearchUrlKind.Post,
            searchType: SearchType.Posts,
            source: Source.Twitter,
            identifier: twitterWebTweetMatch[1],
        };
    }

    const profileMatch = url.pathname.match(X_PROFILE_REGEX);
    if (profileMatch) {
        return {
            kind: SearchUrlKind.Profile,
            searchType: SearchType.Profiles,
            source: Source.Twitter,
            identifier: profileMatch[1],
        };
    }

    return null;
}

function resolveFarcasterUrl(url: URL): SearchUrlResult | null {
    const match = url.pathname.match(/^\/([^/]+)\/(0x[a-fA-F0-9]+)\/?$/);
    if (match) {
        return {
            kind: SearchUrlKind.Post,
            searchType: SearchType.Posts,
            source: Source.Farcaster,
            identifier: match[2],
            secondaryId: match[1],
        };
    }

    const profileMatch = url.pathname.match(FARCASTER_PROFILE_REGEX);
    if (profileMatch && !profileMatch[1].startsWith('~')) {
        return {
            kind: SearchUrlKind.Profile,
            searchType: SearchType.Profiles,
            source: Source.Farcaster,
            identifier: profileMatch[1],
        };
    }

    return null;
}

function resolveOrbUrl(url: URL): SearchUrlResult | null {
    const postMatch = url.pathname.match(ORB_POST_REGEX);
    if (postMatch) {
        return {
            kind: SearchUrlKind.Post,
            searchType: SearchType.Posts,
            source: Source.Lens,
            identifier: postMatch[1],
        };
    }

    const profileMatch = url.pathname.match(ORB_PROFILE_REGEX);
    if (profileMatch) {
        return {
            kind: SearchUrlKind.Profile,
            searchType: SearchType.Profiles,
            source: Source.Lens,
            identifier: profileMatch[1],
        };
    }

    return null;
}

function resolveHeyUrl(url: URL): SearchUrlResult | null {
    const postMatch = url.pathname.match(HEY_POST_REGEX);
    if (postMatch) {
        return {
            kind: SearchUrlKind.Post,
            searchType: SearchType.Posts,
            source: Source.Lens,
            identifier: postMatch[1],
        };
    }

    const profileMatch = url.pathname.match(HEY_PROFILE_REGEX);
    if (profileMatch) {
        return {
            kind: SearchUrlKind.Profile,
            searchType: SearchType.Profiles,
            source: Source.Lens,
            identifier: profileMatch[1],
        };
    }

    return null;
}

function resolvePolymarketUrl(url: URL): SearchUrlResult | null {
    const eventMatch = url.pathname.match(POLYMARKET_EVENT_REGEX);
    if (eventMatch) {
        return {
            kind: SearchUrlKind.Prediction,
            searchType: SearchType.Prediction,
            platform: PredictionPlatform.Polymarket,
            identifier: eventMatch[1],
        };
    }

    return null;
}

function resolveOpinionUrl(url: URL): SearchUrlResult | null {
    if (/^\/detail\/?$/.test(url.pathname)) {
        const topicId = url.searchParams.get('topicId');
        if (topicId) {
            const type = url.searchParams.get('type');
            const multiFlag = (url.searchParams.get('isMulti') || url.searchParams.get('isMutil') || '').toLowerCase();
            return {
                kind: SearchUrlKind.Prediction,
                searchType: SearchType.Prediction,
                platform: PredictionPlatform.Opinion,
                identifier: topicId,
                isMultiple: type === 'multi' || multiFlag === '1' || multiFlag === 'true',
            };
        }
    }

    return null;
}

function resolveFireflyUrl(url: URL): SearchUrlResult | null {
    return {
        kind: SearchUrlKind.FireflyInternal,
        searchType: SearchType.Posts,
        internalPath: url.pathname + url.search + url.hash,
    };
}

/**
 * Detect if the input is a known platform URL and return parsed result.
 * Returns null if the input is not a recognized URL.
 */
export function resolveSearchUrlType(input: string): SearchUrlResult | null {
    const trimmed = input.trim();
    const url = parseUrl(trimmed);
    if (!url) return null;
    if (!/^https?:$/i.test(url.protocol)) return null;

    const normalizedUrl = url.href;

    if (matchDomainSuffix(normalizedUrl, 'x.com') || matchDomainSuffix(normalizedUrl, 'twitter.com')) {
        return resolveTwitterUrl(url);
    }

    if (matchDomainSuffix(normalizedUrl, 'farcaster.xyz')) {
        return resolveFarcasterUrl(url);
    }

    if (matchDomainSuffix(normalizedUrl, 'orb.club')) {
        return resolveOrbUrl(url);
    }

    if (matchDomainSuffix(normalizedUrl, 'hey.xyz')) {
        return resolveHeyUrl(url);
    }

    if (matchDomainSuffix(normalizedUrl, 'polymarket.com')) {
        return resolvePolymarketUrl(url);
    }

    if (matchDomainSuffix(normalizedUrl, 'app.opinion.trade')) {
        return resolveOpinionUrl(url);
    }

    if (matchDomainSuffix(normalizedUrl, 'firefly.social') || matchDomainSuffix(normalizedUrl, 'firefly.land')) {
        return resolveFireflyUrl(url);
    }

    return null;
}
