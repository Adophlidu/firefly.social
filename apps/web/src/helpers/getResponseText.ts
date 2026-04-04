import { parseHtml } from '@/libs/parseHtml.js';

export async function getResponseText(response: Response): Promise<string> {
    try {
        const text = await response.clone().text();
        if (response.headers.get('content-type')?.includes('text/html')) {
            const dom = parseHtml(text);
            return dom.querySelector('title')?.textContent || 'Internal service error';
        }
        return text;
    } catch {
        return '';
    }
}
