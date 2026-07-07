import { ONE_DAY } from '@dimensiondev/workers-shared/constants/duration.js';
import { withCache } from '@dimensiondev/workers-shared/middlewares/withCache.js';
import type { Context } from 'hono';

import { fetchBadgeLevel } from '@/unifi-badge-level/src/fetchBadgeLevel.js';
import type { BadgeLevelQuery, BadgeLevelResult } from '@/unifi-badge-level/src/types.js';

const CACHE_VERSION = 2;

function getCacheKey(platform: string, id: string) {
    return `unifi-badge-level:${CACHE_VERSION}:${platform}:${id}`;
}

function dedupeQueries(queries: BadgeLevelQuery[]): BadgeLevelQuery[] {
    const seen = new Set<string>();
    const unique: BadgeLevelQuery[] = [];

    for (const query of queries) {
        const key = `${query.platform}:${query.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push(query);
    }

    return unique;
}

async function fetchBadgeLevelCached(query: BadgeLevelQuery, c: Context): Promise<BadgeLevelResult> {
    return withCache({
        context: c,
        ttl: ONE_DAY,
        getKey: () => getCacheKey(query.platform, query.id),
        getCache: () => c.env.UNIFI_BADGE_LEVEL_CACHE,
        compute: () => fetchBadgeLevel(query, c),
    });
}

export async function fetchBadgeLevels(queries: BadgeLevelQuery[], c: Context): Promise<BadgeLevelResult[]> {
    const uniqueQueries = dedupeQueries(queries);
    if (uniqueQueries.length === 0) return [];

    const settled = await Promise.allSettled(uniqueQueries.map((query) => fetchBadgeLevelCached(query, c)));

    return settled.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
}
