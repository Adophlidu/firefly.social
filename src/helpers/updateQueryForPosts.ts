import { type Draft, produce } from 'immer';

import { queryClient } from '@/configs/queryClient.js';
import { type SocialSource } from '@/constants/enum.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export function updateQueryForPosts(source: SocialSource, patcher: (posts: Array<Draft<Post>>) => void) {
    queryClient.setQueriesData<{ pages: Array<{ data: Post[] }> }>({ queryKey: ['posts', source] }, (old) => {
        if (!old?.pages) return old;
        return produce(old, (draft) => {
            for (const page of draft.pages) {
                patcher(page.data);
            }
        });
    });
}
