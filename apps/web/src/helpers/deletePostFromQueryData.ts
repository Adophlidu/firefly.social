import type { SocialSource } from '@/constants/enum.js';
import { updateQueryForPosts } from '@/helpers/updateQueryForPosts.js';

export function deletePostFromQueryData(source: SocialSource, postId: string) {
    updateQueryForPosts(source, (posts) => {
        const index = posts.findIndex((p) => p.postId === postId);
        if (index !== -1) posts.splice(index, 1);
    });
}
