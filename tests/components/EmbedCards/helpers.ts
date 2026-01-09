import { describe, expect, test, vi } from 'vitest';

import { extractEmbedResources } from '@/components/EmbedCards/helpers.js';

vi.mock('@/constants/index.js', () => ({
    EMPTY_LIST: [],
}));

describe('extractEmbedResources', () => {
    describe('basic functionality', () => {
        test('should return empty lists for undefined input', () => {
            const result = extractEmbedResources(undefined, undefined);
            expect(result).toEqual({
                ignoredLinks: [],
                links: [],
                addresses: [],
                domains: [],
            });
        });

        test('should return empty lists for empty string', () => {
            const result = extractEmbedResources('', undefined);
            expect(result).toEqual({
                ignoredLinks: [],
                links: [],
                addresses: [],
                domains: [],
            });
        });
    });

    describe('link extraction', () => {
        test('should extract basic URLs from content', () => {
            const content = 'Check out https://example.com and http://test.org for more info';
            const result = extractEmbedResources(content, undefined);
            expect(result.links).toEqual(['https://example.com', 'http://test.org']);
            expect(result.ignoredLinks).toEqual([]);
        });

        test('should include oembedUrl in links', () => {
            const content = 'Some content';
            const oembedUrl = 'https://oembed.example.com';
            const result = extractEmbedResources(content, oembedUrl);
            expect(result.links).toContain('https://oembed.example.com');
        });

        test('should deduplicate links case-insensitively', () => {
            const content = 'Visit https://EXAMPLE.com and https://example.com for more';
            const result = extractEmbedResources(content, undefined);
            expect(result.links).toEqual(['https://EXAMPLE.com']);
        });

        test('should ignore ENS domains as links', () => {
            const content = 'Check out vitalik.eth website at https://example.com';
            const result = extractEmbedResources(content, undefined);
            expect(result.links).toEqual(['https://example.com']);
            expect(result.domains).toEqual(['vitalik.eth']);
        });

        test('should ignore Lens handles as links', () => {
            const content = 'Follow @lensprotocol.lens on https://example.com';
            const result = extractEmbedResources(content, undefined);
            expect(result.links).toEqual(['https://example.com']);
        });
    });

    describe('ignored links', () => {
        test('should ignore firefly.social links', () => {
            const content = 'Visit https://firefly.social and https://example.com';
            const result = extractEmbedResources(content, undefined);
            expect(result.links).toEqual(['https://example.com']);
            expect(result.ignoredLinks).toEqual(['https://firefly.social']);
        });

        test('should ignore firefly.mask.social links', () => {
            const content = 'Check https://firefly.mask.social and https://example.com';
            const result = extractEmbedResources(content, undefined);
            expect(result.links).toEqual(['https://example.com']);
            expect(result.ignoredLinks).toEqual(['https://firefly.mask.social']);
        });

        test('should ignore warpcast.com links', () => {
            const content = 'See https://warpcast.com and https://example.com';
            const result = extractEmbedResources(content, undefined);
            expect(result.links).toEqual(['https://example.com']);
            expect(result.ignoredLinks).toEqual(['https://warpcast.com']);
        });

        test('should ignore farcaster.xyz links', () => {
            const content = 'Visit https://farcaster.xyz and https://example.com';
            const result = extractEmbedResources(content, undefined);
            expect(result.links).toEqual(['https://example.com']);
            expect(result.ignoredLinks).toEqual(['https://farcaster.xyz']);
        });

        test('should ignore snapshot links', () => {
            const content = 'Check https://snapshot.box and https://snapshot.org and https://snapshot.page';
            const result = extractEmbedResources(content, undefined);
            expect(result.links).toEqual([]);
            expect(result.ignoredLinks).toEqual([
                'https://snapshot.box',
                'https://snapshot.org',
                'https://snapshot.page',
            ]);
        });

        test('should ignore staging environments', () => {
            const content = 'Visit https://staging.firefly.social and https://example.com';
            const result = extractEmbedResources(content, undefined);
            expect(result.links).toEqual(['https://example.com']);
            expect(result.ignoredLinks).toEqual(['https://staging.firefly.social']);
        });

        test('should ignore vercel app links', () => {
            const content = 'Check https://firefly-mask-test-dimension-dev.vercel.app and https://example.com';
            const result = extractEmbedResources(content, undefined);
            expect(result.links).toEqual(['https://example.com']);
            expect(result.ignoredLinks).toEqual(['https://firefly-mask-test-dimension-dev.vercel.app']);
        });

        test('should ignore mask.io links', () => {
            const content = 'Visit https://mask.io and https://example.com';
            const result = extractEmbedResources(content, undefined);
            expect(result.links).toEqual(['https://example.com']);
            expect(result.ignoredLinks).toEqual(['https://mask.io']);
        });

        test('should ignore tako.xyz links', () => {
            const content =
                'Visit https://takocast.xyz/cast/?id=0x1234567890123456789012345678901234567890 and https://example.com';
            const result = extractEmbedResources(content, undefined);
            expect(result.links).toEqual(['https://example.com']);
            expect(result.ignoredLinks).toEqual([
                'https://takocast.xyz/cast/?id=0x1234567890123456789012345678901234567890',
            ]);
        });

        test('should ignore app.tako.so links', () => {
            const content =
                'Visit https://app.tako.so/cast/?id=0x1234567890123456789012345678901234567890 and https://example.com';
            const result = extractEmbedResources(content, undefined);
            expect(result.links).toEqual(['https://example.com']);
            expect(result.ignoredLinks).toEqual([
                'https://app.tako.so/cast/?id=0x1234567890123456789012345678901234567890',
            ]);
        });
    });

    describe('address extraction', () => {
        test('should extract EVM addresses', () => {
            const content = 'Send funds to 0x742d35Cc6634C0532925a3b844Bc9e7595f6E123';
            const result = extractEmbedResources(content, undefined);
            expect(result.addresses).toEqual(['0x742d35Cc6634C0532925a3b844Bc9e7595f6E123']);
        });

        test('should extract Solana addresses', () => {
            const content = 'Send SOL to 7v4w5St5mvVpK7kYLV4DFCcS9c7mFv2bM3jYvVP6h4Rz';
            const result = extractEmbedResources(content, undefined);
            expect(result.addresses).toEqual(['7v4w5St5mvVpK7kYLV4DFCcS9c7mFv2bM3jYvVP6h4Rz']);
        });

        test('should extract multiple addresses', () => {
            const content =
                'ETH: 0x742d35Cc6634C0532925a3b844Bc9e7595f6E123, SOL: 7v4w5St5mvVpK7kYLV4DFCcS9c7mFv2bM3jYvVP6h4Rz';
            const result = extractEmbedResources(content, undefined);
            expect(result.addresses).toEqual([
                '0x742d35Cc6634C0532925a3b844Bc9e7595f6E123',
                '7v4w5St5mvVpK7kYLV4DFCcS9c7mFv2bM3jYvVP6h4Rz',
            ]);
        });

        test('should deduplicate addresses case-insensitively', () => {
            const content = '0x742d35cc6634c0532925a3b844bc9e7595f6e123 and 0x742d35Cc6634C0532925a3b844Bc9e7595f6E123';
            const result = extractEmbedResources(content, undefined);
            expect(result.addresses).toEqual(['0x742d35cc6634c0532925a3b844bc9e7595f6e123']);
        });
    });

    describe('domain extraction', () => {
        test('should extract ENS domains', () => {
            const content = 'Contact vitalik.eth for more info';
            const result = extractEmbedResources(content, undefined);
            expect(result.domains).toEqual(['vitalik.eth']);
        });

        test('should extract multiple ENS domains', () => {
            const content = 'Check vitalik.eth and nick.eth domains';
            const result = extractEmbedResources(content, undefined);
            expect(result.domains).toEqual(['vitalik.eth', 'nick.eth']);
        });

        test('should deduplicate domains case-insensitively', () => {
            const content = 'Visit VITALIK.eth and vitalik.eth';
            const result = extractEmbedResources(content, undefined);
            expect(result.domains).toEqual(['VITALIK.eth']);
        });
    });

    describe('complex scenarios', () => {
        test('should handle mixed content with all resource types', () => {
            const content = `
        Check out https://example.com for details.
        Send donations to 0x742d35Cc6634C0532925a3b844Bc9e7595f6E123
        Contact vitalik.eth for questions.
        Also visit https://firefly.social but don't include it.
        Solana address: 7v4w5St5mvVpK7kYLV4DFCcS9c7mFv2bM3jYvVP6h4Rz
      `;
            const oembedUrl = 'https://oembed.test.com';
            const result = extractEmbedResources(content, oembedUrl);

            expect(result.links).toEqual(['https://example.com', 'https://oembed.test.com']);
            expect(result.ignoredLinks).toEqual(['https://firefly.social']);
            expect(result.addresses).toEqual([
                '0x742d35Cc6634C0532925a3b844Bc9e7595f6E123',
                '7v4w5St5mvVpK7kYLV4DFCcS9c7mFv2bM3jYvVP6h4Rz',
            ]);
            expect(result.domains).toEqual(['vitalik.eth']);
        });

        test('should handle malformed URLs gracefully', () => {
            const content = 'Check out https://example.com and some invalid://url and another https://valid.org';
            const result = extractEmbedResources(content, undefined);
            expect(result.links).toEqual(['https://example.com', 'https://valid.org']);
        });

        test('should trim whitespace from extracted resources', () => {
            const content =
                'Visit  https://example.com  and contact  vitalik.eth  at  0x1234567890123456789012345678901234567890 ';
            const result = extractEmbedResources(content, undefined);
            expect(result.links).toEqual(['https://example.com']);
            expect(result.domains).toEqual(['vitalik.eth']);
            expect(result.addresses).toEqual(['0x1234567890123456789012345678901234567890']);
        });
    });
});
