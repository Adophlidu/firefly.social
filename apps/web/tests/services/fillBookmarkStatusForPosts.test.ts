import { Source } from '@dimensiondev/enums';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getFireflyBookmarksByIds } from '@/providers/firefly/endpoint/getFireflyBookmarkIds.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { fillBookmarkStatusForPosts } from '@/services/fillBookmarkStatusForPosts.js';

vi.mock('@/providers/firefly/SessionHolder.js', () => ({
    fireflySessionHolder: {
        session: null,
    },
}));

vi.mock('@/providers/firefly/endpoint/getFireflyBookmarkIds.js', () => ({
    getFireflyBookmarksByIds: vi.fn(),
}));

const mockedGetFireflyBookmarksByIds = vi.mocked(getFireflyBookmarksByIds);

function buildPost(postId: string): Post {
    return { postId, source: Source.Farcaster } as unknown as Post;
}

describe('fillBookmarkStatusForPosts', () => {
    beforeEach(() => {
        mockedGetFireflyBookmarksByIds.mockReset();
        // Default: signed out (as during Vercel build / SSR without a user).
        (fireflySessionHolder as { session: unknown }).session = null;
    });

    it('skips the bookmark query when there is no Firefly session (build/SSR)', async () => {
        const posts = [buildPost('1'), buildPost('2')];

        const result = await fillBookmarkStatusForPosts(posts, Source.Farcaster);

        // The user-scoped endpoint must not be hit without a session — that is
        // the request that returns 401 and spams the build logs.
        expect(mockedGetFireflyBookmarksByIds).not.toHaveBeenCalled();
        expect(result).toBe(posts);
    });

    it('queries and fills bookmark status when a session exists', async () => {
        (fireflySessionHolder as { session: unknown }).session = { profileId: 'me' };
        mockedGetFireflyBookmarksByIds.mockResolvedValue([{ post_id: '1', has_book_marked: true }] as Awaited<
            ReturnType<typeof getFireflyBookmarksByIds>
        >);

        const result = await fillBookmarkStatusForPosts([buildPost('1'), buildPost('2')], Source.Farcaster);

        expect(mockedGetFireflyBookmarksByIds).toHaveBeenCalledOnce();
        expect(result[0].hasBookmarked).toBe(true);
        expect(result[1].hasBookmarked).toBe(false);
    });
});
