import { describe, expect, it } from 'vitest';

import { resolveTwitterRetweetStatus } from '@/providers/twitter/resolveTwitterRetweetStatus.js';

describe('resolveTwitterRetweetStatus', () => {
    it('returns true when the API says the original tweet is retweeted by the viewer', () => {
        expect(resolveTwitterRetweetStatus({ author_id: 'author-1', retweeted: true })).toBe(true);
    });

    it('returns true for mirror posts when the original tweet is retweeted by the viewer', () => {
        expect(
            resolveTwitterRetweetStatus({ author_id: 'author-2', retweeted: false }, 'viewer', { retweeted: true }),
        ).toBe(true);
    });

    it('returns true when the mirror tweet itself belongs to the current viewer', () => {
        expect(resolveTwitterRetweetStatus({ author_id: 'viewer', retweeted: false }, 'viewer')).toBe(true);
    });
});
