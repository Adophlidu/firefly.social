import { DefiUnitedTier, Source } from '@dimensiondev/enums';
import { createBatcher } from '@dimensiondev/utils';
import { unifiBadgeLevelWorker } from '@dimensiondev/workers-client';

import { queryClient } from '@/configs/queryClient.js';
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
    token_symbol?: string;
    token_amount?: string;
}

export interface DefiUnitedBadgeInfo {
    tier: DefiUnitedTier;
    symbol?: string;
    amount?: string;
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

async function fetcher(payloads: BadgeLevelQuery[]): Promise<Record<string, DefiUnitedBadgeInfo | null>> {
    if (payloads.length === 0) return {};

    const res = await unifiBadgeLevelWorker['unifi-badge-level'].$post({
        json: {
            queries: payloads.map((payload) => ({
                platform: payload.platform,
                id: normalizeQueryId(payload.platform, payload.id),
            })),
        },
    });
    const response = (await res.json()) as ResponseJson<{
        results: BadgeLevelResult[];
    }>;

    const data = resolveResponseData(response);
    if (!data.results.length) return {};

    return Object.fromEntries(
        data.results.map((result) => {
            const tier = toDefiUnitedTier(result.level);
            return [
                makeBadgeLevelKey(result.platform as BadgeLevelPlatform, result.profile_id),
                tier !== null ? { tier, symbol: result.token_symbol, amount: result.token_amount } : null,
            ];
        }),
    );
}

const batchedFetchBadgeLevel = createBatcher<BadgeLevelQuery, DefiUnitedBadgeInfo | null>(
    'fetchDefiUnitedBadgeLevel',
    fetcher,
    {
        makeKey: (payload) => makeBadgeLevelKey(payload.platform, payload.id),
        size: 100,
        wait: 50,
        onMissing: () => null,
    },
);

function hydrateBadgeLevelCache(
    platform: BadgeLevelPlatform,
    id: string,
    info: DefiUnitedBadgeInfo | null | undefined,
) {
    if (platform === 'eth') {
        queryClient.setQueryData(['defiunited-badge', normalizeQueryId(platform, id)], info ?? null);
        return;
    }

    const source = PLATFORM_TO_SOURCE[platform];
    if (source) {
        queryClient.setQueryData(['defiunited-badge-profile', source, id], info ?? null);
    }
}

/**
 * Lookup DefiUnited donation tier by platform and id.
 * Multiple concurrent calls are batched into a single worker request.
 */
export async function fetchDefiUnitedBadgeLevel(
    platform: BadgeLevelPlatform,
    id: string,
): Promise<DefiUnitedBadgeInfo | null> {
    const info = await batchedFetchBadgeLevel({ platform, id });
    hydrateBadgeLevelCache(platform, id, info);
    return info ?? null;
}
