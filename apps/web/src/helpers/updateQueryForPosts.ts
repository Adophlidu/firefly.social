import { Source } from '@dimensiondev/enums';
import { type Draft, produce } from 'immer';

import { queryClient } from '@/configs/queryClient.js';
import { SearchType } from '@/constants/enum.js';
import type { PageData } from '@/decorators/types.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export function updateQueryForPosts(source: Source, patcher: (posts: Array<Draft<Post>>) => void) {
    const postsPatcher = (old?: PageData<Post>) => {
        if (!old?.pages) return old;
        return produce(old, (draft) => {
            for (const page of draft.pages) {
                if (!page?.data?.length) continue;
                patcher(page.data);
            }
        });
    };

    queryClient.setQueriesData<PageData<Post>>({ queryKey: ['posts', source] }, postsPatcher);
    queryClient.setQueriesData<PageData<Post>>({ queryKey: ['search', SearchType.Posts] }, postsPatcher);
    queryClient.setQueriesData<PageData<Post>>({ queryKey: ['posts', Source.Posts] }, postsPatcher);
}
