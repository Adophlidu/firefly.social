import { createIndicator, createPageable } from '@dimensiondev/utils';
import { describe, expect, it } from 'vitest';

import { buildProfileFeedInitialData } from '@/helpers/buildProfileFeedInitialData.js';
import type { Post } from '@/providers/types/SocialMedia.js';

function createPost(id: string): Post {
    return {
        postId: id,
        author: {
            profileId: 'author',
            handle: 'author',
            displayName: 'Author',
            bio: 'bio',
        },
        metadata: { content: { content: `post-${id}` } },
    } as Post;
}

describe('buildProfileFeedInitialData', () => {
    it('compacts and limits the first SSR feed page', () => {
        const page = createPageable(
            Array.from({ length: 25 }, (_, index) => createPost(String(index))),
            createIndicator(),
            createIndicator(undefined, 'next-page'),
        );
        const initial = buildProfileFeedInitialData(page);

        expect(initial?.pages).toHaveLength(1);
        expect(initial?.pageParams).toEqual(['']);
        expect(initial?.pages[0]?.data).toHaveLength(10);
        expect(initial?.pages[0]?.data[0]?.author.bio).toBeUndefined();
        expect(initial?.pages[0]?.nextIndicator).toEqual(page.nextIndicator);
    });

    it('returns undefined for an empty page', () => {
        expect(buildProfileFeedInitialData(createPageable([], createIndicator()))).toBeUndefined();
    });
});
