import { type Draft, produce } from 'immer';

import { queryClient } from '@/configs/queryClient.js';
import { FireflyPlatform, Source } from '@/constants/enum.js';
import { resolveNFTFeedChainId } from '@/helpers/resolveNFTFeedChainId.js';
import { resolveNFTId, resolveNFTIdFromAsset } from '@/helpers/resolveNFTIdFromAsset.js';
import type { FireflySocialMedia } from '@/providers/firefly/SocialMedia.js';
import type { SimpleHash } from '@/providers/simplehash/type.js';
import type { NFTAsset } from '@/providers/types/Firefly.js';
import type { FollowingNFT, NFTFeed } from '@/providers/types/NFTs.js';
import type { ClassType } from '@/types/index.js';

const METHODS_BE_OVERRIDDEN = ['bookmarkNFT', 'unbookmarkNFT'] as const;

type PageData<T> = { pages: Array<{ data: T[] }> };

function createUpdater<T>(updater: (item: Draft<T>) => void) {
    return (old?: PageData<T>) => {
        if (!old) return old;

        return produce(old, (draft) => {
            draft.pages.forEach((page) => {
                page.data.forEach((item) => {
                    updater(item);
                });
            });
        });
    };
}

function toggleBlock(id: string, status: boolean) {
    queryClient.setQueriesData<PageData<SimpleHash.LiteCollection>>(
        { queryKey: ['nft-collection-list'] },
        createUpdater<SimpleHash.LiteCollection>((collection) => {
            collection.nftPreviews?.forEach((preview) => {
                if (preview.nft_id.toLowerCase() === id) preview.hasBookmarked = status;
            });
        }),
    );
    queryClient.setQueriesData<PageData<NFTFeed>>(
        { queryKey: ['nfts', 'discover'] },
        createUpdater<NFTFeed>((feed) => {
            feed.trans.token_list.forEach((token) => {
                if (resolveNFTId(resolveNFTFeedChainId(feed), feed.trans.token_address, token.id) === id) {
                    token.bookmarked = status;
                }
            });
        }),
    );

    const followingUpdater = createUpdater<FollowingNFT>((nftData) => {
        nftData.actions.forEach((action) => {
            if (action.nft && resolveNFTIdFromAsset(action.nft) === id) {
                action.nft.hasBookmarked = status;
            }
        });
    });
    queryClient.setQueriesData<PageData<FollowingNFT>>({ queryKey: ['nfts-of'] }, followingUpdater);
    queryClient.setQueriesData<PageData<FollowingNFT>>(
        { queryKey: ['nfts', 'following', Source.NFTs] },
        followingUpdater,
    );

    const patcher = createUpdater<NFTAsset>((item) => {
        if (resolveNFTIdFromAsset(item) === id) {
            item.hasBookmarked = status;
        }
    });
    queryClient.setQueriesData<PageData<NFTAsset>>({ queryKey: ['poap-list'] }, patcher);
    queryClient.setQueriesData<PageData<NFTAsset>>({ queryKey: ['nft-list'] }, patcher);
    queryClient.setQueryData(['has-bookmarked', FireflyPlatform.NFTs, id, true], { status });

    // remove bookmarked NFT from bookmarks list
    if (status === false) {
        queryClient.setQueriesData<PageData<{ id: string; nft: SimpleHash.NFT }>>(
            { queryKey: ['bookmarks', Source.NFTs] },
            (old) => {
                if (!old) return old;

                return produce(old, (draft) => {
                    draft.pages.forEach((page) => {
                        page.data = page.data.filter((item) => item.id.toLowerCase() !== id);
                    });
                });
            },
        );
    }
}

export function SetQueryDataForBookmarkNFT() {
    return function decorator<T extends ClassType<FireflySocialMedia>>(target: T): T {
        function overrideMethod<K extends (typeof METHODS_BE_OVERRIDDEN)[number]>(key: K) {
            const method = target.prototype[key] as FireflySocialMedia[K];

            Object.defineProperty(target.prototype, key, {
                value: async (id: string, owner?: string) => {
                    const m = method as (id: string, owner?: string) => ReturnType<FireflySocialMedia[K]>;
                    const status = key === 'bookmarkNFT';

                    const result = await m.call(target.prototype, id, owner);
                    if (result) {
                        toggleBlock(id.toLowerCase(), status);
                    }

                    return result;
                },
            });
        }

        METHODS_BE_OVERRIDDEN.forEach(overrideMethod);

        return target;
    };
}
