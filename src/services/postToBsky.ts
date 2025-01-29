import { t } from '@lingui/core/macro';

import { Source } from '@/constants/enum.js';
import { NotImplementedError } from '@/constants/error.js';
import { MAX_IMAGE_SIZE_PER_POST } from '@/constants/limitation.js';
import { readChars } from '@/helpers/chars.js';
import { downloadMediaObjects } from '@/helpers/downloadMediaObjects.js';
import { getCompositePost } from '@/helpers/getCompositePost.js';
import { getVideoMetadata } from '@/helpers/getVideoMetadata.js';
import { createBskyMediaObject } from '@/helpers/resolveMediaObjectUrl.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import { BskySocialMediaProvider } from '@/providers/bsky/SocialMedia.js';
import type { Poll } from '@/providers/types/Poll.js';
import type { Post, PostType } from '@/providers/types/SocialMedia.js';
import { createPostTo } from '@/services/createPostTo.js';
import { type CompositePost } from '@/store/useComposeStore.js';
import { useBskyStateStore } from '@/store/useProfileStore.js';
import { type ComposeType, type MediaObject } from '@/types/compose.js';

export async function postToBsky(
    type: ComposeType,
    compositePost: CompositePost,
    signal?: AbortSignal,
): Promise<string | undefined> {
    const { id, chars, images, video, postId, parentPost } = compositePost;

    const bskyPostId = postId.Bsky;
    const bskyParentPost = parentPost.Bsky;
    const rootPost = getCompositePost(id)?.rootPost;
    const bskyRootPostId = rootPost?.postId?.Bsky;
    const bskyRootContentURI = rootPost?.postContentURI?.Bsky;
    const sourceName = resolveSourceName(Source.Bsky);

    if (bskyPostId) return;

    const { currentProfile } = useBskyStateStore.getState();
    if (!currentProfile?.profileId) throw new Error(t`Login required to post on ${sourceName}.`);

    const composeDraft = (postType: PostType, images: MediaObject[], videos: MediaObject[], polls?: Poll[]) => {
        if (images.some((media) => !media.blobRef)) {
            throw new Error('There are images that were not uploaded successfully.');
        }

        return {
            publicationId: '',
            type: postType,
            postId: '',
            source: Source.Bsky,
            author: currentProfile,
            parentPostId: bskyParentPost?.postId ?? '',
            parentContentURI: bskyParentPost?.metadata?.contentURI ?? '',
            rootPostId: bskyRootPostId ?? '',
            rootContentURI: bskyRootContentURI ?? '',
            metadata: {
                locale: '',
                content: {
                    content: readChars(chars, 'both', Source.Bsky),
                },
            },
            mediaObjects: [
                ...images.map((media) => ({
                    blobRef: media.blobRef,
                    url: media.blobRef?.ref,
                    type: 'Image' as const,
                })),
                ...videos.map((media) => ({
                    blobRef: media.blobRef,
                    url: media.blobRef?.ref,
                    type: 'Video' as const,
                    width: media.width,
                    height: media.height,
                })),
            ].slice(0, MAX_IMAGE_SIZE_PER_POST[Source.Bsky]),
        } satisfies Post;
    };

    const postTo = createPostTo(Source.Bsky, {
        uploadImages: async () => {
            if (!images.length) return [];
            const downloaded = await downloadMediaObjects(images);
            const results = await Promise.all(
                downloaded.map(async (media) => {
                    const { data } = await bskySessionHolder.agent.uploadBlob(media.file);
                    return createBskyMediaObject(media, data.blob);
                }),
            );
            return results;
        },
        uploadVideos: async () => {
            if (!video) return [];
            const downloaded = await downloadMediaObjects([video]);
            const results = await Promise.all(
                downloaded.map(async (media) => {
                    const videoInfo = await runInSafeAsync(() => getVideoMetadata(media.file));
                    const { data } = await bskySessionHolder.agent.uploadBlob(media.file);
                    return createBskyMediaObject(media, data.blob, videoInfo?.width, videoInfo?.height);
                }),
            );
            return results;
        },
        uploadPolls: async () => {
            return [];
        },
        compose: async (images, videos) => {
            return BskySocialMediaProvider.publishPost(composeDraft('Post', images, videos));
        },
        reply(images, videos) {
            if (
                !bskyParentPost?.postId ||
                !bskyParentPost.metadata?.contentURI ||
                !bskyRootPostId ||
                !bskyRootContentURI
            )
                throw new Error(t`No parent post found.`);
            return BskySocialMediaProvider.publishPost(composeDraft('Comment', images, videos));
        },
        quote(images, videos) {
            if (!bskyParentPost?.postId || !bskyParentPost.metadata?.contentURI)
                throw new Error(t`No parent post found.`);
            throw new NotImplementedError('quote');
        },
    });

    return postTo(type, compositePost);
}
