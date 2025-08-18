import { type Draft, produce } from 'immer';

import { queryClient } from '@/configs/queryClient.js';
import { FireflyPlatform, Source } from '@/constants/enum.js';
import { POAP_CONTRACT_ADDRESS } from '@/constants/index.js';
import { patchTransactionsQuery } from '@/helpers/patchTransactionsQuery.js';
import { resolveNFTId, resolveNFTIdFromAsset } from '@/helpers/resolveNFTIdFromAsset.js';
import { EthereumChainId } from '@/mask_pkgs/web3-shared/evm/index.js';
import type { FireflySocialMedia } from '@/providers/firefly/SocialMedia.js';
import type { EVM } from '@/providers/nft-scan/types.js';
import type { FollowingNFT, NFTFeedV3, Poap } from '@/providers/types/NFTs.js';
import type { ClassType } from '@/types/utility.js';

const METHODS_BE_OVERRIDDEN = ['bookmarkNFT', 'unbookmarkNFT'] as const;

type PageData<T> = { pages: Array<{ data: T[] }> };

function createUpdater<T>(updater: (item: Draft<T>) => void) {
    return (old?: PageData<T>) => {
        if (!old) return old;

        return produce(old, (draft) => {
            draft.pages.forEach((page) => {
                if (!page?.data) return;
                page.data.forEach((item) => {
                    updater(item);
                });
            });
        });
    };
}

function toggleBlock(id: string, status: boolean) {
    queryClient.setQueriesData<PageData<NFTFeedV3>>(
        { queryKey: ['nfts', 'discover'] },
        createUpdater<NFTFeedV3>((feed) => {
            const feedNftId = resolveNFTId(feed.chain_id, feed.contract_address, feed.token_id);
            if (feedNftId.toLowerCase() === id) feed.bookmarked = status;
        }),
    );

    const followingUpdater = createUpdater<FollowingNFT>((nftData) => {
        if (
            nftData.detail &&
            resolveNFTId(nftData.detail.chain_id, nftData.detail.contract_address, nftData.detail.token_id) === id
        ) {
            nftData.detail.hasBookmarked = status;
        }
    });
    queryClient.setQueriesData<PageData<FollowingNFT>>({ queryKey: ['nfts-of'] }, followingUpdater);
    queryClient.setQueriesData<PageData<FollowingNFT>>(
        { queryKey: ['nfts', 'following', Source.NFTs] },
        followingUpdater,
    );
    patchTransactionsQuery(Source.NFTs, (feed) => {
        const feedNftId = resolveNFTId(feed.chain_id, feed.contract_address, feed.token_id);
        if (feedNftId.toLowerCase() === id) feed.bookmarked = status;
    });

    const patcher = createUpdater<EVM.Asset>((item) => {
        if (resolveNFTIdFromAsset(item) === id) {
            item.hasBookmarked = status;
        }
    });
    queryClient.setQueriesData<PageData<EVM.Asset>>({ queryKey: ['nft-list'] }, patcher);
    const poapPatcher = createUpdater<Poap>((item) => {
        if (resolveNFTId(EthereumChainId.xDai, POAP_CONTRACT_ADDRESS, item.tokenId) === id) {
            item.hasBookmarked = status;
        }
    });
    queryClient.setQueriesData<PageData<Poap>>({ queryKey: ['poap-list'] }, poapPatcher);
    queryClient.setQueryData(['has-bookmarked', FireflyPlatform.NFTs, id, true], { status });

    // remove bookmarked NFT from bookmarks list
    if (status === false) {
        queryClient.setQueriesData<PageData<{ id: string; nft: EVM.Asset }>>(
            { queryKey: ['bookmarks', Source.NFTs] },
            (old) => {
                if (!old) return old;

                return produce(old, (draft) => {
                    draft.pages.forEach((page) => {
                        if (!page?.data) return;
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
