export const YOUTUBE_URL_REGEX = /^https?:\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w-]+)(?:\?.*)?$/;
export const YOUTUBE_SHORT_URL_REGEX = /^https?:\/\/(?:www\.)?youtu(?:be\.com\/shorts\/|\.be\/)([\w-]+)(?:\?.*)?$/;

export function isYouTubeUrl(url: string) {
    return YOUTUBE_URL_REGEX.test(url) || YOUTUBE_SHORT_URL_REGEX.test(url);
}
