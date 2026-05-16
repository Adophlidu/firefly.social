import { fetchWithContext } from '@dimensiondev/workers-shared/helpers/fetchWithContext.js';
import { parseUrl } from '@dimensiondev/workers-shared/helpers/parseUrl.js';
import { unescapeHtmlEntities } from '@dimensiondev/workers-shared/helpers/unescapeHtmlEntities.js';
import type { Context } from 'hono';

async function extractEmbedUrl(html: string): Promise<string | null> {
    const embedUrlKeys = ['lens:player', 'og:video:url', 'og:video:secure_url', 'twitter:player'];
    let embedUrl: string | null = null;

    const rewriter = new HTMLRewriter().on('meta', {
        element(el) {
            if (embedUrl) return;
            const name = el.getAttribute('name') || el.getAttribute('property');
            const content = el.getAttribute('content');
            if (!name || !content) return;
            if (embedUrlKeys.includes(name)) {
                embedUrl = content;
            }
        },
    });

    await rewriter.transform(new Response(html)).text();

    return embedUrl ? unescapeHtmlEntities(embedUrl) : null;
}

export async function getEmbedUrl(url: string, c: Context): Promise<string | null> {
    const parsedUrl = parseUrl(url);
    if (!parsedUrl) return null;

    try {
        const response = await fetchWithContext(parsedUrl, {
            headers: {
                'User-Agent': 'Twitterbot',
            },
            context: c,
        });

        if (!response.ok) {
            return null;
        }

        const html = await response.text();
        return await extractEmbedUrl(html);
    } catch (error) {
        console.error(`[getEmbedUrl] Failed to fetch embedUrl for ${url}:`, error);
        return null;
    }
}
