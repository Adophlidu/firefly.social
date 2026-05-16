import type { Context } from 'hono';

import { fetchJson } from '@/shared/src/helpers/fetchJson.js';

export async function fetchCoinGecko<T>(
    input: RequestInfo | URL,
    init: RequestInit & { context: Context<{ Bindings: { KV: KVNamespace } }> },
) {
    const request = new Request(input);
    const url = new URL(request.url);
    const apiKey = await init.context.env.KV.get('_.APIKEY.coingecko', { type: 'text' });
    if (!apiKey) {
        throw new Error('COINGECKO_API_KEY not found');
    }
    url.searchParams.set('x_cg_pro_api_key', apiKey);
    const patched = new Request(url, request);
    return fetchJson<T>(patched, init);
}
