import { YOUTUBE_SHORT_URL_REGEX, YOUTUBE_URL_REGEX } from '@/constants/regexp.js';

export function isYouTubeUrl(url: string) {
    return YOUTUBE_URL_REGEX.test(url) || YOUTUBE_SHORT_URL_REGEX.test(url);
}
