import { fetchWithContext } from '@dimensiondev/workers-shared/helpers/fetchWithContext.js';
import { parseUrl } from '@dimensiondev/workers-shared/helpers/parseUrl.js';
import { unescapeHtmlEntities } from '@dimensiondev/workers-shared/helpers/unescapeHtmlEntities.js';
import { digestImageUrl } from '@dimensiondev/workers-sizeof/digestImageUrl.js';
import type { Context } from 'hono';

import type { LinkDigested, OpenGraph } from '@/oembed/src/types.js';

/**
 * URL patterns to ignore when digesting documents
 * Each pattern should match the full URL (hostname + pathname)
 */
const IGNORED_URL_PATTERNS = [
    // Farcaster channel URLs (format: https://farcaster.xyz/~/c/chain:address)
    // Examples: /~/c/bsc:0x..., /~/c/eth:0x..., /~/c/base:0x...
    {
        hostname: 'farcaster.xyz',
        pathname: /^\/~\/c\/[\w:]+$/,
    },
] as const;

/**
 * Extract OpenGraph and related metadata from HTML using HTMLRewriter (Cloudflare Workers).
 * @param html The HTML string to parse
 * @param documentUrl The original document URL (for fallback hostname)
 * @returns Promise resolving to an object with metadata fields
 */
async function parseOpenGraphMetadata(html: string) {
    const metaKeys = {
        title: ['lens:title', 'og:title', 'twitter:title'],
        description: ['lens:description', 'og:description', 'twitter:description', 'description'],
        site: ['lens:site', 'og:site_name', 'twitter:site'],
        image: ['lens:image', 'og:image', 'twitter:image', 'twitter:image:src'],
        embedUrl: ['lens:player', 'og:video:url', 'og:video:secure_url', 'twitter:player'],
        lensCard: ['lens:card'],
        twitterCard: ['twitter:card'],
    };

    const metadata: {
        title?: string;
        description?: string;
        site?: string;
        image?: string;
        embedUrl?: string;
        lensCard?: string;
        twitterCard?: string;
        titleTag?: string;
    } = {};

    const rewriter = new HTMLRewriter()
        .on('meta', {
            element(el) {
                const name = el.getAttribute('name') || el.getAttribute('property');
                const content = el.getAttribute('content');
                if (!name || !content) return;
                if (!metadata.title) {
                    if (metaKeys.title.includes(name)) metadata.title = content;
                }
                if (!metadata.description) {
                    if (metaKeys.description.includes(name)) metadata.description = content;
                }
                if (!metadata.site) {
                    if (metaKeys.site.includes(name)) metadata.site = content;
                }
                if (!metadata.image) {
                    if (metaKeys.image.includes(name)) metadata.image = content;
                }
                if (!metadata.embedUrl) {
                    if (metaKeys.embedUrl.includes(name)) metadata.embedUrl = content;
                }
                if (!metadata.lensCard && metaKeys.lensCard.includes(name)) {
                    metadata.lensCard = content;
                }
                if (!metadata.twitterCard && metaKeys.twitterCard.includes(name)) {
                    metadata.twitterCard = content;
                }
            },
        })
        .on('title', {
            text(txt: { text: string }) {
                if (!metadata.title) {
                    metadata.titleTag = (metadata.titleTag || '') + txt.text;
                }
            },
        });

    await rewriter.transform(new Response(html)).text();

    return Object.fromEntries(Object.entries(metadata).map(([key, value]) => [key, unescapeHtmlEntities(value)]));
}

/**
 * Check if a URL should be ignored based on the IGNORED_URL_PATTERNS
 */
function shouldIgnoreUrl(url: URL): boolean {
    return IGNORED_URL_PATTERNS.some((pattern) => {
        if (url.hostname !== pattern.hostname) return false;
        return pattern.pathname.test(url.pathname);
    });
}

export async function digestDocumentUrl(documentUrl: string, c: Context): Promise<LinkDigested | null> {
    const url = parseUrl(documentUrl);
    if (!url) return null;

    if (shouldIgnoreUrl(url)) return null;

    const headers: Record<string, string> = {
        'User-Agent': 'Twitterbot',
    };

    const response = await fetchWithContext(url, {
        headers,
        context: c,
    });
    if (!response.ok || (response.status >= 500 && response.status < 600)) {
        const text = await response.text();
        console.error(`[oembed] url: ${url}, response status: ${response.status}\n`, text);
        return null;
    }

    const html = await response.text();
    const metadata = await parseOpenGraphMetadata(html);

    const largeTypes = ['summary_large_image', 'player'];
    const isLarge =
        !!(metadata.lensCard && largeTypes.includes(metadata.lensCard)) ||
        !!(metadata.twitterCard && largeTypes.includes(metadata.twitterCard));

    const imageUrl = metadata.image;
    const imageDigested = imageUrl && URL.canParse(imageUrl) ? await digestImageUrl(imageUrl, c) : null;

    const og = {
        type: 'website',
        url: url.href,
        favicon: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url.href)}&sz=128`,
        title: metadata.title || metadata.titleTag || '',
        description: metadata.description || null,
        site: metadata.site || null,
        isLarge,
        html: null,
        locale: null,
        image:
            imageDigested && imageUrl
                ? {
                      url: imageUrl,
                      width: imageDigested.width,
                      height: imageDigested.height,
                  }
                : null,
    } satisfies OpenGraph;

    return {
        og,
    };
}
