import { Source } from '@/constants/enum.js';
import { getCurrentProfileFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export function canQuotePost(post: Post) {
    if (post.source !== Source.Twitter) return true;

    const currentProfile = getCurrentProfileFromStorage(post.source);
    if (!currentProfile) return false;

    if (isSameProfile(post.author, currentProfile)) return true;

    if (post.mentions?.some((mention) => isSameProfile(mention, currentProfile))) return true;

    if (post.quoteOn && isSameProfile(post.quoteOn.author, currentProfile)) return true;

    return false;
}
