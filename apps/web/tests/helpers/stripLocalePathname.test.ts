import { describe, expect, it } from 'vitest';

import { hasLocalePrefix, stripLocalePathname } from '@/helpers/stripLocalePathname.js';

describe('hasLocalePrefix', () => {
    it('should detect a leading locale segment', () => {
        expect(hasLocalePrefix('/en/signup')).toBe(true);
        expect(hasLocalePrefix('/zh-Hans')).toBe(true);
        expect(hasLocalePrefix('/signup')).toBe(false);
        expect(hasLocalePrefix('/english/signup')).toBe(false);
        expect(hasLocalePrefix('/')).toBe(false);
    });
});

describe('stripLocalePathname', () => {
    it('should strip a leading locale segment', () => {
        expect(stripLocalePathname('/en/signup')).toBe('/signup');
        expect(stripLocalePathname('/ja/profile/123')).toBe('/profile/123');
        expect(stripLocalePathname('/zh-Hans/signup')).toBe('/signup');
    });

    it('should return the root path when the pathname is only a locale', () => {
        expect(stripLocalePathname('/en')).toBe('/');
        expect(stripLocalePathname('/zh-Hant')).toBe('/');
    });

    it('should keep pathnames without a locale prefix unchanged', () => {
        expect(stripLocalePathname('/signup')).toBe('/signup');
        expect(stripLocalePathname('/signup?step=success')).toBe('/signup?step=success');
        expect(stripLocalePathname('/')).toBe('/');
    });

    it('should not strip segments that merely resemble locales', () => {
        expect(stripLocalePathname('/english/signup')).toBe('/english/signup');
        expect(stripLocalePathname('/EN/signup')).toBe('/EN/signup');
        expect(stripLocalePathname('/zh-hans/signup')).toBe('/zh-hans/signup');
    });

    it('should handle malformed input', () => {
        expect(stripLocalePathname('')).toBe('');
        expect(stripLocalePathname('en/signup')).toBe('en/signup');
    });
});
