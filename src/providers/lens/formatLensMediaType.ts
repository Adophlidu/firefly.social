import { safeUnreachable } from '@firefly/utils';
import { MediaAudioType, MediaImageType, MediaVideoType } from '@lens-protocol/client';

export function formatLensMediaAudioMimeType(type: MediaAudioType) {
    switch (type) {
        case MediaAudioType.AudioAac:
            return 'audio/aac';
        case MediaAudioType.AudioMpeg:
            return 'audio/mpeg';
        case MediaAudioType.AudioOgg:
            return 'audio/ogg';
        case MediaAudioType.AudioWav:
            return 'audio/wav';
        case MediaAudioType.AudioWebm:
            return 'audio/webm';
        case MediaAudioType.AudioFlac:
            return 'audio/flac';
        case MediaAudioType.AudioMp4:
            return 'audio/mp4';
        case MediaAudioType.AudioVndWave:
            return 'audio/vnd.wave';
        default:
            safeUnreachable(type);
            return 'audio/*';
    }
}

export function formatLensMediaImageMimeType(type: MediaImageType) {
    switch (type) {
        case MediaImageType.Bmp:
            return 'image/bmp';
        case MediaImageType.Gif:
            return 'image/gif';
        case MediaImageType.Jpeg:
            return 'image/jpeg';
        case MediaImageType.Png:
            return 'image/png';
        case MediaImageType.Heic:
            return 'image/heic';
        case MediaImageType.SvgXml:
            return 'image/svg+xml';
        case MediaImageType.Tiff:
            return 'image/tiff';
        case MediaImageType.Webp:
            return 'image/webp';
        case MediaImageType.XMsBmp:
            return 'image/x-ms-bmp';
        default:
            safeUnreachable(type);
            return 'image/*';
    }
}

export function formatLensMediaVideoMimeType(type: MediaVideoType) {
    switch (type) {
        case MediaVideoType.VideoMov:
            return 'video/quicktime';
        case MediaVideoType.VideoMp4:
            return 'video/mp4';
        case MediaVideoType.VideoMpeg:
            return 'video/mpeg';
        case MediaVideoType.VideoOgg:
            return 'video/ogg';
        case MediaVideoType.VideoWebm:
            return 'video/webm';
        case MediaVideoType.VideoOgv:
            return 'video/ogg';
        case MediaVideoType.VideoQuicktime:
            return 'video/quicktime';
        case MediaVideoType.VideoXm4v:
        case MediaVideoType.ModelGltfBinary:
        case MediaVideoType.ModelGltfJson:
            return 'video/*';
        default:
            safeUnreachable(type);
            return 'video/*';
    }
}
