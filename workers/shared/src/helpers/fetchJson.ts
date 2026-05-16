import type { Context } from 'hono';

import { fetchWithContext } from '@/shared/src/helpers/fetchWithContext.js';

export async function fetchJson<T = unknown>(
    input: RequestInfo | URL,
    init: RequestInit & { context: Context },
): Promise<T> {
    const response = await fetchWithContext(input, init);
    return response.json();
}
