import { BSKY_POST_REGEXP } from '@/constants/regexp.js';
import { convertBskyHandleToDid } from '@/providers/bsky/convertBskyHandleToDid.js';
import { BskySocialMediaProvider } from '@/providers/bsky/SocialMedia.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export async function digestBskyPostLink(url: string): Promise<Post | null> {
    const [, handle, postId] = url.match(BSKY_POST_REGEXP) || [];
    if (!handle || !postId) return null;

    const did = await convertBskyHandleToDid(handle);
    if (!did) return null;

    return BskySocialMediaProvider.getPostById(`${did.replace(/^did:plc:/, '')}_${postId}`);
}
