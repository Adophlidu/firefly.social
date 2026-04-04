import { deleteLensPost } from '@/providers/lens/deleteLensPost.js';

export async function unmirrorLensPost(postId: string): Promise<void> {
    await deleteLensPost(postId);
}
