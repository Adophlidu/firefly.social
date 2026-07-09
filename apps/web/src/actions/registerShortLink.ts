'use server';

import { buildDestinationUrl, computeHash, formatShortLink, parseLink } from '@dimensiondev/short-link';

import { resolveShortLinkKey } from '@/helpers/shortLink.js';
import { shortLinkRedisWriter } from '@/libs/ShortLinkRedis.js';

/**
 * Registers a short link for a Firefly post/profile URL, or returns null if
 * the link isn't a recognized post/profile shape. Idempotent: re-registering
 * the same identity is a harmless no-op (nx keeps the original createdAt).
 */
export async function registerShortLink(link: string): Promise<string | null> {
    const identity = parseLink(link);
    if (!identity) return null;

    const hash = await computeHash(identity);
    const record = { url: buildDestinationUrl(identity), createdAt: Date.now() };

    await shortLinkRedisWriter.set(resolveShortLinkKey(hash), record, { nx: true });

    return formatShortLink(hash);
}
