import { safeUnreachable, UnreachableError } from '@dimensiondev/utils';

import { type SocialSource, Source } from '@/constants/enum.js';
import { mergeMediaObjects } from '@/helpers/mergeMediaObjects.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { PostAtUri } from '@/providers/bsky/AtUri.js';
import { twitterSocialMediaProxy } from '@/providers/twitter/SocialMedia.js';
import { type Poll } from '@/providers/types/Poll.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';
import { type ComposeType, type CompositePost, type MediaObject } from '@/types/compose.js';

type Options = Record<
    ComposeType,
    (
        images: MediaObject[],
        videos: MediaObject[],
        polls?: Poll[],
    ) => Promise<{
        postId: string;
        contentURI?: string;
    }>
> & {
    uploadPolls?: () => Promise<Poll[]>;
    uploadImages?: () => Promise<MediaObject[]>;
    uploadVideos?: () => Promise<MediaObject[]>;
};

export function createPostTo(source: SocialSource, options: Options) {
    const { updatePostInThread, updateTwitterPollId } = useComposeStateStore.getState();

    return async (type: ComposeType, post: CompositePost) => {
        const uploadedImages: MediaObject[] = (await options.uploadImages?.()) ?? [];
        const uploadedVideos: MediaObject[] = (await options.uploadVideos?.()) ?? [];
        const polls = (await options.uploadPolls?.()) ?? [];

        updatePostInThread(post.id, (post) => ({
            ...post,
            images: mergeMediaObjects(post.images, uploadedImages),
            videos: uploadedVideos ?? null,
        }));

        const postTo = async () => {
            const parentPost = post.parentPost[source];
            switch (type) {
                case 'compose': {
                    const postId = await options.compose(uploadedImages, uploadedVideos, polls);
                    return postId;
                }
                case 'reply':
                    if (!parentPost) throw new Error('No parent post found.');
                    const commentId = await options.reply(uploadedImages, uploadedVideos, polls);
                    return commentId;
                case 'quote': {
                    if (!parentPost) throw new Error('No parent post found.');
                    const postId = await options.quote(uploadedImages, uploadedVideos);
                    return postId;
                }
                default:
                    safeUnreachable(type);
                    throw new UnreachableError('compose type', type);
            }
        };

        const { postId, contentURI } = await postTo();

        updatePostInThread(post.id, (post) => ({
            ...post,
            postId: {
                ...post.postId,
                [source]: postId,
            },
            postContentURI: {
                ...post.postContentURI,
                [source]: contentURI,
            },
        }));

        if (source === Source.Twitter && postId && post.poll) {
            const tweet = await runInSafeAsync(() => twitterSocialMediaProxy.getPostById(postId));
            if (tweet?.poll?.id) updateTwitterPollId(tweet.poll.id);
        }

        return source === Source.Bsky && contentURI ? PostAtUri.from(contentURI).toId() : postId;
    };
}
