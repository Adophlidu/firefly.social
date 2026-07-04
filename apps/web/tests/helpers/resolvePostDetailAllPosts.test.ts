import { createPageable } from '@dimensiondev/utils';
import { describe, expect, it } from 'vitest';

import { resolvePostDetailAllPosts } from '@/helpers/resolvePostDetailAllPosts.js';
import type { Post } from '@/providers/types/SocialMedia.js';

function createPost(id: string, timestamp: number): Post {
    return {
        postId: id,
        timestamp,
    } as Post;
}

describe('resolvePostDetailAllPosts', () => {
    it('returns empty when thread cache is empty', () => {
        expect(resolvePostDetailAllPosts(createPost('root', 1), undefined)).toEqual([]);
    });

    it('returns empty when merged thread is shorter than the thread threshold', () => {
        const detail = createPost('root', 1);
        const thread = createPageable([createPost('reply', 2)], undefined);

        expect(resolvePostDetailAllPosts(detail, thread)).toEqual([]);
    });

    it('rebuilds chronological thread after detail post was removed from cache', () => {
        const root = createPost('root', 1);
        const reply1 = createPost('reply-1', 2);
        const reply2 = createPost('reply-2', 3);
        const thread = createPageable([reply1, reply2], undefined);

        expect(resolvePostDetailAllPosts(root, thread)).toEqual([root, reply1, reply2]);
    });

    it('keeps order when detail post is a later reply', () => {
        const root = createPost('root', 1);
        const reply1 = createPost('reply-1', 2);
        const reply2 = createPost('reply-2', 3);
        const thread = createPageable([root, reply1], undefined);

        expect(resolvePostDetailAllPosts(reply2, thread)).toEqual([root, reply1, reply2]);
    });
});
