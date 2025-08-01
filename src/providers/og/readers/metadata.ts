/* cspell:disable */

import { qAny } from '@/helpers/q.js';

export function getTitle(document: Document): string | null {
    const meta = qAny(document, ['lens:title', 'og:title', 'twitter:title']);
    return meta?.getAttribute('content') || document.querySelector('title')?.textContent || document.domain;
}

export function getDescription(document: Document): string | null {
    const meta = qAny(document, ['lens:description', 'og:description', 'twitter:description', 'description']);
    return meta?.getAttribute('content') || null;
}

export function getImageUrl(document: Document): string | null {
    const meta = qAny(document, ['lens:image', 'og:image', 'twitter:image', 'twitter:image:src']);
    return meta?.getAttribute('content') || null;
}
