import { Source } from '@dimensiondev/enums';
import { describe, expect, test } from 'vitest';

import { createProfileJsonLd, serializeJsonLd } from '@/helpers/createProfileJsonLd.js';

function createProfile(overrides?: Partial<Parameters<typeof createProfileJsonLd>[0]>) {
    return {
        source: Source.Farcaster as const,
        profileId: '5650',
        displayName: 'Vitalik Buterin',
        handle: 'vitalik.eth',
        bio: 'hug the future',
        pfp: 'https://example.com/pfp.png',
        followerCount: 543210,
        ...overrides,
    };
}

describe('createProfileJsonLd', () => {
    test('should build a full ProfilePage JSON-LD object', () => {
        expect(createProfileJsonLd(createProfile())).toEqual({
            '@context': 'https://schema.org',
            '@type': 'ProfilePage',
            mainEntity: {
                '@type': 'Person',
                name: 'Vitalik Buterin',
                alternateName: '@vitalik.eth',
                identifier: '5650',
                description: 'hug the future',
                image: 'https://example.com/pfp.png',
                url: 'https://firefly.social/profile/farcaster/vitalik.eth',
                interactionStatistic: [
                    {
                        '@type': 'InteractionCounter',
                        interactionType: 'https://schema.org/FollowAction',
                        userInteractionCount: 543210,
                    },
                ],
            },
        });
    });

    test('should omit absent fields for a minimal profile', () => {
        const jsonLd = createProfileJsonLd(createProfile({ bio: undefined, pfp: undefined, followerCount: undefined }));
        expect(jsonLd.mainEntity).toEqual({
            '@type': 'Person',
            name: 'Vitalik Buterin',
            alternateName: '@vitalik.eth',
            identifier: '5650',
            url: 'https://firefly.social/profile/farcaster/vitalik.eth',
        });
        expect(jsonLd.mainEntity).not.toHaveProperty('description');
        expect(jsonLd.mainEntity).not.toHaveProperty('image');
        expect(jsonLd.mainEntity).not.toHaveProperty('interactionStatistic');
    });

    test('should keep a zero follower count', () => {
        const jsonLd = createProfileJsonLd(createProfile({ followerCount: 0 }));
        expect(jsonLd.mainEntity.interactionStatistic?.[0].userInteractionCount).toBe(0);
    });

    test('should fall back to the handle when displayName is empty', () => {
        const jsonLd = createProfileJsonLd(createProfile({ displayName: '  ' }));
        expect(jsonLd.mainEntity.name).toBe('@vitalik.eth');
    });
});

describe('serializeJsonLd', () => {
    test('should escape < to prevent script-context injection', () => {
        const jsonLd = createProfileJsonLd(createProfile({ bio: '</script><script>alert(1)</script>' }));
        const serialized = serializeJsonLd(jsonLd);
        expect(serialized).not.toContain('<');
        expect(serialized).toContain('\\u003c/script>');
        expect(JSON.parse(serialized)).toEqual(jsonLd);
    });
});
