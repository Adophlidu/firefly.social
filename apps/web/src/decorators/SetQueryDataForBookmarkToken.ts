import { produce } from 'immer';

import { queryClient } from '@/configs/queryClient.js';
import { FireflyPlatform, Source } from '@/constants/enum.js';
import type { PageData } from '@/decorators/types.js';
import { resolveTokenBookmarkId } from '@/helpers/resolveTokenBookmarkId.js';
import type { FireflyBookmark } from '@/providers/firefly/Bookmark.js';
import type { BookmarkTokenOptions } from '@/providers/types/Bookmark.js';
import type { TokenWithMarketData } from '@/providers/types/Firefly.js';
import type { ClassType } from '@/types/utility.js';

const METHODS_BE_OVERRIDDEN = ['bookmarkToken', 'unbookmarkToken'] as const;

function toggleBookmark(id: string, status: boolean) {
    queryClient.setQueryData(['has-bookmarked', FireflyPlatform.Token, id, true], { status });

    if (status === false) {
        queryClient.setQueriesData<TokenWithMarketData[]>(
            {
                queryKey: ['bookmarks', 'aside', Source.Tokens],
            },
            (old) => {
                if (!old) return old;
                return produce(old, (draft) => {
                    if (!draft) return draft;
                    return draft.filter((item) => {
                        const tokenBookmarkId = resolveTokenBookmarkId({
                            coinId: item.id,
                            chainId: item.chain_id,
                            address: item.contract_address,
                        });
                        return tokenBookmarkId !== id;
                    });
                });
            },
        );
        queryClient.setQueriesData<PageData<TokenWithMarketData>>(
            {
                queryKey: ['bookmarks', Source.Tokens],
            },

            (old) => {
                if (!old) return old;

                return produce(old, (draft) => {
                    draft.pages.forEach((page) => {
                        if (!page?.data) return;
                        page.data = page.data.filter((item) => {
                            const bookmarkId = resolveTokenBookmarkId({
                                coinId: item.id,
                                chainId: item.chain_id,
                                address: item.contract_address,
                            });
                            return bookmarkId !== id;
                        });
                    });
                });
            },
        );
    }
}

export function SetQueryDataForBookmarkToken() {
    return function decorator<T extends ClassType<FireflyBookmark>>(target: T): T {
        function overrideMethod<K extends (typeof METHODS_BE_OVERRIDDEN)[number]>(key: K) {
            const method = target.prototype[key] as FireflyBookmark[K];

            Object.defineProperty(target.prototype, key, {
                value: async (options: BookmarkTokenOptions) => {
                    const m = method as (options: BookmarkTokenOptions) => ReturnType<FireflyBookmark[K]>;
                    const status = key === 'bookmarkToken';

                    const result = await m.call(target.prototype, options);
                    const bookmarkContentId = resolveTokenBookmarkId(options);
                    if (result) {
                        toggleBookmark(bookmarkContentId, status);
                    }

                    return result;
                },
            });
        }

        METHODS_BE_OVERRIDDEN.forEach(overrideMethod);

        return target;
    };
}
