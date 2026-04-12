import { Trans } from '@lingui/react/macro';
import { type Draft, produce } from 'immer';
import { useAsyncFn } from 'react-use';

import { queryClient } from '@/configs/queryClient.js';
import { Source } from '@/constants/enum.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { ConfirmModalRef } from '@/modals/ConfirmModal/refs.js';
import { reportNFT } from '@/providers/firefly/report/reportNFT.js';
import type { FollowingNFT, NFTFeedV3 } from '@/providers/types/NFTs.js';
import type { NonFungibleAsset } from '@/web3-shared/base/specs.js';
import type { EthereumChainId, EthereumSchemaType } from '@/web3-shared/evm/types.js';

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
    const data = queryClient.getQueriesData<NonFungibleAsset<EthereumChainId, EthereumSchemaType>>({
        queryKey: ['nft-detail'],
    });
    const queryData = data.find(([queryKey, data]) => {
        if (queryKey.length !== 4) return false;
        return isSameEthereumAddress(data?.collection?.address, address);
    });
    const nftDetail = queryData?.[1];
    if (!nftDetail) return;

    const { address: contractAddress, chainId: nftChainId } = nftDetail;

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
                openLoginModal();
                return;
            }

            const confirmed = await ConfirmModalRef.openAndWaitForClose({
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
