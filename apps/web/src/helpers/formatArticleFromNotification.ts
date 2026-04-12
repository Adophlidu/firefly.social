import type { Article } from '@/providers/types/Article.js';
import type { UnifiedNotification } from '@/providers/types/Firefly.js';

export function formatArticleFromNotification(data: UnifiedNotification['data']): Article {
    return {
        id: data.article_id || data.hash,
        title: data.content?.title || '',
        content: data.content?.body || data.digest || data.post_preview,
        coverUrl: null,
        author: {
            id: data.owner || data.author,
            handle: data.author,
            avatar: data.displayInfo?.avatarUrl,
            username: data.authorship?.userName || '',
            displayName: data.authorship?.displayName || '',
            info: data.authorship?.info || {},
            isFollowing: false,
            isMuted: false,
        },
        platform: data.platform,
        timestamp: data.created_at,
        hash: data.hash || '',
        type: 'post' as const,
        displayInfo: data.displayInfo,
        followingSources: [],
    } as Article;
}
