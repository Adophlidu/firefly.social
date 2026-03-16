import { afterEach, describe, expect, it } from 'vitest';

import { queryClient } from '@/configs/queryClient.js';
import { Source } from '@/constants/enum.js';
import { patchPostQueryData } from '@/helpers/patchPostQueryData.js';
import { type Post, ProfileStatus } from '@/providers/types/SocialMedia.js';

function createPost(postId: string, overrides: Partial<Post> = {}): Post {
    return {
        publicationId: postId,
        postId,
        source: Source.Twitter,
        author: {
            profileId: `author-${postId}`,
            profileSource: Source.Twitter,
            source: Source.Twitter,
            displayName: `Author ${postId}`,
            handle: `author_${postId}`,
            fullHandle: `author_${postId}`,
            pfp: '',
            followerCount: 0,
            followingCount: 0,
            status: ProfileStatus.Active,
            verified: false,
            isProUser: false,
        },
        metadata: {
            locale: 'en',
            content: {
                content: postId,
            },
        },
        ...overrides,
    };
}

afterEach(() => {
    queryClient.clear();
});

describe('patchPostQueryData', () => {
    it('patches posts with missing child relations without throwing', () => {
        queryClient.setQueryData([Source.Twitter, 'post-detail', 'root-post'], createPost('root-post'));

        expect(() => {
            patchPostQueryData(Source.Twitter, 'root-post', (draft) => {
                draft.hasMirrored = true;
            });
        }).not.toThrow();

        const detailPost = queryClient.getQueryData<Post>([Source.Twitter, 'post-detail', 'root-post']);
        expect(detailPost?.hasMirrored).toBe(true);
    });

    it('patches nested twitter posts in detail actions and post lists', () => {
        const nestedQuote = createPost('target-quote');
        const nestedMirror = createPost('target-mirror');

        queryClient.setQueryData(
            [Source.Twitter, 'post-detail', 'actions', 'detail-post', false],
            createPost('detail-post', {
                quoteOn: nestedQuote,
                mirrorOn: nestedMirror,
            }),
        );

        queryClient.setQueryData(['posts', Source.Twitter], {
            pages: [
                {
                    data: [
                        createPost('feed-post', {
                            threads: [
                                createPost('thread-post', {
                                    mirrorOn: createPost('target-thread-mirror'),
                                }),
                            ],
                        }),
                    ],
                },
            ],
        });

        patchPostQueryData(
            Source.Twitter,
            (post) => post?.postId?.startsWith('target-') ?? false,
            (draft) => {
                draft.hasMirrored = true;
            },
        );

        const detailPost = queryClient.getQueryData<Post>([
            Source.Twitter,
            'post-detail',
            'actions',
            'detail-post',
            false,
        ]);
        const feedPages = queryClient.getQueryData<{ pages: Array<{ data: Post[] }> }>(['posts', Source.Twitter]);

        expect(detailPost?.quoteOn?.hasMirrored).toBe(true);
        expect(detailPost?.mirrorOn?.hasMirrored).toBe(true);
        expect(feedPages?.pages[0].data[0].threads?.[0].mirrorOn?.hasMirrored).toBe(true);
    });

    it('patches shared post instances in each cache independently', () => {
        const sharedPost = createPost('shared-post');

        queryClient.setQueryData([Source.Twitter, 'post-detail', 'shared-post'], sharedPost);
        queryClient.setQueryData(['posts', Source.Twitter], {
            pages: [
                {
                    data: [sharedPost],
                },
            ],
        });

        patchPostQueryData(Source.Twitter, 'shared-post', (draft) => {
            draft.hasMirrored = true;
        });

        const detailPost = queryClient.getQueryData<Post>([Source.Twitter, 'post-detail', 'shared-post']);
        const feedPages = queryClient.getQueryData<{ pages: Array<{ data: Post[] }> }>(['posts', Source.Twitter]);

        expect(detailPost?.hasMirrored).toBe(true);
        expect(feedPages?.pages[0].data[0].hasMirrored).toBe(true);
    });
});
