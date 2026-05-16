import { createHash } from 'node:crypto';

import { ONE_HOUR, ONE_MONTH } from '@dimensiondev/workers-shared/constants/duration.js';
import {
    createSuccessResponseJson,
    createZodErrorResponseJson,
} from '@dimensiondev/workers-shared/helpers/createResponseJson.js';
import { withCache } from '@dimensiondev/workers-shared/middlewares/withCache.js';
import { withErrorHandler } from '@dimensiondev/workers-shared/middlewares/withErrorHandler.js';
import { HttpUrl } from '@dimensiondev/workers-shared/schemas/HttpSchema.js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { getProposals } from '@/snapshot/src/getProposals.js';
import { getSnapshotFromUrl } from '@/snapshot/src/getSnapshotFromUrl.js';
import { getVotePower } from '@/snapshot/src/getVotePower.js';
import { getVotesById } from '@/snapshot/src/getVotesById.js';
import { pathQueryVoteResultsByVoter } from '@/snapshot/src/pathQueryVoteResultsByVoter.js';
import type { SnapshotStrategy } from '@/snapshot/src/types.js';

const VERSION = 1;

const SnapshotRoute = new Hono<{ Bindings: { SNAPSHOT_CACHE: KVNamespace; KV: KVNamespace } }>();

const KV_KEY_MAX_LENGTH = 512;

function normalizeKey(key: string) {
    if (key.length <= KV_KEY_MAX_LENGTH) return key;
    const hash = createHash('sha256').update(key).digest('hex');
    return `${key.slice(0, Math.max(0, KV_KEY_MAX_LENGTH - hash.length - 1))}:${hash}`;
}

function getCacheKey(prefix: string, ...parts: Array<string | number>): string {
    const rawKey = `snapshot:${VERSION}:${prefix}:${parts.join(':')}`;
    return normalizeKey(rawKey);
}

const UrlSchema = z.object({
    url: HttpUrl,
});

const ProposalsSchema = z.object({
    ids: z.string().transform((val) => val.split(',').filter(Boolean)),
});

const VotesSchema = z.object({
    id: z.string(),
    skip: z.coerce.number().optional().default(0),
    first: z.coerce.number().optional().default(20),
});

const VotePowerSchema = z.object({
    address: z.string(),
    network: z.string(),
    strategies: z.string().transform((val) => JSON.parse(val) as SnapshotStrategy[]),
    snapshot: z.union([z.coerce.number(), z.literal('latest')]),
    space: z.string(),
    delegation: z.coerce.boolean().optional().default(false),
});

const VoteResultsByVoterSchema = z.object({
    ids: z.string().transform((val) => val.split(',').filter(Boolean)),
    voter: z.string(),
    skip: z.coerce.number().optional().default(0),
    first: z.coerce.number().optional().default(20),
});

SnapshotRoute.get(
    '/',
    zValidator('query', UrlSchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    async (c) =>
        withErrorHandler(async () => {
            const { url } = c.req.valid('query');
            const result = await withCache({
                context: c,
                ttl: ONE_MONTH,
                getKey: () => getCacheKey('url', encodeURIComponent(url)),
                getCache: () => c.env.SNAPSHOT_CACHE,
                compute: async () => getSnapshotFromUrl(url, c),
            });
            return createSuccessResponseJson(result);
        }),
);

SnapshotRoute.get(
    '/proposals',
    zValidator('query', ProposalsSchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    async (c) =>
        withErrorHandler(async () => {
            const { ids } = c.req.valid('query');
            const cacheKey = getCacheKey('proposals', ids.join(','));
            const result = await withCache({
                context: c,
                ttl: ONE_HOUR,
                getKey: () => cacheKey,
                getCache: () => c.env.SNAPSHOT_CACHE,
                compute: async () => getProposals(ids, c),
            });
            return createSuccessResponseJson(result);
        }),
);

SnapshotRoute.get(
    '/votes',
    zValidator('query', VotesSchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    async (c) =>
        withErrorHandler(async () => {
            const { id, skip, first } = c.req.valid('query');
            const cacheKey = getCacheKey('votes', id, skip, first);
            const result = await withCache({
                context: c,
                ttl: ONE_HOUR,
                getKey: () => cacheKey,
                getCache: () => c.env.SNAPSHOT_CACHE,
                compute: async () => getVotesById(id, c, skip, first),
            });
            return createSuccessResponseJson(result);
        }),
);

SnapshotRoute.get(
    '/vote-power',
    zValidator('query', VotePowerSchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    async (c) =>
        withErrorHandler(async () => {
            const { address, network, strategies, snapshot, space, delegation } = c.req.valid('query');
            const snapshotStr = typeof snapshot === 'number' ? snapshot.toString() : snapshot;
            const cacheKey = getCacheKey('vote-power', address, network, snapshotStr, space, delegation.toString());
            const result = await withCache({
                context: c,
                ttl: ONE_HOUR,
                getKey: () => cacheKey,
                getCache: () => c.env.SNAPSHOT_CACHE,
                compute: async () => getVotePower(address, network, strategies, snapshot, space, delegation, c),
            });
            return createSuccessResponseJson(result);
        }),
);

SnapshotRoute.get(
    '/vote-results',
    zValidator('query', VoteResultsByVoterSchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    async (c) =>
        withErrorHandler(async () => {
            const { ids, voter, skip, first } = c.req.valid('query');
            const cacheKey = getCacheKey('vote-results', ids.join(','), voter, skip, first);
            const result = await withCache({
                context: c,
                ttl: ONE_HOUR,
                getKey: () => cacheKey,
                getCache: () => c.env.SNAPSHOT_CACHE,
                compute: async () => pathQueryVoteResultsByVoter(ids, voter, c, skip, first),
            });
            return createSuccessResponseJson(result);
        }),
);

export { SnapshotRoute };
