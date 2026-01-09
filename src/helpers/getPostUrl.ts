import { Source } from '@/constants/enum.js';
import { resolvePostUrl } from '@/helpers/resolvePostUrl.js';
import { type Post } from '@/providers/types/SocialMedia.js';

export function getPostUrl(post: Post) {
    const id = post.source === Source.Lens && post.slug ? post.slug : post.postId;

    return resolvePostUrl(post.source, id);
}
