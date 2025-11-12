import type { NextFetchersOptions } from '@/helpers/fetch.js';
import { fetch } from '@/helpers/fetch.js';

export async function fetchArrayBuffer(
    input: RequestInfo | URL,
    init?: RequestInit,
    options?: NextFetchersOptions,
): Promise<ArrayBuffer> {
    const response = await fetch(input, init, options);
    if (!response.ok) throw new Error('Failed to fetch as ArrayBuffer.');
    return response.arrayBuffer();
}
