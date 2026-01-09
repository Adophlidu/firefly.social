import { Source, SourceInURL } from '@/constants/enum.js';
import { readChars } from '@/helpers/chars.js';
import { getCurrentProfileFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';
import { createS3MediaObject, resolveImageUrl } from '@/helpers/resolveMediaObjectUrl.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { createPostFragments } from '@/providers/lens/fragments/post/CreatePost.js';
import { GroveStorageProvider } from '@/providers/lens/Grove.js';
import { createLensPostMetadata, createPayloadAttachments } from '@/providers/lens/postToLens.js';
import { uploadAndConvertToM3u8 } from '@/services/uploadAndConvertToM3u8.js';
import { uploadToS3 } from '@/services/uploadToS3.js';
import { type ComposeType, type CompositePost } from '@/types/compose.js';

export interface LensSchedulePayload {
    operationName: 'CreatePost';
    variables: {
        request: {
            contentUri: string;
            quoteOf?: {
                post: string;
            };
            commentOn?: {
                post: string;
            };
        };
    };
    query: string;
}

export async function createLensSchedulePostPayload(
    type: ComposeType,
    compositePost: CompositePost,
    isThread = false,
    signal?: AbortSignal,
): Promise<LensSchedulePayload> {
    const { images, videos, chars, parentPost } = compositePost;

    const lensParentPost = parentPost.Lens;
    const sourceName = resolveSourceName(Source.Lens);

    const imageResults = await Promise.all(
        images.map(async (media) => {
            if (resolveImageUrl(Source.Lens, media)) return media;
            return createS3MediaObject(await uploadToS3(media.file, SourceInURL.Lens), media);
        }),
    );

    const video = videos[0];
    const videoResult = video?.file
        ? createS3MediaObject(await uploadAndConvertToM3u8(video.file, SourceInURL.Lens, signal), video)
        : null;

    const currentProfile = getCurrentProfileFromStorage(Source.Lens);
    if (!currentProfile?.profileId) throw new Error(`Login required to schedule post on ${sourceName}`);

    const metadata = createLensPostMetadata(
        {
            title: `Post by #${currentProfile.handle}`,
            content: readChars(chars, 'both', Source.Lens),
        },
        await createPayloadAttachments(imageResults, videoResult),
    );

    const contentURI = await GroveStorageProvider.uploadJson(metadata);

    const commentOn =
        type === 'reply'
            ? lensParentPost
                ? lensParentPost.postId
                : isThread
                  ? '$$commentOn$$'
                  : undefined
            : undefined;

    return {
        operationName: 'CreatePost',
        variables: {
            request: {
                contentUri: contentURI.uri,
                quoteOf: type === 'quote' && lensParentPost ? { post: lensParentPost.postId } : undefined,
                commentOn: commentOn
                    ? {
                          post: commentOn,
                      }
                    : undefined,
            },
        },
        query: createPostFragments,
    };
}
