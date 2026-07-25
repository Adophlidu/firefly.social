import { describe, expect, it } from 'vitest';

import { optimizeCDNImageSize } from '@/helpers/optimizeCDNImageSize.js';

describe('optimizeCDNImageSize', () => {
    describe('ImageKit', () => {
        it('splices a transform (with dpr-2 by default) into an avatar-style URL with no existing tr:', () => {
            const url = 'https://ik.imagekit.io/username/avatar.png';
            expect(optimizeCDNImageSize(url, 40, 40)).toBe(
                'https://ik.imagekit.io/username/tr:w-40,h-40,c-at_max,dpr-2/avatar.png',
            );
        });

        it('rewrites an existing tr:w-,h- transform with the new size and dpr', () => {
            const url = 'https://ik.imagekit.io/username/tr:w-100,h-100/avatar.png';
            expect(optimizeCDNImageSize(url, 40, 40, 2)).toBe(
                'https://ik.imagekit.io/username/tr:w-40,h-40,c-at_max,dpr-2/avatar.png',
            );
        });

        it('passes through unknown transformations unchanged', () => {
            const url = 'https://ik.imagekit.io/username/tr:w-auto,foo/avatar.png';
            expect(optimizeCDNImageSize(url, 40, 40, 2)).toBe(url);
        });
    });

    describe('CloudFlare', () => {
        it('adds width/height (scaled by dpr) with sharpen for small images', () => {
            const url = 'https://imagedelivery.net/abc123/xyz-456/original';
            expect(optimizeCDNImageSize(url, 40, 40, 2)).toBe(
                'https://imagedelivery.net/abc123/xyz-456/w=80,h=80,sharpen=3,onerror=redirect',
            );
        });
    });

    describe('dpr', () => {
        it('defaults to 2 (retina) when not passed', () => {
            const url = 'https://ik.imagekit.io/username/avatar.png';
            expect(optimizeCDNImageSize(url, 40, 40)).toContain(',dpr-2');
        });

        it('scales CloudFlare dimensions by the device pixel ratio', () => {
            const url = 'https://imagedelivery.net/abc123/xyz-456/original';
            expect(optimizeCDNImageSize(url, 40, 40, 1)).toContain('w=40,h=40,sharpen=3');
            expect(optimizeCDNImageSize(url, 40, 40, 3)).toContain('w=120,h=120,sharpen=3');
        });
    });

    describe('CoinGecko', () => {
        const url = 'https://coin-images.coingecko.com/coins/images/30663/large/gho-token-logo.png?1720517200';

        it('rewrites /large/ to /small/ for sub-100px icons, preserving the source version stamp', () => {
            expect(optimizeCDNImageSize(url, 36, 36)).toBe(
                'https://coin-images.coingecko.com/coins/images/30663/small/gho-token-logo.png?1720517200',
            );
        });

        it('is deterministic across renders (no render-time Date.now() that diverges SSR/hydration)', () => {
            // A render-time Date.now() previously baked a server/client timestamp diff into `src`
            // and surfaced as a React hydration attribute mismatch (#418).
            expect(optimizeCDNImageSize(url, 36, 36)).toBe(optimizeCDNImageSize(url, 36, 36));
            // `filename` already carries the source `?version`, so no appended cache-bust / double-`?`.
            expect(optimizeCDNImageSize(url, 36, 36)).not.toContain('?1720517200?');
        });

        it('leaves >=100px CoinGecko URLs unchanged', () => {
            expect(optimizeCDNImageSize(url, 120, 120)).toBe(url);
        });
    });
});
