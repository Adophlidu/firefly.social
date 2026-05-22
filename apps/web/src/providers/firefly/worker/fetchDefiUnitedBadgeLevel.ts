import { FIREFLY_WORKER_HOST } from '@dimensiondev/constants/static';
import { DefiUnitedTier, Source } from '@dimensiondev/enums';
import { createBatcher } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { queryClient } from '@/configs/queryClient.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import type { ResponseJson } from '@/types/utility.js';

export type BadgeLevelPlatform = 'eth' | 'twitter' | 'lens' | 'farcaster' | 'account' | 'bsky';

interface BadgeLevelQuery {
    platform: BadgeLevelPlatform;
    id: string;
}

interface BadgeLevelResult {
    level: number;
    platform: string;
    profile_id: string;
}

const PLATFORM_TO_SOURCE: Partial<Record<BadgeLevelPlatform, Source>> = {
    farcaster: Source.Farcaster,
    lens: Source.Lens,
    twitter: Source.Twitter,
    bsky: Source.Bsky,
};

function normalizeQueryId(platform: BadgeLevelPlatform, id: string) {
    return platform === 'eth' ? id.toLowerCase() : id;
}

function makeBadgeLevelKey(platform: BadgeLevelPlatform, id: string) {
    return `${platform}:${normalizeQueryId(platform, id)}`;
}

function toDefiUnitedTier(level: number): DefiUnitedTier | null {
    if (level === DefiUnitedTier.Bronze || level === DefiUnitedTier.Silver || level === DefiUnitedTier.Gold) {
        return level;
    }
    return null;
}

async function fetcher(payloads: BadgeLevelQuery[]): Promise<Record<string, DefiUnitedTier | null>> {
    if (payloads.length === 0) return {};

    const response = await fetchJson<
        ResponseJson<{
            results: BadgeLevelResult[];
        }>
    >(urlcat(FIREFLY_WORKER_HOST, '/unifi-badge-level'), {
        method: 'POST',
        body: JSON.stringify({
            queries: payloads.map((payload) => ({
                platform: payload.platform,
                id: normalizeQueryId(payload.platform, payload.id),
            })),
        }),
    });

    const data = resolveResponseData(response);
    if (!data.results.length) return {};

    return Object.fromEntries(
        data.results.map((result) => [
            makeBadgeLevelKey(result.platform as BadgeLevelPlatform, result.profile_id),
            toDefiUnitedTier(result.level),
        ]),
    );
}

const batchedFetchBadgeLevel = createBatcher<BadgeLevelQuery, DefiUnitedTier | null>(
    'fetchDefiUnitedBadgeLevel',
    fetcher,
    {
        makeKey: (payload) => makeBadgeLevelKey(payload.platform, payload.id),
        size: 100,
        wait: 50,
        onMissing: () => null,
    },
);

function hydrateBadgeLevelCache(platform: BadgeLevelPlatform, id: string, tier: DefiUnitedTier | null | undefined) {
    if (platform === 'eth') {
        queryClient.setQueryData(['defiunited-badge', normalizeQueryId(platform, id)], tier ?? null);
        return;
    }

    const source = PLATFORM_TO_SOURCE[platform];
    if (source) {
        queryClient.setQueryData(['defiunited-badge-profile', source, id], tier ?? null);
    }
}

/**
 * Lookup DefiUnited donation tier by platform and id.
 * Multiple concurrent calls are batched into a single worker request.
 */
export async function fetchDefiUnitedBadgeLevel(
    platform: BadgeLevelPlatform,
    id: string,
): Promise<DefiUnitedTier | null> {
    const tier = await batchedFetchBadgeLevel({ platform, id });
    hydrateBadgeLevelCache(platform, id, tier);
    return tier ?? null;
}
