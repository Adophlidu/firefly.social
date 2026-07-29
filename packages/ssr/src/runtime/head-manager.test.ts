import { describe, expect, it } from 'vitest';

import { absolutizeHeadUrl, flattenHeads } from './head-manager.ts';

describe('absolutizeHeadUrl', () => {
    it('resolves root-relative URLs against the origin', () => {
        expect(absolutizeHeadUrl('/api/og/post/lens/1/image', 'https://example.com')).toBe(
            'https://example.com/api/og/post/lens/1/image',
        );
    });

    it('passes absolute URLs through unchanged', () => {
        expect(absolutizeHeadUrl('https://cdn.test/x.png', 'https://example.com')).toBe('https://cdn.test/x.png');
    });

    it('passes non-URL content through unchanged', () => {
        expect(absolutizeHeadUrl('summary_large_image', 'https://example.com')).toBe('summary_large_image');
    });

    it('keeps relative URLs when no origin is known', () => {
        expect(absolutizeHeadUrl('/image/og.png', undefined)).toBe('/image/og.png');
    });

    it('passes undefined through', () => {
        expect(absolutizeHeadUrl(undefined, 'https://example.com')).toBeUndefined();
    });
});

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
            {
                meta: [
                    { property: 'og:title', content: 'page' },
                    { property: 'og:image', content: 'x.png' },
                ],
            },
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
            {
                links: [
                    { rel: 'canonical', href: 'https://a.test/x' },
                    { rel: 'icon', href: '/favicon.ico' },
                ],
            },
            { links: [{ rel: 'canonical', href: 'https://a.test/y' }] },
        ]);
        expect(links).toEqual([
            { rel: 'canonical', href: 'https://a.test/y' },
            { rel: 'icon', href: '/favicon.ico' },
        ]);
    });
});
