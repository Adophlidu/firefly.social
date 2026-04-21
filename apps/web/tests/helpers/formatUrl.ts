import { describe, expect, test } from 'vitest';

import { formatUrl } from '@/helpers/formatUrl.js';

describe('formatUrl', () => {
    test('strips the protocol and trailing slash for bare domains', () => {
        expect(formatUrl('https://www.firefly.social/', 30)).toBe('firefly.social');
    });

    test('truncates long urls without splitting surrogate pairs', () => {
        expect(formatUrl('http://t.me/preview17place｜合作请带照自介｜𝒮𝓊𝒾𝓋ℯ𝓏', 30)).toBe(
            't.me/preview17place｜合作请带照自介｜𝒮…',
        );
    });
});
