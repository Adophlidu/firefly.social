import { PostAtUri } from '@/providers/bsky/AtUri.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';

export async function deleteBskyPost(postId: string): Promise<boolean> {
    const atUri = PostAtUri.fromId(postId).toUri();
    await bskySessionHolder.agent.deletePost(atUri);
    return true;
}
