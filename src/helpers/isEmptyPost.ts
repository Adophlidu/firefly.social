import { readChars } from '@/helpers/chars.js';
import type { CompositePost } from '@/types/compose.js';

/**
 * Detect if a post is empty
 * @param post
 * @returns
 */
export function isEmptyPost(post: CompositePost) {
    const content = readChars(post.chars, 'visible');
    return !content && !post.images.length && !post.videos.length;
}
