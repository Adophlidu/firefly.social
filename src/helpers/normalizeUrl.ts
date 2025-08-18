import { fixUrlProtocol } from '@/helpers/fixUrlProtocol.js';

/**
 * normalizeUrl('example.com') => 'https://example.com/'
 * normalizeUrl('https://example.com') => 'https://example.com/'
 */
export function normalizeUrl(url: string) {
    return new URL(fixUrlProtocol(url)).toString();
}
