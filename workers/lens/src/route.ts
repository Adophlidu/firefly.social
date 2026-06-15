import { FIVE_MINUTES } from '@dimensiondev/workers-shared/constants/duration.js';
import { compact } from '@dimensiondev/workers-shared/helpers/compact.js';
import {
    createSuccessResponseJson,
    createZodErrorResponseJson,
} from '@dimensiondev/workers-shared/helpers/createResponseJson.js';
import { fetchJsonNoCache } from '@dimensiondev/workers-shared/helpers/fetchJsonNoCache.js';
import { withCache } from '@dimensiondev/workers-shared/middlewares/withCache.js';
import { withErrorHandler } from '@dimensiondev/workers-shared/middlewares/withErrorHandler.js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { getLensGroupsData } from '@/lens/src/getLensGroupData.js';
import type { ChannelWithOwner, ExploreClubsData, OrbClub, TrendingClubsResponse } from '@/lens/src/types.js';

interface Env {
    LENS_CLUBS_CACHE: KVNamespace;
    KV: KVNamespace;
}

const VERSION = 1;

const QuerySchema = z.object({
    category: z.string().optional().default('TRENDING_CLUBS'),
    skip: z
        .string()
        .optional()
        .transform((val) => (val ? Number.parseInt(val, 10) : 0)),
    limit: z
        .string()
        .optional()
        .transform((val) => (val ? Number.parseInt(val, 10) : 20)),
});

function getCacheKey(category: string, skip: number, limit: number) {
    return `lens:${VERSION}:trending-clubs:${category}:${skip}:${limit}`;
}

// Call Orb API directly with authentication from KV
async function fetchOrbClubs(
    category: string,
    skip: number,
    limit: number,
    kv: KVNamespace | undefined,
): Promise<ExploreClubsData> {
    try {
        const orbApiKey = kv ? await kv.get('_.APIKEY.orb', { type: 'text' }) : undefined;
        if (!orbApiKey) {
            console.error('[fetchOrbClubs] ORB_API_KEY not found in KV');
            return { clubs: [], pageInfo: { hasMore: false } };
        }

        const response = await fetchJsonNoCache<{ data: ExploreClubsData }>('https://orbapi.xyz/explore-clubs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'web-access-token': orbApiKey,
            },
            body: JSON.stringify({
                category,
                skip: String(skip),
                limit: String(limit),
            }),
        });

        return response.data ?? { clubs: [], pageInfo: { hasMore: false } };
    } catch (error) {
        console.error('[fetchOrbClubs] Failed to fetch clubs from Orb API:', error);
        return { clubs: [], pageInfo: { hasMore: false } };
    }
}

function formatChannelFromOrb(club: OrbClub, ownerId?: string): ChannelWithOwner {
    const createdAt = club.stats?.timeCreated ?? 0;

    return {
        id: club.metadata?.address || club.id || '',
        name: club.metadata?.name || '',
        description: club.metadata?.description || '',
        imageUrl: club.metadata?.picture || '',
        followerCount: club.stats?.totalMembers ?? 0,
        timestamp: createdAt,
        ownerId,
    };
}

const LensTrendingClubsRoute = new Hono<{ Bindings: Env }>().get(
    '/trending-clubs',
    zValidator('query', QuerySchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    (c) =>
        withErrorHandler(async () => {
            const result = await withCache<TrendingClubsResponse>({
                context: c,
                ttl: FIVE_MINUTES,
                getKey: () =>
                    getCacheKey(c.req.valid('query').category, c.req.valid('query').skip, c.req.valid('query').limit),
                getCache: () => c.env.LENS_CLUBS_CACHE,
                compute: async () => {
                    const { category, skip, limit } = c.req.valid('query');

                    // Fetch clubs from Orb API directly
                    const orbData = await fetchOrbClubs(category, skip, limit, c.env.KV);

                    // Extract unique addresses that have metadata
                    const clubAddresses = compact(orbData.clubs.map((club) => club.metadata?.address));

                    // Fetch lens group data in parallel
                    let lensGroupsMap: Map<string, { ownerId?: string; memberCount?: number }> = new Map();

                    if (clubAddresses.length > 0) {
                        const lensGroupsData = await getLensGroupsData(clubAddresses);

                        // Create a map of address -> ownerId
                        lensGroupsMap = new Map(
                            lensGroupsData.map((group) => [
                                group.address.toLowerCase(),
                                { ownerId: group.ownerId, memberCount: group.memberCount },
                            ]),
                        );
                    }

                    // Combine Orb data with Lens owner data
                    const clubs: ChannelWithOwner[] = orbData.clubs.map((club) => {
                        const address = club.metadata?.address?.toLowerCase();
                        const lensData = address ? lensGroupsMap.get(address) : undefined;

                        return formatChannelFromOrb(club, lensData?.ownerId);
                    });

                    return {
                        clubs,
                        pageInfo: {
                            hasMore: orbData.pageInfo?.hasMore ?? clubs.length === limit,
                            next: orbData.pageInfo?.next,
                        },
                    };
                },
            });

            return createSuccessResponseJson(result);
        }),
);

export { LensTrendingClubsRoute };
