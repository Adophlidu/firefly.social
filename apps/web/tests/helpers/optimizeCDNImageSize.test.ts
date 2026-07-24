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
});
