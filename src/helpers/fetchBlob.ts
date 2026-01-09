import { fetch, type NextFetchersOptions } from '@/helpers/fetch.js';

export async function fetchBlob(
    input: RequestInfo | URL,
    init?: RequestInit,
    options?: NextFetchersOptions,
): Promise<Blob> {
    const response = await fetch(input, init, options);
    if (!response.ok) throw new Error('Failed to fetch as Blob.');
    return response.blob();
}
