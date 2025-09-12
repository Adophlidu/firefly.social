import { FileMimeType, type SocialSource, Source } from '@/constants/enum.js';
import { UnreachableError } from '@/constants/error.js';
import { SORTED_MEDIA_SOURCES } from '@/constants/index.js';
import { createLookupTableResolver } from '@/helpers/createLookupTableResolver.js';
import { type MediaObject, MediaSource, type VideoMetadata } from '@/types/compose.js';
import type { IGif } from '@/types/giphy.js';
import type { TwitterMediaResponse } from '@/types/twitter.js';

export function createLocalMediaObject(file: File, isRpPayloadImage = false): MediaObject {
    return {
        id: crypto.randomUUID(),
        file,
        mimeType: file.type,
        urls: {
            [MediaSource.Local]: URL.createObjectURL(file),
        },
        isRpPayloadImage,
    };
}

export function createVideoMediaObject(file: File, metadata?: VideoMetadata): MediaObject {
    return {
        id: crypto.randomUUID(),
        file,
        mimeType: file.type,
        urls: {
            [MediaSource.Local]: URL.createObjectURL(file),
        },
        ...metadata,
    };
}

export function createGifMediaObject(gif: IGif): MediaObject {
    return {
        id: gif.id.toString(),
        width: gif.images.original.width,
        height: gif.images.original.height,
        file: new File([], gif.title, { type: FileMimeType.GIF }),
        mimeType: FileMimeType.GIF,
        urls: {
            [gif.source]: gif.images.original.url,
        },
        thumb: gif.source === MediaSource.Tenor ? gif.images.preview.url : undefined,
    };
}

export function createS3MediaObject(url: string, media: MediaObject): MediaObject {
    return {
        ...media,
        urls: {
            [MediaSource.S3]: url,
        },
    };
}

export function createTwitterMediaObject(twitterRes: TwitterMediaResponse, media: MediaObject): MediaObject {
    return {
        ...media,
        file: twitterRes.file,
        mimeType: twitterRes.file.type,
        uploadIds: {
            [MediaSource.Twimg]: twitterRes.media_id_string,
        },
    };
}

function resolveMediaObjectBy(key: 'urls' | 'uploadIds') {
    return function (media: MediaObject | null, sources = SORTED_MEDIA_SOURCES) {
        if (!media) return '';
        // the first source that has a url will be used as the preview
        const source = sources.find((x) => !!media[key]?.[x]);
        return source ? (media[key]?.[source] ?? '') : '';
    };
}

export const resolveMediaObjectUrl = resolveMediaObjectBy('urls');
export const resolveMediaObjectUploadId = resolveMediaObjectBy('uploadIds');

const resolveImageSources = createLookupTableResolver<SocialSource, MediaSource[]>(
    {
        [Source.Lens]: [MediaSource.IPFS, MediaSource.S3, MediaSource.Giphy, MediaSource.Tenor],
        [Source.Farcaster]: [MediaSource.S3, MediaSource.Giphy, MediaSource.Tenor],
        [Source.Twitter]: [MediaSource.Twimg],
        [Source.Bsky]: [MediaSource.S3, MediaSource.Giphy, MediaSource.Tenor],
    },
    (source) => {
        throw new UnreachableError('source', source);
    },
);

const resolveVideoSources = createLookupTableResolver<SocialSource, MediaSource[]>(
    {
        [Source.Lens]: [MediaSource.S3],
        [Source.Farcaster]: [MediaSource.S3],
        [Source.Twitter]: [MediaSource.Twimg],
        [Source.Bsky]: [MediaSource.S3],
    },
    (source) => {
        throw new UnreachableError('source', source);
    },
);

export function resolveImageUrl(source: SocialSource, media: MediaObject | null) {
    return resolveMediaObjectUrl(media, resolveImageSources(source));
}

export function resolveVideoUrl(source: SocialSource, media: MediaObject | null) {
    return resolveMediaObjectUrl(media, resolveVideoSources(source));
}

export function resolveUploadId(source: SocialSource, media: MediaObject | null) {
    return resolveMediaObjectUploadId(media, resolveImageSources(source));
}
