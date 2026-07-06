import { describe, expect, test } from 'vitest';

import { shouldIndexProfile } from '@/helpers/shouldIndexProfile.js';

function createProfile(overrides?: Partial<Parameters<typeof shouldIndexProfile>[0]>) {
    return {
        displayName: 'Vitalik Buterin',
        handle: 'vitalik',
        bio: 'hug the future',
        followerCount: 543210,
        ...overrides,
    };
}

describe('shouldIndexProfile', () => {
    test('indexes a rich profile with a real display name and bio', () => {
        expect(shouldIndexProfile(createProfile())).toBe(true);
    });

    test('does not index an empty-shell profile (displayName == handle, no bio, 0 followers)', () => {
        expect(
            shouldIndexProfile(createProfile({ displayName: 'bhh7uu', handle: 'bhh7uu', bio: '', followerCount: 0 })),
        ).toBe(false);
    });

    test('indexes when displayName is empty but a bio is present', () => {
        expect(shouldIndexProfile(createProfile({ displayName: '', followerCount: 0 }))).toBe(true);
    });

    test('indexes when followerCount meets the threshold, even without displayName or bio', () => {
        expect(shouldIndexProfile(createProfile({ displayName: '', bio: '', followerCount: MIN_THRESHOLD }))).toBe(
            true,
        );
    });

    test('does not index when displayName is empty, no bio, and 0 followers', () => {
        expect(shouldIndexProfile(createProfile({ displayName: '', bio: '', followerCount: 0 }))).toBe(false);
    });

    test('indexes when displayName is distinct from the handle even if followerCount is 0 (RPC-returns-0 case)', () => {
        expect(
            shouldIndexProfile(
                createProfile({ displayName: 'Vitalik Buterin', handle: 'vitalik', bio: '', followerCount: 0 }),
            ),
        ).toBe(true);
    });

    test('does not index when displayName equals handle case-insensitively, no bio, 0 followers', () => {
        expect(
            shouldIndexProfile(createProfile({ displayName: 'Vitalik', handle: 'vitalik', bio: '', followerCount: 0 })),
        ).toBe(false);
    });

    test('treats whitespace-only displayName and bio as empty', () => {
        expect(
            shouldIndexProfile(createProfile({ displayName: '   ', handle: 'bhh7uu', bio: '   ', followerCount: 0 })),
        ).toBe(false);
    });

    test('does not index when followerCount is just below the threshold', () => {
        expect(shouldIndexProfile(createProfile({ displayName: '', bio: '', followerCount: MIN_THRESHOLD - 1 }))).toBe(
            false,
        );
    });
});

// Mirrors the tunable constant in the implementation; kept local so the test
// documents the boundary it asserts.
const MIN_THRESHOLD = 20;
