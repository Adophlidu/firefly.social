import { fetchWithContext } from '@dimensiondev/workers-shared/helpers/fetchWithContext.js';
import type { Context } from 'hono';

async function getTitleLocation(response: Response) {
    let title = '';
    const rewriter = new HTMLRewriter().on('title', {
        text(text) {
            title += text.text;
        },
    });
    await rewriter.transform(response).text();

    // If the title is a valid URL, return it
    return /^https?:\/\//i.test(title.trim()) ? title : null;
}

export function isTcoLink(u: string) {
    return u.startsWith('https://t.co/') && u !== 'https://t.co/';
}

export async function resolveLink(u: string, c: Context): Promise<string | null> {
    if (!isTcoLink(u)) return null;
    const response = await fetchWithContext(u, {
        redirect: 'manual',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        context: c,
    });
    if (response.status === 200 && response.headers.get('Content-Type')?.includes('text/html')) {
        const location = await getTitleLocation(response);
        return location;
    }
    // Check for redirect status codes
    if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('Location');
        return location ?? null;
    }
    return null;
}
