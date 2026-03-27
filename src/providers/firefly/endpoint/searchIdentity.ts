import { EMPTY_LIST } from '@dimensiondev/constants';
import { uniq } from 'lodash-es';
import urlcat from 'urlcat';

import { type SocialSource, type SourceInURL } from '@/constants/enum.js';
import { createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { resolveSourceInUrlForApi } from '@/helpers/resolveSourceInUrl.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type SearchProfileResponse } from '@/providers/types/Firefly.js';
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
    web3Platforms?: string[];
    size?: number;
    indicator?: PageIndicator;
    signal?: AbortSignal;
}

export async function searchIdentity(
    keyword: string,
    { platforms, excludes, web3Platforms, size = 100, indicator, signal }: Options = {},
) {
    let sources: SourceInURL[] = EMPTY_LIST;
    if (platforms?.length) {
        sources = platforms.map((x) => resolveSourceInUrlForApi(x));
    }
    if (excludes?.length) {
        const excluded = excludes.map((x) => resolveSourceInUrlForApi(x));
        sources = sources.length
            ? sources.filter((x) => !excluded.includes(x))
            : (allWeb3Platforms.filter((x) => !excluded.includes(x as SourceInURL)) as SourceInURL[]);
    }
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/search/identity', {
        keyword,
        size,
        cursor: indicator?.id,
        platform:
            uniq([
                ...(sources.length && sources.length !== allWeb3Platforms.length ? sources : []),
                ...(web3Platforms || []),
            ]).join(',') || undefined,
    });
    const response = await fireflySessionHolder.fetch<SearchProfileResponse>(url, {
        signal,
    });
    const data = resolveFireflyResponseData(response);
    return createPageable(
        data.list || EMPTY_LIST,
        indicator,
        data.cursor && data.list?.length ? createNextIndicator(indicator, `${data.cursor}`) : undefined,
    );
}
