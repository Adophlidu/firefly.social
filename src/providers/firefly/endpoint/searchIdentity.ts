import urlcat from 'urlcat';

import { type SocialSource, SourceInURL } from '@/constants/enum.js';
import { createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { resolveSourceInUrlForApi } from '@/helpers/resolveSourceInUrl.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { SearchProfileResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

const allWeb3Platforms = [
    'lens',
    'ens',
    'base.eth',
    'sns',
    'twitter',
    'farcaster',
    'eth',
    'solana',
    'bsky',
    'account',
    'seekerid',
];

interface Options {
    platforms?: SocialSource[];
    excludes?: SocialSource[];
    size?: number;
    indicator?: PageIndicator;
    signal?: AbortSignal;
}

export async function searchIdentity(
    keyword: string,
    { platforms, excludes, size = 100, indicator, signal }: Options = {},
) {
    let platform: string | undefined = undefined;
    let sources: SourceInURL[] = [];
    if (platforms?.length) {
        sources = platforms.map((x) => resolveSourceInUrlForApi(x));
    }
    if (excludes?.length) {
        const excluded = excludes.map((x) => resolveSourceInUrlForApi(x));
        sources = sources.length
            ? sources.filter((x) => !excluded.includes(x))
            : (allWeb3Platforms.filter((x) => !excluded.includes(x as SourceInURL)) as SourceInURL[]);
    }
    if (sources.length && sources.length !== allWeb3Platforms.length) {
        platform = sources.join(',');
    }
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/search/identity', {
        keyword,
        size,
        cursor: indicator?.id,
        platform,
    });
    const response = await fireflySessionHolder.fetch<SearchProfileResponse>(url, {
        method: 'GET',
        signal,
    });
    const data = resolveFireflyResponseData(response);
    return createPageable(
        data.list || [],
        indicator,
        data.cursor && data.list?.length ? createNextIndicator(indicator, `${data.cursor}`) : undefined,
    );
}
