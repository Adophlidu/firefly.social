import { FileMimeType, FireflyPlatform, Source } from '@dimensiondev/enums';
import { runInSafeAsync } from '@dimensiondev/utils';

import { BSKY_IMAGE_LIMITATION, BSKY_SHORT_POST_LIMIT, MAX_IMAGE_SIZE_PER_POST } from '@/constants/limitation.js';
import { readChars } from '@/helpers/chars.js';
import { compressImage } from '@/helpers/compressImage.js';
import { downloadMediaObjects } from '@/helpers/downloadMediaObjects.js';
import { formatFireflyPostUrl } from '@/helpers/formatFireflyPostUrl.js';
import { getCompositePost } from '@/helpers/getCompositePost.js';
import { getVideoMetadata } from '@/helpers/getVideoMetadata.js';
import { resolveImageUrl } from '@/helpers/resolveMediaObjectUrl.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { truncateTextForBsky } from '@/helpers/truncateTextForBsky.js';
import { PostAtUri } from '@/providers/bsky/AtUri.js';
import { createBskyMediaObject } from '@/providers/bsky/createBskyMediaObject.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import { bskySocialMediaProvider } from '@/providers/bsky/SocialMedia.js';
import { uploadVideoToBsky } from '@/providers/bsky/uploadVideoToBsky.js';
import { postArticle } from '@/providers/firefly/article/postArticle.js';
import { updateArticle } from '@/providers/firefly/article/updateArticle.js';
import type { Post, PostType } from '@/providers/types/SocialMedia.js';
import { createPostTo } from '@/services/createPostTo.js';
import { useBskyProfileStore } from '@/store/useProfileStore/useBskyProfileStore.js';
import type { MediaObject, PostFunctionParams } from '@/types/compose.js';

export async function postToBsky({
    type,
    compositePost,
    keepPostLinks,
    signal,
}: PostFunctionParams): Promise<string | undefined> {
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

    const composeDraft = async (postType: PostType, images: MediaObject[], videos: MediaObject[]) => {
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
                    content: readChars({ chars, strategy: 'both', source: Source.Bsky, keepPostLinks }),
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

    const handleLongPost = async (
        postType: PostType,
        images: MediaObject[],
        videos: MediaObject[],
        publishFn: (draft: Post) => Promise<{ postId: string; contentURI?: string }>,
    ): Promise<{ postId: string; contentURI?: string }> => {
        const textContent = readChars({ chars, strategy: 'visible', source: Source.Bsky, keepPostLinks });
        const textLength = textContent.length;

        if (textLength > BSKY_SHORT_POST_LIMIT) {
            const { articleId } = await postArticle('', textContent, currentProfile.profileId);

            const fireflyArticleUrl = formatFireflyPostUrl(Source.Bsky, articleId);

            const truncatedContent = truncateTextForBsky(textContent, fireflyArticleUrl);

            const draftWithTruncatedText = await composeDraft(postType, images, videos);
            draftWithTruncatedText.metadata.content = {
                content: truncatedContent,
            };

            const result = await publishFn(draftWithTruncatedText);

            if (result.contentURI) {
                await runInSafeAsync(() =>
                    updateArticle(articleId, FireflyPlatform.Bsky, PostAtUri.from(result.contentURI!).toId()),
                );
            }

            return result;
        }

        const draft = await composeDraft(postType, images, videos);
        return publishFn(draft);
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
                    const { data } = await bskySessionHolder.agent.uploadBlob(file, { signal });
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
            return handleLongPost('Post', images, videos, (draft) =>
                bskySocialMediaProvider.publishPost(draft, signal),
            );
        },
        async reply(images, videos) {
            if (
                !bskyParentPost?.postId ||
                !bskyParentPost.metadata?.contentURI ||
                !bskyRootPostId ||
                !bskyRootPostContentURI
            )
                throw new Error('No parent post found.');

            return handleLongPost('Comment', images, videos, (draft) =>
                bskySocialMediaProvider.publishPost(draft, signal),
            );
        },
        async quote(images, videos) {
            if (
                !bskyParentPost?.postId ||
                !bskyParentPost.metadata?.contentURI ||
                !bskyRootPostId ||
                !bskyRootPostContentURI
            )
                throw new Error('No parent post found.');

            return handleLongPost('Quote', images, videos, (draft) =>
                bskySocialMediaProvider.quotePost(bskyParentPost.postId, draft, undefined, signal),
            );
        },
    });

    return postTo(type, compositePost);
}
