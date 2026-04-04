import { produce } from 'immer';

import { queryClient } from '@/configs/queryClient.js';
import { Source } from '@/constants/enum.js';
import { type PageData } from '@/decorators/types.js';
import { type BetsActivity } from '@/providers/types/Firefly.js';

export function patchPredictionActivityData(updater: (item: BetsActivity) => void) {
    const patcher = (old?: PageData<BetsActivity>) => {
        if (!old?.pages) return old;

        return produce(old, (draft) => {
            draft.pages.forEach((page) => {
                page.data.forEach((oldData: BetsActivity) => {
                    updater(oldData);
                });
            });
        });
    };

    queryClient.setQueriesData<PageData<BetsActivity>>(
        {
            queryKey: ['polymarket'],
        },
        patcher,
    );
    queryClient.setQueriesData<PageData<BetsActivity>>(
        {
            queryKey: ['bets', 'list'],
        },
        patcher,
    );
    queryClient.setQueriesData<PageData<BetsActivity>>(
        {
            queryKey: ['bookmarks', Source.Prediction],
        },
        patcher,
    );
}
