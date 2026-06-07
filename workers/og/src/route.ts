import { compact } from '@dimensiondev/workers-shared/helpers/compact.js';
import { resolveTcoLink } from '@dimensiondev/workers-shared/helpers/resolveTcoLink.js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { classifyLink } from '@/og/src/classifyLink.js';

interface Bindings {
    OG_CACHE: KVNamespace;
    TCO_CACHE: KVNamespace;
}

async function classifyUrls(urlsString: string, c: Parameters<typeof classifyLink>[1], cacheOnly = false) {
    const urls = urlsString
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean);
    const settled = await Promise.allSettled(
        urls.map(async (url) => {
            const resolved = await resolveTcoLink(url, c);
            const result = await classifyLink(decodeURIComponent(resolved), c, cacheOnly);
            return { url, result };
        }),
    );
    return compact(settled.map((x) => (x.status === 'fulfilled' ? x.value : null)));
}

const OgRoute = new Hono<{ Bindings: Bindings }>()
    .get(
        '/url',
        zValidator('query', z.object({ url: z.string().min(1) }), (result, c) => {
            if (!result.success)
                return c.json({ success: false, error: { code: 40001, message: result.error.message } }, 400);
        }),
        async (c) => {
            const { url } = c.req.valid('query');
            const resolved = await resolveTcoLink(url, c);
            const result = await classifyLink(decodeURIComponent(resolved), c);
            return c.json({ success: true, data: result });
        },
    )
    .get(
        '/urls',
        zValidator('query', z.object({ urls: z.string().min(1) }), (result, c) => {
            if (!result.success)
                return c.json({ success: false, error: { code: 40001, message: result.error.message } }, 400);
        }),
        async (c) => {
            const { urls } = c.req.valid('query');
            const results = await classifyUrls(urls, c);
            return c.json({ success: true, data: results });
        },
    )
    .get(
        '/cache-urls',
        zValidator('query', z.object({ 'cache-urls': z.string().min(1) }), (result, c) => {
            if (!result.success)
                return c.json({ success: false, error: { code: 40001, message: result.error.message } }, 400);
        }),
        async (c) => {
            const urls = c.req.valid('query')['cache-urls'];
            const results = await classifyUrls(urls, c, true);
            return c.json({ success: true, data: results });
        },
    );

export { OgRoute };
