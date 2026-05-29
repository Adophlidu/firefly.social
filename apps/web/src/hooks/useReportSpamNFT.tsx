import { Source } from '@dimensiondev/enums';
import { isSameEthereumAddress } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';
import { type Draft, produce } from 'immer';
import { useAsyncFn } from 'react-use';

import { queryClient } from '@/configs/queryClient.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { openAndWaitForCloseConfirmModal } from '@/helpers/openConfirmModal.js';
import { openLoginModalWithGuard } from '@/helpers/openLoginModal.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { reportNFT } from '@/providers/firefly/report/reportNFT.js';
import type { NFTDetail } from '@/providers/types/Firefly.js';
import type { FollowingNFT, NFTFeedV3 } from '@/providers/types/NFTs.js';

interface PagesData {
    pages: Array<{ data: FollowingNFT[] | NFTFeedV3[] }>;
}

/**
 * Filter out activities by collection id of the target NFT.
 *
 * @param {string} address
 */
function filterOutActivities(address: string) {
    // To report an NFT collection, we need to get its collection id first.
    // Therefore, query data for the collection will exist
    const data = queryClient.getQueriesData<NFTDetail>({
        queryKey: ['nft-detail'],
    });
    const queryData = data.find(([queryKey, data]) => {
        if (queryKey.length !== 4) return false;
        return isSameEthereumAddress(data?.collection?.contract_address, address);
    });
    const nftDetail = queryData?.[1];
    if (!nftDetail) return;

    const { contract_address: contractAddress, chain_id: nftChainId } = nftDetail;

    const patcher = (old: Draft<PagesData> | undefined) => {
        if (!old) return old;
        return produce(old, (draft) => {
            for (const page of draft.pages) {
                if (!page.data.length) continue;
                page.data = page.data.filter((item) => {
                    if (!item.detail) return true;
                    const chainId = item.detail.chain_id;
                    return (
                        !isSameEthereumAddress(item.detail.contract_address, contractAddress) || chainId !== nftChainId
                    );
                }) as FollowingNFT[] | NFTFeedV3[];
            }
        });
    };

    queryClient.setQueriesData<PagesData>({ queryKey: ['nfts', 'following', Source.NFTs] }, patcher);
    queryClient.setQueriesData<PagesData>({ queryKey: ['nfts', 'discover', Source.NFTs] }, patcher);
}

export function useReportSpamNFT() {
    const isLoginFirefly = useIsLoginFirefly();

    return useAsyncFn(
        async (chainId: number, address: string) => {
            if (!isLoginFirefly) {
                openLoginModalWithGuard();
                return;
            }

            const confirmed = await openAndWaitForCloseConfirmModal({
                title: <Trans>Report spam</Trans>,
                variant: 'normal',
                content: (
                    <div className="text-main">
                        <Trans>Are you sure you want to report this collection?</Trans>
                    </div>
                ),
            });
            if (!confirmed) return;

            try {
                await reportNFT(chainId, address);
                filterOutActivities(address);
                enqueueSuccessMessage(<Trans>Report submitted</Trans>);
            } catch (error) {
                enqueueMessageFromError(error, <Trans>Failed to report spam NFT.</Trans>);
                throw error;
            }
        },
        [isLoginFirefly],
    );
}
