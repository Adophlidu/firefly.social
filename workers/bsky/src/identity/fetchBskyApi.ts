import { RecognizableError } from '@dimensiondev/workers-shared/constants/error.js';
import { fetchWithContext } from '@dimensiondev/workers-shared/helpers/fetchWithContext.js';
import type { Context } from 'hono';

export async function fetchBskyApi<T = unknown>(
    input: RequestInfo | URL,
    init: RequestInit & { context: Context },
): Promise<T> {
    const response = await fetchWithContext(input, init);
    const result = await response.json();
    if (response.status !== 200) {
        const { error, message } = result as { error: string; message: string };
        throw new RecognizableError(
            message || error || `Failed to call bsky api with status code = ${response.status}`,
        );
    }

    return result as T;
}
