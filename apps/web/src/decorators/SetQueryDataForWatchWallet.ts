import { type Draft, produce } from 'immer';

import { queryClient } from '@/configs/queryClient.js';
import { Source } from '@/constants/enum.js';
import { type PageData } from '@/decorators/types.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { patchActivitiesQuery } from '@/helpers/patchActivitiesQuery.js';
import { patchTransactionsQuery } from '@/helpers/patchTransactionsQuery.js';
import { type FireflyWallet } from '@/providers/firefly/Wallet.js';
import { type Article } from '@/providers/types/Article.js';
import { WatchType } from '@/providers/types/Firefly.js';
import { type ClassType } from '@/types/utility.js';

function toggleWatch(address: string, status: boolean) {
    const patcher = (old: Draft<PageData<Article>> | undefined) => {
        if (!old) return old;
        return produce(old, (draft) => {
            for (const page of draft.pages) {
                if (!page) continue;

                for (const article of page.data) {
                    if (!isSameEthereumAddress(article.author.id, address)) continue;
                    article.author.isFollowing = status;
                }
            }
        });
    };
    queryClient.setQueriesData<PageData<Article>>({ queryKey: ['articles'] }, patcher);
    patchActivitiesQuery(Source.Article, (item) => {
        if (isSameEthereumAddress(item.author.id, address)) {
            item.author.isFollowing = status;
        }
    });

    queryClient.setQueriesData<PageData<Article>>({ queryKey: ['posts', Source.Article, 'bookmark'] }, patcher);
    queryClient.setQueriesData<Article>({ queryKey: ['article-detail'] }, (old) => {
        if (!old) return;
        return produce(old, (draft) => {
            if (!isSameEthereumAddress(draft.author.id, address)) return;
            draft.author.isFollowing = status;
        });
    });
    queryClient.setQueryData(['follow-wallet', address.toLowerCase()], status);

    patchTransactionsQuery(Source.Prediction, undefined, ({ followingSources }) => {
        return !(
            followingSources?.length === 1 &&
            followingSources[0]?.type === WatchType.Wallet &&
            isSameEthereumAddress(followingSources[0].walletAddress, address)
        );
    });
}

const METHODS_BE_OVERRIDDEN = ['watchWallet', 'unwatchWallet'] as const;

export function SetQueryDataForWatchWallet() {
    return function decorator<T extends ClassType<FireflyWallet>>(target: T): T {
        function overrideMethod<K extends (typeof METHODS_BE_OVERRIDDEN)[number]>(key: K) {
            const method = target.prototype[key] as FireflyWallet[K];

            Object.defineProperty(target.prototype, key, {
                value: async (address: string) => {
                    const m = method as (address: string) => ReturnType<FireflyWallet[K]>;
                    const status = key === 'watchWallet';
                    try {
                        toggleWatch(address, status);
                        return await m.call(target.prototype, address);
                    } catch (error) {
                        // rolling back
                        toggleWatch(address, !status);
                        throw error;
                    }
                },
            });
        }

        METHODS_BE_OVERRIDDEN.forEach(overrideMethod);

        return target;
    };
}
