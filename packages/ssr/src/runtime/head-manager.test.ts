import { describe, expect, it } from 'vitest';

import { flattenHeads } from './head-manager.ts';

describe('flattenHeads', () => {
    it('takes the last non-empty title', () => {
        const { title } = flattenHeads([{ title: 'Root' }, {}, { title: 'Page' }]);
        expect(title).toBe('Page');
    });

    it('lets later meta tags override earlier ones with the same name', () => {
        const { meta } = flattenHeads([
            { meta: [{ name: 'description', content: 'root' }] },
            { meta: [{ name: 'description', content: 'page' }] },
        ]);
        expect(meta).toEqual([{ name: 'description', content: 'page' }]);
    });

    it('lets later meta tags override earlier ones with the same property', () => {
        const { meta } = flattenHeads([
            { meta: [{ property: 'og:title', content: 'root' }] },
            { meta: [{ property: 'og:title', content: 'page' }, { property: 'og:image', content: 'x.png' }] },
        ]);
        expect(meta).toEqual([
            { property: 'og:title', content: 'page' },
            { property: 'og:image', content: 'x.png' },
        ]);
    });

    it('keeps distinct meta identities', () => {
        const { meta } = flattenHeads([
            {
                meta: [
                    { charSet: 'utf-8', content: '' },
                    { httpEquiv: 'refresh', content: '5' },
                    { name: 'robots', content: 'noindex' },
                ],
            },
        ]);
        expect(meta).toHaveLength(3);
    });

    it('dedupes links by rel and href', () => {
        const { links } = flattenHeads([
            { links: [{ rel: 'canonical', href: 'https://a.test/x' }, { rel: 'icon', href: '/favicon.ico' }] },
            { links: [{ rel: 'canonical', href: 'https://a.test/y' }] },
        ]);
        expect(links).toEqual([
            { rel: 'canonical', href: 'https://a.test/y' },
            { rel: 'icon', href: '/favicon.ico' },
        ]);
    });
});
