import { EMPTY_LIST } from '@dimensiondev/constants';
import { compact } from 'lodash-es';

import { type SocialSource } from '@/constants/enum.js';
import { composeSearchProfiles, formatSearchProfile, sortSearchProfiles } from '@/helpers/formatSearchProfile.js';
import { createIndicator, type PageIndicator } from '@/helpers/pageable.js';
import { searchBskyProfiles } from '@/providers/bsky/searchBskyProfiles.js';
import { searchIdentity } from '@/providers/firefly/endpoint/searchIdentity.js';
import { searchLensProfiles } from '@/providers/lens/searchLensProfiles.js';
import { twitterSocialMediaProxy } from '@/providers/twitter/SocialMedia.js';

export function formatTwitterSearchKeyword(input: string) {
    if (!input?.trim()) return;

    return input
        .replace(/[^A-Za-z0-9_'\s]/g, '')
        .trim()
        .replace(/\s+/g, ' ');
}

interface SearchProfilesOptions {
    keyword: string;
    signal?: AbortSignal;
    /** searchIdentity request size */
    identitySize?: number;
    /** Twitter search result size */
    twitterSize?: number;
    /** Bsky search result size */
    bskySize?: number;
    /** Lens search result size */
    lensSize?: number;
    /** Limit Firefly identity search to specific sources */
    platforms?: SocialSource[];
    /** Exclude specific sources from Firefly identity search */
    excludes?: SocialSource[];
    /** Pagination indicators (for SearchProfileContent) */
    indicators?: {
        firefly?: PageIndicator;
        twitter?: PageIndicator;
        bsky?: PageIndicator;
        lens?: PageIndicator;
    };
    /** Skip specific sources (for pagination) */
    skip?: {
        firefly?: boolean;
        twitter?: boolean;
        bsky?: boolean;
        lens?: boolean;
    };
}

/**
 * Unified profile search across Firefly, Twitter, Bsky, and Lens sources.
 * Returns formatted, composed, and sorted results.
 */
export async function searchProfilesByKeyword(options: SearchProfilesOptions) {
    const {
        keyword,
        signal,
        identitySize = 10,
        twitterSize = 7,
        bskySize = 3,
        lensSize = 5,
        platforms,
        excludes,
        indicators,
        skip,
    } = options;

    const trimmed = formatTwitterSearchKeyword(keyword);

    const [fireflyRes, xRes, bskyRes, lensRes] = await Promise.allSettled([
        !skip?.firefly
            ? searchIdentity(keyword, {
                  signal,
                  size: identitySize,
                  platforms,
                  excludes,
                  indicator: indicators?.firefly,
              })
            : undefined,
        !skip?.twitter && trimmed
            ? twitterSocialMediaProxy.searchProfiles(
                  trimmed,
                  createIndicator(indicators?.twitter, undefined, twitterSize),
              )
            : undefined,
        !skip?.bsky ? searchBskyProfiles(keyword, createIndicator(indicators?.bsky, undefined, bskySize)) : undefined,
        !skip?.lens ? searchLensProfiles(keyword, createIndicator(indicators?.lens, undefined, lensSize)) : undefined,
    ]);

    const fireflyData = fireflyRes.status === 'fulfilled' ? fireflyRes.value : undefined;
    const twitterProfiles = xRes.status === 'fulfilled' ? xRes.value : undefined;
    const bskyProfiles = bskyRes.status === 'fulfilled' ? bskyRes.value : undefined;
    const lensProfiles = lensRes.status === 'fulfilled' ? lensRes.value : undefined;

    const profiles = sortSearchProfiles(
        composeSearchProfiles(
            compact(fireflyData?.data.map((x) => formatSearchProfile(x, keyword))),
            twitterProfiles?.data || EMPTY_LIST,
            bskyProfiles?.data || EMPTY_LIST,
            lensProfiles?.data || EMPTY_LIST,
        ),
        keyword,
    );

    return {
        profiles,
        fireflyData,
        twitterProfiles,
        bskyProfiles,
        lensProfiles,
    };
}
