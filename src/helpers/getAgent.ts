import { headers } from 'next/headers.js';

export async function getAgent() {
    const url = (await headers()).get('X-URL');
    if (!url) return null;
    const parsedUrl = new URL(url);
    return parsedUrl.searchParams.get('agent');
}
