import { first, uniqBy } from 'lodash-es';

import { Source } from '@/constants/enum.js';
import { readChars } from '@/helpers/chars.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import { downloadMediaObjects } from '@/helpers/downloadMediaObjects.js';
import { createTwitterMediaObject, resolveImageUrl, resolveUploadId } from '@/helpers/resolveMediaObjectUrl.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { TwitterPollProvider } from '@/providers/twitter/Poll.js';
import { twitterSocialMediaProxy } from '@/providers/twitter/SocialMedia.js';
import { uploadToTwitter, uploadVideoToTwitter } from '@/providers/twitter/uploadToTwitter.js';
import { type Poll } from '@/providers/types/Poll.js';
import { type Post, type PostType } from '@/providers/types/SocialMedia.js';
import { createPostTo } from '@/services/createPostTo.js';
import { useTwitterProfileStore } from '@/store/useProfileStore/useTwitterProfileStore.js';
import { type ComposeType, type CompositePost, type MediaObject } from '@/types/compose.js';

export async function postToTwitter(type: ComposeType, compositePost: CompositePost, signal?: AbortSignal) {
    const { chars, images, videos, postId, parentPost, restriction, poll, excludeReplyProfileIds } = compositePost;

    const twitterPostId = postId.Twitter;
    const twitterParentPost = parentPost.Twitter;
    const sourceName = resolveSourceName(Source.Twitter);

    // already posted to x
    if (twitterPostId) return;

    // login required
    const { currentProfile } = useTwitterProfileStore.getState();
    if (!currentProfile?.profileId) throw new Error(`Login required to post on ${sourceName}.`);

    const composeDraft = (postType: PostType, images: MediaObject[], videos: MediaObject[], polls?: Poll[]) => {
        if (images.some((media) => !resolveUploadId(Source.Twitter, media))) {
            throw new Error('There are images that were not uploaded successfully.');
        }
        if (videos.some((media) => !resolveUploadId(Source.Twitter, media))) {
            throw new Error('There are videos that were not uploaded successfully.');
        }

        return {
            publicationId: '',
            type: postType,
            postId: '',
            author: createDummyProfile(Source.Twitter),
            metadata: {
                locale: 'en',
                content: {
                    content: readChars(chars, 'both', Source.Twitter),
                },
            },
            mediaObjects: uniqBy(
                [...images, ...videos].map((media) => ({
                    id: resolveUploadId(Source.Twitter, media),
                    url: resolveImageUrl(Source.Twitter, media),
                    mimeType: media.mimeType,
                })),
                'id',
            ),
            restrictions: restriction ? [restriction] : undefined,
            parentPostId: twitterParentPost?.postId ?? '',
            source: Source.Twitter,
            poll: first(polls),
        } satisfies Post;
    };

    const postTo = createPostTo(Source.Twitter, {
        uploadPolls: async () => {
            if (!poll) return [];
            const pollStub = await TwitterPollProvider.createPoll(poll);
            return [pollStub];
        },
        uploadVideos: async () => {
            const video = first(videos);
            if (!video) return [];
            const uploaded = await uploadVideoToTwitter(video.file);
            return uploaded.map((x) => createTwitterMediaObject(x, video));
        },
        uploadImages: async () => {
            const downloaded = await downloadMediaObjects(images);
            const uploaded = await uploadToTwitter(downloaded.map((x) => ({ file: x.file })));
            return uploaded.map((x, index) => createTwitterMediaObject(x, downloaded[index]));
        },
        compose: (images, videos, polls) =>
            twitterSocialMediaProxy.publishPost(composeDraft('Post', images, videos, polls)),
        reply: (images, videos, polls) => {
            if (!twitterParentPost?.postId) throw new Error('No parent post found.');
            return twitterSocialMediaProxy.publishPost(composeDraft('Comment', images, videos, polls), {
                excludeReplyProfileIds,
            });
        },
        quote: (images, videos) => {
            if (!twitterParentPost?.postId) throw new Error('No parent post found.');
            return twitterSocialMediaProxy.quotePost(twitterParentPost.postId, composeDraft('Quote', images, videos));
        },
    });

    return postTo(type, compositePost);
}
