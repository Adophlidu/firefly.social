import { describe, expect, it } from 'vitest';

import {
    addSharerParam,
    addSharerParamToFireflyUrls,
    getSharerParam,
    isFireflyOwnedUrl,
    removeSharerParam,
} from '@/helpers/sharerUrl.js';

describe('isFireflyOwnedUrl', () => {
    it('recognizes Firefly-owned domains with or without protocol', () => {
        expect(isFireflyOwnedUrl('https://firefly.social/post/lens/123')).toBe(true);
        expect(isFireflyOwnedUrl('https://firefly.land/post/lens/123')).toBe(true);
        expect(isFireflyOwnedUrl('https://evil.com/firefly.social')).toBe(false);
        expect(isFireflyOwnedUrl('not a url')).toBe(false);
    });
});

describe('addSharerParam / getSharerParam / removeSharerParam', () => {
    it('round-trips the sid param on an absolute URL', () => {
        const withSid = addSharerParam('https://firefly.social/post/lens/123', '456');
        expect(getSharerParam(withSid)).toBe('456');
        expect(removeSharerParam(withSid)).toBe('https://firefly.social/post/lens/123');
    });

    it('is a no-op without a sharerId', () => {
        expect(addSharerParam('https://firefly.social/post/lens/123')).toBe('https://firefly.social/post/lens/123');
    });
});

describe('addSharerParamToFireflyUrls', () => {
    it('appends sid to a plain Firefly URL pasted into compose', () => {
        const text = 'check this out https://firefly.social/post/lens/123';
        expect(addSharerParamToFireflyUrls(text, '456')).toBe(
            'check this out https://firefly.social/post/lens/123?sid=456',
        );
    });

    it('leaves a Firefly short link untouched - its sid is already baked in server-side', () => {
        const text = 'check this out https://firefly.social/i/AbCdEfGhIjKl';
        expect(addSharerParamToFireflyUrls(text, '456')).toBe(text);
    });

    it('does not treat an /i/ path with a malformed code as a short link', () => {
        const text = 'https://firefly.social/i/not-a-valid-code';
        expect(addSharerParamToFireflyUrls(text, '456')).not.toBe(text);
    });

    it('ignores non-Firefly URLs', () => {
        const text = 'https://example.com/i/AbCdEfGhIjKl';
        expect(addSharerParamToFireflyUrls(text, '456')).toBe(text);
    });
});
