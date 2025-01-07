import type { Post } from '@/providers/types/SocialMedia.js';

export function sortMultiSourcePosts(data: Post[]): Post[] {
    return data.concat().sort((a, b) => {
        if (a.timestamp && b.timestamp) return b.timestamp - a.timestamp;
        return 0;
    });
}
