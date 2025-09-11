import { type Draft, produce } from 'immer';

import { queryClient } from '@/configs/queryClient.js';
import { Source } from '@/constants/enum.js';
import { isSameAddress, isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { patchActivitiesQuery } from '@/helpers/patchActivitiesQuery.js';
import { patchTransactionsQuery } from '@/helpers/patchTransactionsQuery.js';
import type { FireflyEndpoint } from '@/providers/firefly/Endpoint.js';
import type { SnapshotActivity } from '@/providers/snapshot/type.js';
import type { Article } from '@/providers/types/Article.js';
import type { WalletProfile } from '@/providers/types/Firefly.js';
import type { FollowingNFT, NFTFeedV3 } from '@/providers/types/NFTs.js';
import type { ClassType } from '@/types/utility.js';

type PagesData = { pages: Array<{ data: Article[] }> };
interface NFTPagesData {
    pages: Array<{ data: FollowingNFT[] | NFTFeedV3[] }>;
}

interface WalletProfilePagesData {
    pages: Array<{ data: WalletProfile[] }>;
}

interface DAOPagesData {
    pages: Array<{ data: SnapshotActivity[] }>;
}

export function setWalletBlockStatus(address: string, status: boolean) {
    const patcher = (old: Draft<PagesData> | undefined) => {
        if (!old) return old;
        return produce(old, (draft) => {
            for (const page of draft.pages) {
                if (!page) continue;
                for (const article of page.data) {
                    if (!isSameEthereumAddress(article.author.id, address)) continue;
                    article.author.isMuted = status;
                }
            }
        });
    };

    queryClient.setQueriesData<{ pages: Array<{ data: Article[] }> }>({ queryKey: ['articles'] }, patcher);
    patchActivitiesQuery(Source.Article, (item) => {
        if (isSameEthereumAddress(item.author.id, address)) {
            item.author.isMuted = status;
        }
    });

    queryClient.setQueriesData<PagesData>({ queryKey: ['posts', Source.Article, 'bookmark'] }, patcher);
    queryClient.setQueriesData<Article>({ queryKey: ['article-detail'] }, (old) => {
        if (!old) return;
        return produce(old, (draft) => {
            if (!isSameEthereumAddress(draft.author.id, address)) return;
            draft.author.isMuted = status;
        });
    });
    // Muted status in wallet profile
    queryClient.setQueryData(
        ['address-is-muted', isValidAddressEthereum(address) ? address.toLowerCase() : address],
        status,
    );

    const nftsPatcher = (old: Draft<NFTPagesData> | undefined) => {
        if (!old || !status) return old;
        return produce(old, (draft) => {
            for (const page of draft.pages) {
                if (!page.data.length) continue;
                page.data = page.data.filter((nft) => {
                    return !isSameEthereumAddress(nft.owner, address);
                }) as FollowingNFT[] | NFTFeedV3[];
            }
        });
    };

    queryClient.setQueriesData<NFTPagesData>({ queryKey: ['nfts', 'following'] }, nftsPatcher);
    queryClient.setQueriesData<NFTPagesData>({ queryKey: ['nfts', 'discover'] }, nftsPatcher);
    queryClient.setQueriesData<WalletProfilePagesData>({ queryKey: ['wallets', 'muted-list'] }, (old) => {
        if (!old) return old;
        return produce(old, (draft) => {
            for (const page of draft.pages) {
                if (!page) continue;
                for (const profile of page.data) {
                    if (!isSameEthereumAddress(profile.address, address)) continue;
                    profile.blocked = status;
                }
            }
        });
    });

    patchTransactionsQuery(Source.Polymarket, undefined, (data) => !isSameEthereumAddress(data.wallet, address));
    patchTransactionsQuery(Source.Swap, undefined, (data) => !isSameEthereumAddress(data.owner, address));

    queryClient.setQueriesData<DAOPagesData>({ queryKey: ['snapshots'] }, (old) => {
        if (!old) return old;

        return produce(old, (draft) => {
            for (const page of draft.pages) {
                if (!page) continue;
                for (const activity of page.data) {
                    if (isSameAddress(activity.author.id, address)) {
                        activity.author.isMuted = status;
                    }
                }
            }
        });
    });
    patchActivitiesQuery(Source.DAOs, (item) => {
        if (isSameAddress(item.author.id, address)) {
            item.author.isMuted = status;
        }
    });
}

const METHODS_BE_OVERRIDDEN = ['blockWallet', 'unblockWallet'] as const;

export function SetQueryDataForBlockWallet() {
    return function decorator<T extends ClassType<FireflyEndpoint>>(target: T): T {
        function overrideMethod<K extends (typeof METHODS_BE_OVERRIDDEN)[number]>(key: K) {
            const method = target.prototype[key] as FireflyEndpoint[K];

            Object.defineProperty(target.prototype, key, {
                value: async (address: string) => {
                    const m = method as (address: string) => ReturnType<FireflyEndpoint[K]>;
                    const status = key === 'blockWallet';
                    try {
                        const result = await m.call(target.prototype, address);
                        setWalletBlockStatus(address, status);
                        return result;
                    } catch (error) {
                        // rolling back
                        setWalletBlockStatus(address, !status);
                        throw error;
                    }
                },
            });
        }

        METHODS_BE_OVERRIDDEN.forEach(overrideMethod);

        return target;
    };
}
