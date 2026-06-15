import { ONE_HOUR } from '@dimensiondev/workers-shared/constants/duration.js';
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

import { digestSnapUrl } from '@/snap/src/digestSnapUrl.js';
import { handleSnapV1 } from '@/snap/src/handlers/handleSnapV1.js';
import { handleSnapV2 } from '@/snap/src/handlers/handleSnapV2.js';

const VERSION = 1;

const GetQuerySchema = z.object({
    link: z.url('Invalid URL format'),
});

const PostQuerySchema = z.object({
    url: HttpUrl,
    target: HttpUrl,
});

const PostBodyV1Schema = z.object({
    profileId: z.string(),
    token: z.string(),
    payload: z.object({
        fid: z.number(),
        button_index: z.number(),
        nonce: z.string().optional(),
        inputs: z.record(z.string(), z.unknown()),
        timestamp: z.number(),
    }),
});

const PostBodyV2Schema = z.object({
    profileId: z.string(),
    token: z.string(),
    payload: z
        .object({
            audience: HttpUrl,
            user: z.object({
                fid: z.number(),
            }),
            surface: z.union([z.string(), z.record(z.string(), z.unknown())]),
            fid: z.number().optional(),
            nonce: z.string().optional(),
            inputs: z.record(z.string(), z.unknown()),
            timestamp: z.number(),
        })
        .passthrough()
        .refine((payload) => payload.fid === undefined || payload.fid === payload.user.fid, {
            message: 'payload.fid must equal payload.user.fid when provided',
            path: ['fid'],
        }),
});

function getCacheKey(link: string) {
    return `snap:${VERSION}:${encodeURIComponent(link)}`;
}

// GET /snap?link={url} — fetch & cache snap response
const SnapRoute = new Hono<{ Bindings: { SNAP_CACHE: KVNamespace; TCO_CACHE: KVNamespace } }>()
    .get(
        '/',
        zValidator('query', GetQuerySchema, (result) => {
            if (!result.success) return createZodErrorResponseJson(result.error, { status: 400 });
        }),
        (c) =>
            withErrorHandler(async () => {
                const { link } = c.req.valid('query');

                const linkDigested = await withCache({
                    context: c,
                    ttl: ONE_HOUR, // snaps are dynamic; cache for 1 hour only
                    getKey: () => getCacheKey(link),
                    getCache: () => c.env.SNAP_CACHE,
                    isValidCache: (result) => !!result.snap,
                    compute: async () => {
                        const result = await digestSnapUrl(decodeURIComponent(link), c);
                        if (!result) throw new Error(`Not a snap: ${link}`);
                        return result;
                    },
                });

                return createSuccessResponseJson(linkDigested);
            }),
    )
    .post(
        '/v1',
        zValidator('query', PostQuerySchema, (result) => {
            if (!result.success) return createZodErrorResponseJson(result.error, { status: 400 });
        }),
        zValidator('json', PostBodyV1Schema, (result) => {
            if (!result.success) return createZodErrorResponseJson(result.error, { status: 400 });
        }),
        (c) => withErrorHandler(async () => handleSnapV1(c)),
    )
    .post(
        '/v2',
        zValidator('query', PostQuerySchema, (result) => {
            if (!result.success) return createZodErrorResponseJson(result.error, { status: 400 });
        }),
        zValidator('json', PostBodyV2Schema, (result) => {
            if (!result.success) return createZodErrorResponseJson(result.error, { status: 400 });
        }),
        (c) => withErrorHandler(async () => handleSnapV2(c)),
    );

export { SnapRoute };
