import { type Draft, produce } from 'immer';

import { queryClient } from '@/configs/queryClient.js';
import { SearchType, Source } from '@/constants/enum.js';
import type { Post } from '@/providers/types/SocialMedia.js';

type PaginatedPosts = { pages: Array<{ data: Post[] }> };

export function updateQueryForPosts(source: Source, patcher: (posts: Array<Draft<Post>>) => void) {
    const postsPatcher = (old?: PaginatedPosts) => {
        if (!old?.pages) return old;
        return produce(old, (draft) => {
            for (const page of draft.pages) {
                if (!page?.data?.length) continue;
                patcher(page.data);
            }
        });
    };

    queryClient.setQueriesData<PaginatedPosts>({ queryKey: ['posts', source] }, postsPatcher);
    queryClient.setQueriesData<PaginatedPosts>({ queryKey: ['search', SearchType.Posts] }, postsPatcher);
    queryClient.setQueriesData<PaginatedPosts>({ queryKey: ['posts', Source.Posts] }, postsPatcher);
}
