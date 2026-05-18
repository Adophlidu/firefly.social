import type { RestrictionType } from '@dimensiondev/enums';
import { SessionType, Source, SourceInURL } from '@dimensiondev/enums';
import { runInSafeAsync } from '@dimensiondev/utils';
import { first } from 'lodash-es';

import { HOME_CLUB } from '@/constants/channel.js';
import { readChars } from '@/helpers/chars.js';
import { createDummyPost } from '@/helpers/createDummyPost.js';
import { detectMentionsForLens } from '@/helpers/detectMentions.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { getUserLocale } from '@/helpers/getUserLocale.js';
import { createS3MediaObject, resolveImageUrl, resolveVideoUrl } from '@/helpers/resolveMediaObjectUrl.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { uploadVideoCover } from '@/helpers/uploadVideoCover.js';
import { getLensProfileById } from '@/providers/lens/getLensProfileById.js';
import { GroveStorageProvider } from '@/providers/lens/Grove.js';
import type { MediaImage, MediaImageMimeType, MediaVideoMimeType } from '@/providers/lens/metadata/post/Base.js';
import { image } from '@/providers/lens/metadata/post/Image.js';
import { link } from '@/providers/lens/metadata/post/Link.js';
import { textOnly } from '@/providers/lens/metadata/post/TextOnly.js';
import { video } from '@/providers/lens/metadata/post/Video.js';
import { lensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';
import { createPollPost } from '@/providers/orb/createPollPost.js';
import type { CompositePoll } from '@/providers/types/Poll.js';
import type { Channel } from '@/providers/types/SocialMedia.js';
import { createPostTo } from '@/services/createPostTo.js';
import { uploadAndConvertToM3u8 } from '@/services/uploadAndConvertToM3u8.js';
import { uploadToS3 } from '@/services/uploadToS3.js';
import type { MediaObject, PostFunctionParams } from '@/types/compose.js';

interface BaseMetadata {
    title: string;
    content: string;
    tags?: string[];
}

interface Attachments {
    image?: {
        item: string;
        type: string;
    };
    video?: {
        item: string;
        type: string;
        duration?: number;
        cover?: string;
    };
    attachments: Array<{
        item: string;
        type: string;
        /** cover url */
        cover?: string;
    }>;
}

export async function createPayloadAttachments(
    images: MediaObject[],
    video: MediaObject | null,
): Promise<Attachments | undefined> {
    if (
        images.some((image) => !resolveImageUrl(Source.Lens, image)) ||
        (video && !resolveVideoUrl(Source.Lens, video))
    ) {
        throw new Error('There are images or videos that were not uploaded successfully.');
    }

    const imagesWithIPFS = images as Array<Required<MediaObject>>;
    const videoWithIPFS = video as Required<MediaObject> | null;

    const cover = videoWithIPFS ? await uploadVideoCover(videoWithIPFS) : undefined;

    return imagesWithIPFS.length > 0 || !!videoWithIPFS
        ? {
              attachments: videoWithIPFS
                  ? [
                        {
                            type: videoWithIPFS.mimeType,
                            item: resolveVideoUrl(Source.Lens, videoWithIPFS),
                            cover,
                        },
                    ]
                  : imagesWithIPFS.map((image) => ({
                        type: image.mimeType,
                        item: resolveImageUrl(Source.Lens, image),
                        cover: resolveImageUrl(Source.Lens, imagesWithIPFS[0]),
                    })),
              ...(videoWithIPFS
                  ? {
                        video: {
                            type: videoWithIPFS.mimeType,
                            item: resolveVideoUrl(Source.Lens, videoWithIPFS),
                            cover,
                        },
                    }
                  : {
                        image: {
                            type: imagesWithIPFS[0].mimeType,
                            item: resolveImageUrl(Source.Lens, imagesWithIPFS[0]),
                        },
                    }),
          }
        : undefined;
}

export function createLensPostMetadata(metadata: BaseMetadata, attachments?: Attachments, sharingLink?: string) {
    const localBaseMetadata = {
        id: crypto.randomUUID(),
        locale: getUserLocale(),
    };

    const baseMetadata = {
        title: metadata.title,
        content: metadata.content || undefined,
        tags: metadata.tags,
    };

    if (attachments) {
        if (attachments.image) {
            return image({
                ...baseMetadata,
                ...localBaseMetadata,
                image: {
                    item: attachments.image.item,
                    type: attachments.image.type as MediaImageMimeType,
                },
                attachments: attachments.attachments.map<MediaImage>((attachment) => ({
                    item: attachment.item,
                    type: attachment.type as MediaImageMimeType,
                })),
            });
        }

        if (attachments.video) {
            return video({
                ...baseMetadata,
                ...localBaseMetadata,
                video: {
                    item: attachments.video.item,
                    type: attachments.video.type as MediaVideoMimeType,
                    duration: attachments.video.duration,
                },
                attachments: attachments.attachments.map<MediaImage>((attachment) => ({
                    item: attachment.item,
                    type: attachment.type as MediaImageMimeType,
                })),
            });
        }
    }

    if (sharingLink) {
        return link({
            ...baseMetadata,
            ...localBaseMetadata,
            sharingLink,
            attachments: attachments?.attachments.map<MediaImage>((attachment) => ({
                item: attachment.item,
                type: attachment.type as MediaImageMimeType,
            })),
        });
    }

    return textOnly({
        ...baseMetadata,
        ...localBaseMetadata,
        content: baseMetadata.content || '',
    });
}

function resolveValidChannel(channel: Channel | null) {
    return channel && channel?.id !== HOME_CLUB.id ? channel : undefined;
}

async function publishPostForLens(
    profileId: string,
    content: string,
    images: MediaObject[],
    video: MediaObject | null,
    channel: Channel | null,
    poll: CompositePoll | null,
    restrictions?: RestrictionType[],
) {
    if (poll) {
        const result = await createPollPost(content, poll);
        return result;
    }

    const profile = await getLensProfileById(profileId);
    const title = `Post by #${profile.handle}`;
    const metadata = createLensPostMetadata(
        {
            title,
            content,
        },
        await createPayloadAttachments(images, video),
    );

    const contentURI = await GroveStorageProvider.uploadJson(metadata);
    const publicationId = await lensSocialMediaProvider.publishPost({
        publicationId: '',
        postId: metadata.lens.id,
        author: profile,
        metadata: {
            locale: metadata.lens.locale,
            contentURI: contentURI.uri,
            content: null,
        },
        source: Source.Lens,
        restrictions,
        channel: resolveValidChannel(channel),
    });
    return publicationId;
}

async function commentPostForLens(
    profileId: string,
    postId: string,
    content: string,
    images: MediaObject[],
    video: MediaObject | null,
    channel: Channel | null,
) {
    const profile = await getLensProfileById(profileId);

    const title = `Post by #${profile.handle}`;
    const metadata = createLensPostMetadata(
        {
            title,
            content,
        },
        await createPayloadAttachments(images, video),
    );

    const contentURI = await GroveStorageProvider.uploadJson(metadata);
    return lensSocialMediaProvider.commentPostWithSignless(
        postId,
        {
            ...createDummyPost(Source.Lens, contentURI.uri),
        },
        profile.signless,
    );
}

async function quotePostForLens(
    profileId: string,
    postId: string,
    content: string,
    images: MediaObject[],
    video: MediaObject | null,
    channel: Channel | null,
    restrictions?: RestrictionType[],
) {
    const profile = await getLensProfileById(profileId);

    const title = `Post by #${profile.handle}`;
    const metadata = createLensPostMetadata(
        {
            title,
            content,
        },
        await createPayloadAttachments(images, video),
    );

    const contentURI = await GroveStorageProvider.uploadJson(metadata);
    const post = await lensSocialMediaProvider.quotePost(postId, {
        ...createDummyPost(Source.Lens, contentURI.uri),
        restrictions,
        channel: resolveValidChannel(channel),
    });
    return post;
}

export async function postToLens({ type, compositePost, keepPostLinks, signal }: PostFunctionParams) {
    const { chars, images, postId, parentPost, videos, poll, channel, restriction } = compositePost;

    const lensPostId = postId.Lens;
    const lensParentPost = parentPost.Lens;
    const sourceName = resolveSourceName(Source.Lens);

    // already posted to lens
    if (lensPostId) return;

    // login required
    const session = getSessionFromStorage(SessionType.Lens);
    if (!session?.profileId) throw new Error(`Login required to post on ${sourceName}.`);

    const newChars = (await runInSafeAsync(() => detectMentionsForLens(chars))) || chars;

    const postTo = createPostTo(Source.Lens, {
        uploadImages() {
            return Promise.all(
                images.map(async (media) => {
                    if (resolveImageUrl(Source.Lens, media)) return media;
                    return createS3MediaObject(await uploadToS3(media.file, SourceInURL.Lens), media);
                }),
            );
        },
        uploadVideos() {
            return Promise.all(
                videos.map(async (media) => {
                    if (resolveVideoUrl(Source.Lens, media)) return media;
                    return createS3MediaObject(
                        await uploadAndConvertToM3u8(media.file, SourceInURL.Lens, signal),
                        media,
                    );
                }),
            );
        },
        compose(images, videos) {
            const video = first(videos) ?? null;
            return publishPostForLens(
                session.profileId,
                readChars({ chars: newChars, strategy: 'both', source: Source.Lens, keepPostLinks }),
                images,
                video,
                channel[Source.Lens],
                poll,
                [restriction],
            );
        },
        reply(images, videos) {
            if (!lensParentPost) throw new Error('No parent post found.');
            const video = first(videos) ?? null;
            return commentPostForLens(
                session.profileId,
                lensParentPost.postId,
                readChars({ chars: newChars, strategy: 'both', source: Source.Lens, keepPostLinks }),
                images,
                video,
                channel[Source.Lens],
            );
        },
        quote(images, videos) {
            if (!lensParentPost) throw new Error('No parent post found.');
            const video = first(videos) ?? null;
            return quotePostForLens(
                session.profileId,
                lensParentPost.postId,
                readChars({ chars: newChars, strategy: 'both', source: Source.Lens, keepPostLinks }),
                images,
                video,
                channel[Source.Lens],
                [restriction],
            );
        },
    });

    return postTo(type, compositePost);
}
