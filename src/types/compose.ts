import type { BlobRef } from '@atproto/api';

export type ComposeType = 'compose' | 'quote' | 'reply';

export enum MediaSource {
    Local = 'local',
    Twimg = 'Twimg',
    IPFS = 'ipfs',
    Imgur = 'imgur',
    S3 = 's3',
    Giphy = 'giphy',
    Tenor = 'tenor',
    Host = 'host',
}

export interface MediaObject {
    id: string;
    file: File;
    mimeType: string;
    urls?: Partial<Record<MediaSource, string>>;
    uploadIds?: Partial<Record<MediaSource, string>>;
    isRpPayloadImage?: boolean;
    // For bsky
    blobRef?: BlobRef;
    width?: number;
    height?: number;
    duration?: number;
    thumb?: string;
}

export interface VideoMetadata {
    duration: number;
    width: number;
    height: number;
}
