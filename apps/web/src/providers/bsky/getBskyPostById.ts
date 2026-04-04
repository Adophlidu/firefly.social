import { PostAtUri } from '@/providers/bsky/AtUri.js';
import { getBskyPostByUri } from '@/providers/bsky/getBskyPostByUri.js';

export async function getBskyPostById(postId: string) {
    const atUri = PostAtUri.fromId(postId).toUri();
    return getBskyPostByUri(atUri);
}
