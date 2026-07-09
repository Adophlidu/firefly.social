import { Redis } from '@upstash/redis';

// Dedicated short-link database (never-expire records; eviction disabled).
// The internet-facing redirect route reads with the read-only token; the
// write token is reserved for the registration server action.
export const shortLinkRedisReader = new Redis({
    url: process.env.SHORT_LINK_KV_REST_API_URL!,
    token: process.env.SHORT_LINK_KV_REST_API_READ_ONLY_TOKEN!,
    // upstash/redis defaults fetch's `cache` option to `no-store`; Next.js recommends `default`.
    cache: 'default',
});

export const shortLinkRedisWriter = new Redis({
    url: process.env.SHORT_LINK_KV_REST_API_URL!,
    token: process.env.SHORT_LINK_KV_REST_API_TOKEN!,
    cache: 'default',
});
