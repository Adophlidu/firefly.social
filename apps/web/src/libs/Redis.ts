import { Redis } from '@upstash/redis';

// @vercel/kv is sunset; talk to the same Upstash-backed KV store directly.
// Reads go through the read-only token; the write token is used only by the
// call sites that actually mutate state.
export const redisReader = new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_READ_ONLY_TOKEN!,
    // upstash/redis defaults fetch's `cache` option to `no-store`; Next.js recommends `default`.
    cache: 'default',
});

export const redisWriter = new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
    cache: 'default',
});
