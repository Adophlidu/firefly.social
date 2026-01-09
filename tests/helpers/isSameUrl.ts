import { describe, expect, it } from 'vitest';

import { isSameUrl } from '@/helpers/isSameUrl.js';

describe('isSameUrl', () => {
    describe('Basic Equality', () => {
        it('should return true for identical URLs', () => {
            const url = 'https://example.com/page?id=123';
            const result = isSameUrl(url, url);
            expect(result).toBe(true);
        });

        it('should return false for different domains', () => {
            const result = isSameUrl('https://example.com', 'https://example.org');
            expect(result).toBe(false);
        });

        it('should be case-insensitive for hostnames', () => {
            const result = isSameUrl('https://EXAMPLE.com', 'https://example.com');
            expect(result).toBe(true);
        });
    });

    describe('Protocol Handling', () => {
        it('should return false for different protocols by default', () => {
            const result = isSameUrl('http://example.com', 'https://example.com');
            expect(result).toBe(false);
        });

        it('should return true for different protocols if ignored', () => {
            // When ignoring protocol, we must ensure ports match or are also ignored.
            // Here we use explicit ports to ensure they are identical, isolating the protocol check.
            const result = isSameUrl('http://example.com:8080', 'https://example.com:8080', {
                ignoreProtocol: true,
                ignorePort: false,
                ignoreTrailingSlash: true,
                ignoreQueryOrder: true,
                ignoreHash: false,
            });
            expect(result).toBe(true);
        });
    });

    describe('Port Handling', () => {
        it('should normalize default http port (80)', () => {
            const result = isSameUrl('http://example.com', 'http://example.com:80');
            expect(result).toBe(true);
        });

        it('should normalize default https port (443)', () => {
            const result = isSameUrl('https://example.com', 'https://example.com:443');
            expect(result).toBe(true);
        });

        it('should detect different explicit ports', () => {
            const result = isSameUrl('https://example.com:3000', 'https://example.com:4000');
            expect(result).toBe(false);
        });

        it('should ignore port differences if option set', () => {
            const result = isSameUrl('https://example.com:3000', 'https://example.com:4000', {
                ignorePort: true,
                ignoreProtocol: false,
                ignoreTrailingSlash: true,
                ignoreQueryOrder: true,
                ignoreHash: false,
            });
            expect(result).toBe(true);
        });
    });

    describe('Path Handling', () => {
        it('should ignore trailing slash by default', () => {
            const result = isSameUrl('https://example.com/foo', 'https://example.com/foo/');
            expect(result).toBe(true);
        });

        it('should respect trailing slash if ignored is false', () => {
            const result = isSameUrl('https://example.com/foo', 'https://example.com/foo/', {
                ignoreTrailingSlash: false,
            });
            expect(result).toBe(false);
        });

        it('should handle encoded characters (auto-normalization)', () => {
            // Browsers normalize spaces to %20
            const result = isSameUrl('https://example.com/foo%20bar', 'https://example.com/foo bar');
            expect(result).toBe(true);
        });

        it('should handle tilde decoding (~ vs %7E)', () => {
            // The implementation decodes components, so %7E should equal ~
            const result = isSameUrl('https://example.com/~user', 'https://example.com/%7Euser');
            expect(result).toBe(true);
        });
    });

    describe('Query Params', () => {
        it('should match same params in different order by default', () => {
            const result = isSameUrl('https://example.com?a=1&b=2', 'https://example.com?b=2&a=1');
            expect(result).toBe(true);
        });

        it('should fail match for different order if option disabled', () => {
            const result = isSameUrl('https://example.com?a=1&b=2', 'https://example.com?b=2&a=1', {
                ignoreQueryOrder: false,
            });
            expect(result).toBe(false);
        });

        it('should detect missing params', () => {
            const result = isSameUrl('https://example.com?a=1', 'https://example.com?a=1&b=2');
            expect(result).toBe(false);
        });

        it('should match empty query string vs no query string', () => {
            // '?' is often normalized to empty string search by URL object if no params follow
            const result = isSameUrl('https://example.com', 'https://example.com?');
            expect(result).toBe(true);
        });
    });

    describe('Hash Handling', () => {
        it('should respect hash differences by default', () => {
            const result = isSameUrl('https://example.com#top', 'https://example.com#bottom');
            expect(result).toBe(false);
        });

        it('should ignore hash differences if option set', () => {
            const result = isSameUrl('https://example.com#top', 'https://example.com#bottom', {
                ignoreHash: true,
            });
            expect(result).toBe(true);
        });
    });

    describe('Error Handling', () => {
        it('should return error for invalid URLs', () => {
            const result = isSameUrl('not-a-url', 'also-invalid');
            expect(result).toBe(false);
            expect(result).toBeDefined();
        });

        it('should return error for empty input', () => {
            const result = isSameUrl('', 'https://google.com');
            expect(result).toBe(false);
            expect(result).toBeDefined();
        });
    });
});
