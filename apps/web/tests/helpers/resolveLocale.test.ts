import { Locale } from '@dimensiondev/enums';
import { describe, expect, it } from 'vitest';

import { resolveLocale } from '@/helpers/resolveLocale.js';

describe('resolveLocale', () => {
    it('returns the locale unchanged when it is a valid Locale value', () => {
        for (const locale of Object.values(Locale)) {
            expect(resolveLocale(locale)).toBe(locale);
        }
    });

    it('falls back to English for unrecognized values', () => {
        expect(resolveLocale('not-a-locale')).toBe(Locale.en);
        expect(resolveLocale('EN')).toBe(Locale.en);
    });

    it('falls back to English for empty or missing values', () => {
        expect(resolveLocale('')).toBe(Locale.en);
        expect(resolveLocale(undefined)).toBe(Locale.en);
    });
});
