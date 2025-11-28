import { FileMimeType, Source } from '@/constants/enum.js';
import { BSKY_IMAGE_LIMITATION, MAX_IMAGE_SIZE_PER_POST } from '@/constants/limitation.js';
import { readChars } from '@/helpers/chars.js';
import { compressImage } from '@/helpers/compressImage.js';
import { downloadMediaObjects } from '@/helpers/downloadMediaObjects.js';
import { getCompositePost } from '@/helpers/getCompositePost.js';
import { getVideoMetadata } from '@/helpers/getVideoMetadata.js';
import { resolveImageUrl } from '@/helpers/resolveMediaObjectUrl.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { createBskyMediaObject } from '@/providers/bsky/createBskyMediaObject.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import { bskySocialMediaProvider } from '@/providers/bsky/SocialMedia.js';
import { uploadVideoToBsky } from '@/providers/bsky/uploadVideoToBsky.js';
import type { Poll } from '@/providers/types/Poll.js';
import type { Post, PostType } from '@/providers/types/SocialMedia.js';
import { createPostTo } from '@/services/createPostTo.js';
import { type CompositePost } from '@/store/useComposeStore.js';
import { useBskyProfileStore } from '@/store/useProfileStore/useBskyProfileStore.js';
import { type ComposeType, type MediaObject } from '@/types/compose.js';

export async function postToBsky(
    type: ComposeType,
    compositePost: CompositePost,
    signal?: AbortSignal,
): Promise<string | undefined> {
    const { id, chars, images, videos, postId, parentPost, restriction } = compositePost;

    const bskyParentPost = parentPost.Bsky;
    const bskyPostId = postId.Bsky;
    const rootPost = getCompositePost(id);
    const bskyRootPostId =
        bskyParentPost?.type === 'Quote'
            ? bskyParentPost?.publicationId
            : (rootPost?.rootPost.postId.Bsky ?? bskyParentPost?.rootPostId ?? bskyParentPost?.publicationId ?? '');
    const bskyRootPostContentURI =
        bskyParentPost?.type === 'Quote'
            ? bskyParentPost?.metadata?.contentURI
            : (rootPost?.rootPost.postContentURI.Bsky ??
              bskyParentPost?.rootContentURI ??
              bskyParentPost?.metadata?.contentURI ??
              '');
    const sourceName = resolveSourceName(Source.Bsky);

    if (bskyPostId) return;

    const { currentProfile } = useBskyProfileStore.getState();
    if (!currentProfile?.profileId) throw new Error(`Login required to post on ${sourceName}.`);

    const composeDraft = async (postType: PostType, images: MediaObject[], videos: MediaObject[], polls?: Poll[]) => {
        if (images.some((media) => !media.blobRef)) {
            throw new Error('There are images that were not uploaded successfully.');
        }

        return {
            publicationId: '',
            type: postType,
            postId: '',
            source: Source.Bsky,
            author: currentProfile,
            parentPostId: bskyParentPost?.publicationId ?? '',
            parentContentURI: bskyParentPost?.metadata?.contentURI ?? '',
            rootPostId: bskyRootPostId,
            rootContentURI: bskyRootPostContentURI,
            restrictions: restriction ? [restriction] : undefined,
            metadata: {
                locale: '',
                content: {
                    content: readChars(chars, 'both', Source.Bsky),
                },
            },
            mediaObjects: [
                ...images.map((media) => ({
                    blobRef: media.blobRef,
                    url: resolveImageUrl(Source.Bsky, media),
                    mimeType: media.mimeType || media.file.type,
                    title: media.file.name,
                    type: 'Image' as const,
                    width: media.width,
                    height: media.height,
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
            const downloaded = await downloadMediaObjects(images, true);
            const results = await Promise.all(
                downloaded.map(async (media) => {
                    const { file, width, height } = await compressImage(media.file, {
                        ...BSKY_IMAGE_LIMITATION,
                        format: FileMimeType.JPEG,
                    });
                    const { data } = await bskySessionHolder.agent.uploadBlob(file);
                    return createBskyMediaObject(
                        {
                            ...media,
                            file,
                            mimeType: media.mimeType === FileMimeType.GIF ? FileMimeType.GIF : file.type,
                        },
                        data.blob,
                        width,
                        height,
                    );
                }),
            );
            return results;
        },
        uploadVideos: async () => {
            if (!videos.length) return [];
            const downloaded = await downloadMediaObjects(videos);
            const results = await Promise.all(
                downloaded.map(async (media) => {
                    const videoInfo = await runInSafeAsync(() => getVideoMetadata(media.file));
                    const blobRef = await uploadVideoToBsky(media.file, signal);
                    return createBskyMediaObject(media, blobRef, videoInfo?.width, videoInfo?.height);
                }),
            );
            return results;
        },
        uploadPolls: async () => {
            return [];
        },
        async compose(images, videos) {
            const draft = await composeDraft('Post', images, videos);
            return bskySocialMediaProvider.publishPost(draft);
        },
        async reply(images, videos) {
            if (
                !bskyParentPost?.postId ||
                !bskyParentPost.metadata?.contentURI ||
                !bskyRootPostId ||
                !bskyRootPostContentURI
            )
                throw new Error('No parent post found.');
            const draft = await composeDraft('Comment', images, videos);
            return bskySocialMediaProvider.publishPost(draft);
        },
        async quote(images, videos) {
            if (
                !bskyParentPost?.postId ||
                !bskyParentPost.metadata?.contentURI ||
                !bskyRootPostId ||
                !bskyRootPostContentURI
            )
                throw new Error('No parent post found.');
            const draft = await composeDraft('Quote', images, videos);
            return bskySocialMediaProvider.quotePost(bskyParentPost.postId, draft);
        },
    });

    return postTo(type, compositePost);
}
