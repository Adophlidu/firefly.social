import { describe, expect, it } from 'vitest';

import { addSharerParam, addSharerParamToFireflyUrls, isFireflyOwnedUrl } from '@/helpers/sharerUrl.js';

describe('sharerUrl', () => {
    it('adds sid to absolute URLs', () => {
        expect(addSharerParam('https://firefly.social/post/farcaster', '123')).toBe(
            'https://firefly.social/post/farcaster?sid=123',
        );
    });

    it('adds sid to domain-like URLs without protocol', () => {
        expect(addSharerParam('firefly.land/post/farcaster?foo=bar', '123')).toBe(
            'firefly.land/post/farcaster?foo=bar&sid=123',
        );
    });

    it('adds sid to relative URLs', () => {
        expect(addSharerParam('/post/farcaster?foo=bar#reply', '123')).toBe('/post/farcaster?foo=bar&sid=123#reply');
    });

    it('detects firefly-owned domains only', () => {
        expect(isFireflyOwnedUrl('https://firefly.social/post/farcaster')).toBe(true);
        expect(isFireflyOwnedUrl('firefly.land/post/farcaster')).toBe(true);
        expect(isFireflyOwnedUrl('https://example.com/post/farcaster')).toBe(false);
    });

    it('rewrites only firefly-owned URLs in pasted text', () => {
        expect(
            addSharerParamToFireflyUrls(
                'Check firefly.social/post/a and https://example.com/post/b before https://firefly.land/post/c?x=1',
                '123',
            ),
        ).toBe(
            'Check firefly.social/post/a?sid=123 and https://example.com/post/b before https://firefly.land/post/c?x=1&sid=123',
        );
    });
});
