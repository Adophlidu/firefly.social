import type { Source } from '@dimensiondev/enums';
import { produce, type WritableDraft } from 'immer';

import { queryClient } from '@/configs/queryClient.js';
import type { BetsActivity, SwapActivity, TransactionsItem } from '@/providers/types/Firefly.js';
import type { NFTFeedV3 } from '@/providers/types/NFTs.js';

export function patchTransactionsQuery<
    T extends TransactionsItem['source'],
    D = T extends Source.Swap
        ? WritableDraft<SwapActivity>
        : T extends Source.Prediction
          ? WritableDraft<BetsActivity>
          : T extends Source.NFTs
            ? WritableDraft<NFTFeedV3>
            : never,
>(source: T, updater?: (item: D) => void, filter?: (item: D) => boolean): void {
    const patcher = (old?: { pages: Array<{ data: TransactionsItem[] }> }) => {
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
    };

    // Update queries for home page transactions
    queryClient.setQueriesData<{
        pages: Array<{ data: TransactionsItem[] }>;
    }>(
        {
            queryKey: ['transactions'],
        },
        patcher,
    );

    // Update queries for profile transactions
    queryClient.setQueriesData<{
        pages: Array<{ data: TransactionsItem[] }>;
    }>(
        {
            queryKey: ['profile', 'transactions'],
        },
        patcher,
    );
}
