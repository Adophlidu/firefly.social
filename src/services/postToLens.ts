import {
    image,
    link,
    type MediaImage,
    MediaImageMimeType,
    MediaVideoMimeType,
    textOnly,
    type URI,
    video,
} from '@lens-protocol/metadata';
import { first } from 'lodash-es';
import { v4 as uuid } from 'uuid';

import { HOME_CLUB } from '@/constants/channel.js';
import { RestrictionType, Source, SourceInURL } from '@/constants/enum.js';
import { readChars } from '@/helpers/chars.js';
import { createDummyPost } from '@/helpers/createDummyPost.js';
import { detectMentionsForLens } from '@/helpers/detectMentions.js';
import { ensureLensResultSync } from '@/helpers/ensureLensResult.js';
import { getUserLocale } from '@/helpers/getUserLocale.js';
import { createS3MediaObject, resolveImageUrl, resolveVideoUrl } from '@/helpers/resolveMediaObjectUrl.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { uploadVideoCover } from '@/helpers/uploadVideoCover.js';
import { GroveStorageProvider } from '@/providers/lens/Grove.js';
import { LensPollProvider } from '@/providers/lens/Poll.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
import { LensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';
import type { Channel, ProfileGroup } from '@/providers/types/SocialMedia.js';
import { createPostTo } from '@/services/createPostTo.js';
import { uploadAndConvertToM3u8 } from '@/services/uploadAndConvertToM3u8.js';
import { uploadToArweave } from '@/services/uploadToArweave.js';
import { uploadToS3 } from '@/services/uploadToS3.js';
import { type CompositePost } from '@/store/useComposeStore.js';
import { useLensStateStore } from '@/store/useProfileStore.js';
import { type ComposeType, type MediaObject } from '@/types/compose.js';

interface BaseMetadata {
    title: string;
    content: string;
    tags?: string[];
    groups?: ProfileGroup[];
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

export function createPostMetadata(metadata: BaseMetadata, attachments?: Attachments, sharingLink?: string) {
    const localBaseMetadata = {
        id: uuid(),
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
                    item: attachment.item as URI,
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
                    item: attachment.item as URI,
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
                item: attachment.item as URI,
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

export type GetPostMetaData = ReturnType<typeof createPostMetadata>;

async function uploadPostMetadata(metadata: GetPostMetaData) {
    const credentials = ensureLensResultSync(lensSessionHolder.sessionClient.getCredentials());
    if (!credentials) {
        throw new Error('No credentials found');
    }

    const arweaveId = await uploadToArweave(metadata, credentials.accessToken);
    return `ar://${arweaveId}`;
}

async function publishPostForLens(
    profileId: string,
    content: string,
    images: MediaObject[],
    video: MediaObject | null,
    channel?: Channel | null,
    restrictions?: RestrictionType[],
) {
    const profile = await LensSocialMediaProvider.getProfileById(profileId);
    const title = `Post by #${profile.handle}`;
    const metadata = createPostMetadata(
        {
            title,
            content,
            groups: channel?.group ? [channel.group] : undefined,
        },
        await createPayloadAttachments(images, video),
    );

    const contentURI = await GroveStorageProvider.uploadJson(metadata);
    const publicationId = await LensSocialMediaProvider.publishPost({
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
        channel: channel && channel?.id !== HOME_CLUB.id ? channel : undefined,
    });
    return publicationId;
}

async function commentPostForLens(
    profileId: string,
    postId: string,
    content: string,
    images: MediaObject[],
    video: MediaObject | null,
) {
    const profile = await LensSocialMediaProvider.getProfileById(profileId);

    const title = `Post by #${profile.handle}`;
    const metadata = createPostMetadata(
        {
            title,
            content,
        },
        await createPayloadAttachments(images, video),
    );

    const contentURI = await GroveStorageProvider.uploadJson(metadata);
    return LensSocialMediaProvider.commentPost(postId, createDummyPost(Source.Lens, contentURI.uri), profile.signless);
}

async function quotePostForLens(
    profileId: string,
    postId: string,
    content: string,
    images: MediaObject[],
    video: MediaObject | null,
    restrictions?: RestrictionType[],
) {
    const profile = await LensSocialMediaProvider.getProfileById(profileId);

    const title = `Post by #${profile.handle}`;
    const metadata = createPostMetadata(
        {
            title,
            content,
        },
        await createPayloadAttachments(images, video),
    );

    const contentURI = await GroveStorageProvider.uploadJson(metadata);
    const post = await LensSocialMediaProvider.quotePost(
        postId,
        {
            ...createDummyPost(Source.Lens, contentURI.uri),
            restrictions,
        },
        profile.signless,
    );
    return post;
}

export async function postToLens(type: ComposeType, compositePost: CompositePost, signal?: AbortSignal) {
    const { chars, images, postId, parentPost, video, poll, channel, restriction } = compositePost;

    const lensPostId = postId.Lens;
    const lensParentPost = parentPost.Lens;
    const sourceName = resolveSourceName(Source.Lens);

    // already posted to lens
    if (lensPostId) return;

    // login required
    const { currentProfile } = useLensStateStore.getState();
    if (!currentProfile?.profileId) throw new Error(`Login required to post on ${sourceName}.`);

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
                (video?.file ? [video] : []).map(async (media) => {
                    if (resolveVideoUrl(Source.Lens, media)) return media;
                    return createS3MediaObject(
                        await uploadAndConvertToM3u8(media.file, SourceInURL.Lens, signal),
                        media,
                    );
                }),
            );
        },
        uploadPolls: async () => {
            if (!poll) return [];
            const pollStub = await LensPollProvider.createPoll(poll, readChars(newChars, 'both', Source.Lens));
            return [pollStub];
        },
        compose(images, videos) {
            const video = first(videos) ?? null;
            return publishPostForLens(
                currentProfile.profileId,
                readChars(newChars, 'both', Source.Lens),
                images,
                video,
                channel[Source.Lens],
                [restriction],
            );
        },
        reply(images, videos) {
            if (!lensParentPost) throw new Error('No parent post found.');
            const video = first(videos) ?? null;
            return commentPostForLens(
                currentProfile.profileId,
                lensParentPost.postId,
                readChars(newChars, 'both', Source.Lens),
                images,
                video,
            );
        },
        quote(images, videos) {
            if (!lensParentPost) throw new Error('No parent post found.');
            const video = first(videos) ?? null;
            return quotePostForLens(
                currentProfile.profileId,
                lensParentPost.postId,
                readChars(newChars, 'both', Source.Lens),
                images,
                video,
                [restriction],
            );
        },
    });

    return postTo(type, compositePost);
}
