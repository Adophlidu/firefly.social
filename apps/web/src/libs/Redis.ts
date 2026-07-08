import { Redis } from '@upstash/redis';

// @vercel/kv is sunset; talk to the same Upstash-backed KV store directly.
export const redis = new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
    // upstash/redis defaults fetch's `cache` option to `no-store`; Next.js recommends `default`.
    cache: 'default',
});
