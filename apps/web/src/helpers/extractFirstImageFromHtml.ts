import { parseHtml } from '@/libs/parseHtml.js';

/**
 * Extract the first image URL from HTML content
 * @param html - HTML string to extract image from
 * @returns The first image URL found, or null if none exists
 */
export function extractFirstImageFromHtml(html: string): string | null {
    const document = parseHtml(html);
    const img = document.querySelector('img');
    return img?.getAttribute('src') ?? null;
}
