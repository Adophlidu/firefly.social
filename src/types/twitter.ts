import type { UploadMediaStatus } from '@/constants/enum.js';

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
