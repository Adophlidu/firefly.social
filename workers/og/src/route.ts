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
    )
    // Legacy compatibility: before the split, `/og` accepted url | urls | cache-urls on the base
    // path. Kept so existing `/og?url=` / `/og?urls=` / `/og?cache-urls=` callers keep working.
    .get('/', async (c) => {
        const url = c.req.query('url');
        const urls = c.req.query('urls');
        const cacheUrls = c.req.query('cache-urls');

        if (url !== undefined) {
            const list = url
                .split(',')
                .map((u) => u.trim())
                .filter(Boolean);
            if (list.length === 0)
                return c.json({ success: false, error: { code: 40001, message: 'At least one URL is required' } }, 400);
            if (list.length > 1)
                return c.json(
                    {
                        success: false,
                        error: {
                            code: 40001,
                            message: 'url parameter only supports a single URL. Use urls parameter for multiple URLs.',
                        },
                    },
                    400,
                );
            const resolved = await resolveTcoLink(list[0], c);
            const result = await classifyLink(decodeURIComponent(resolved), c);
            return c.json({ success: true, data: result });
        }

        const value = urls ?? cacheUrls;
        if (value !== undefined) {
            const hasContent = value
                .split(',')
                .map((u) => u.trim())
                .some(Boolean);
            if (!hasContent)
                return c.json({ success: false, error: { code: 40001, message: 'At least one URL is required' } }, 400);
            const results = await classifyUrls(value, c, cacheUrls !== undefined);
            return c.json({ success: true, data: results });
        }

        return c.json(
            { success: false, error: { code: 40001, message: 'url, urls or cache-urls query is required' } },
            400,
        );
    });

export { OgRoute };
