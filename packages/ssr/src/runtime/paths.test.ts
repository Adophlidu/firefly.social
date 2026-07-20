import { describe, expect, it } from 'vitest';

import { stripBasepath, withBasepath } from './paths.ts';

describe('stripBasepath', () => {
    it('strips the prefix and keeps the remainder', () => {
        expect(stripBasepath('/wallet-iframe/send', '/wallet-iframe')).toBe('/send');
        expect(stripBasepath('/wallet-iframe', '/wallet-iframe')).toBe('/');
    });

    it('leaves unrelated paths and missing basepath alone', () => {
        expect(stripBasepath('/other', '/wallet-iframe')).toBe('/other');
        expect(stripBasepath('/send', undefined)).toBe('/send');
        expect(stripBasepath('/send', '/')).toBe('/send');
    });
});

describe('withBasepath', () => {
    it('joins basepath and path', () => {
        expect(withBasepath('/send', '/wallet-iframe')).toBe('/wallet-iframe/send');
        expect(withBasepath('/', '/wallet-iframe')).toBe('/wallet-iframe');
        expect(withBasepath('/send', undefined)).toBe('/send');
    });
});
