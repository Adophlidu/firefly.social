import { BSKY_POST_REGEXP } from '@/constants/regexp.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import { BskySocialMediaProvider } from '@/providers/bsky/SocialMedia.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export async function digestBskyPostLink(url: string): Promise<Post | null> {
    const [, handle, postId] = url.match(BSKY_POST_REGEXP) || [];
    if (!handle || !postId) return null;

    const didResponse = await bskySessionHolder.agent.resolveHandle({ handle });
    const did = didResponse.data.did;
    if (!did) return null;

    return BskySocialMediaProvider.getPostById(`${did.replace(/^did:plc:/, '')}_${postId}`);
}
