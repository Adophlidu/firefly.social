import { produce, type WritableDraft } from 'immer';

import { queryClient } from '@/configs/queryClient.js';
import type { Source } from '@/constants/enum.js';
import type { Article } from '@/providers/types/Article.js';
import type { ActivitiesItem, FollowingSnapshotActivity } from '@/providers/types/Firefly.js';

export function patchActivitiesQuery<
    T extends ActivitiesItem['source'],
    D = T extends Source.Article
        ? WritableDraft<Article>
        : T extends Source.DAOs
          ? WritableDraft<FollowingSnapshotActivity>
          : never,
>(source: T, updater?: (item: D) => void, filter?: (item: D) => boolean) {
    queryClient.setQueriesData<{
        pages: Array<{ data: ActivitiesItem[] }>;
    }>(
        {
            queryKey: ['activities'],
        },
        (old) => {
            if (!old) return old;

            return produce(old, (draft) => {
                draft.pages.forEach((page) => {
                    if (!page.data?.length) return;

                    if (filter) {
                        page.data = page.data.filter((item) => {
                            return item.source !== source || filter(item.data as D);
                        });
                    } else {
                        page.data.forEach((item) => {
                            if (item.source === source) {
                                updater?.(item.data as D);
                            }
                        });
                    }
                });
            });
        },
    );
}
