import { describe, expect, it } from 'vitest';

import { compactPostForPageTransfer, compactPostsForPageTransfer } from '@/helpers/compactPostForPageTransfer.js';
import type { Post } from '@/providers/types/SocialMedia.js';

function createPost(overrides: Partial<Post> = {}): Post {
    return {
        postId: 'post-1',
        source: 'Farcaster',
        author: {
            profileId: 'author-1',
            handle: 'author',
            displayName: 'Author',
            bio: 'Long author bio',
        },
        metadata: {
            content: {
                content: 'Post body',
            },
        },
        root: {
            postId: 'root-post',
            source: 'Farcaster',
            author: { profileId: 'root-author', bio: 'Root author bio' },
            commentOn: { postId: 'nested-post' } as Post,
        } as Post,
        commentOn: {
            postId: 'parent-post',
            source: 'Farcaster',
            author: { profileId: 'parent-author', bio: 'Parent author bio' },
            root: { postId: 'nested-root' } as Post,
        } as Post,
        ...overrides,
    } as Post;
}

describe('compactPostForPageTransfer', () => {
    it('keeps one level of thread context but drops bios and deeper nesting', () => {
        const compact = compactPostForPageTransfer(createPost());

        expect(compact.author.bio).toBeUndefined();
        expect(compact.metadata.content?.content).toBe('Post body');

        // root/commentOn survive (PostRoot/PostParent render them on comment posts)
        expect(compact.root?.postId).toBe('root-post');
        expect(compact.commentOn?.postId).toBe('parent-post');

        // but their own nesting and bios are stripped
        expect(compact.root?.commentOn).toBeUndefined();
        expect(compact.root?.author.bio).toBeUndefined();
        expect(compact.commentOn?.root).toBeUndefined();
        expect(compact.commentOn?.author.bio).toBeUndefined();
    });

    it('shares one compacted root instance across posts of the same thread', () => {
        const posts = compactPostsForPageTransfer([createPost({ postId: 'a' }), createPost({ postId: 'b' })]);

        expect(posts[0]?.root).toBe(posts[1]?.root);
        expect(posts[0]?.commentOn).toBe(posts[1]?.commentOn);
    });
});
