import type { UploadMediaStatus } from '@dimensiondev/enums';

export interface TwitterMediaResponse {
    file: File;
    media_id: string;
    media_id_string: string;
}

export interface UploadMediaResponse {
    media_id: string;
    media_id_string: string;
    size: number;
    expires_after_secs: number;
}

export interface UploadMediaResponseV2 {
    id: string;
    media_key: string;
    expires_after_secs: number;
}

export interface GetUploadStatusResponse {
    media_id: string;
    media_id_string: string;
    expires_after_secs?: number;
    processing_info: {
        state: UploadMediaStatus;
        progress_percent: number;
        check_after_secs?: number;
        error?: {
            code: number;
            name: string;
            message: string;
        };
    };
}

export interface FinishUploadResponseV2 {
    id: string;
    media_key: string;
    size: number;
    expires_after_secs: number;
    processing_info: {
        state: UploadMediaStatus;
        check_after_secs: number;
    };
}

export interface GetUploadStatusResponseV2 {
    id: string;
    media_key: string;
    processing_info: {
        state: UploadMediaStatus;
        check_after_secs?: number;
        error?: { message: string };
    };
}

declare module 'twitter-api-v2' {
    interface TweetV2 {
        /** patched Post['sendFrom'] to TweetV2 by our own API. */
        sendFrom?: {
            displayName?: string;
            name?: string;
        };
        /** patched from v1 lookup for authenticated viewer retweet state. */
        retweeted?: boolean;
    }
    interface TweetArticleV2 {
        /** patched article title from our own API; not yet typed by twitter-api-v2. */
        title: string;
    }
}
