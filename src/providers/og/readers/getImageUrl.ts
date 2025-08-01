/* cspell:disable */

import { qAny } from '@/helpers/q.js';

export function getImageUrl(document: Document): string | null {
    const meta = qAny(document, ['lens:image', 'og:image', 'twitter:image', 'twitter:image:src']);
    return meta?.getAttribute('content') || null;
}
