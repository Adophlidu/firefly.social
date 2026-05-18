import type { SocialSource } from '@dimensiondev/enums';

import { updateQueryForPosts } from '@/helpers/updateQueryForPosts.js';

export function deletePostFromQueryData(source: SocialSource, postId: string) {
    updateQueryForPosts(source, (posts) => {
        const index = posts.findIndex((p) => p.postId === postId);
        if (index !== -1) posts.splice(index, 1);
    });
}
