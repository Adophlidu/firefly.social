import { useLocation } from '@tanstack/react-router';
import { first } from 'lodash-es';
import { memo, Suspense } from 'react';
import type { Address } from 'viem';
import { useEnsName } from 'wagmi';

import { Loading } from '@/components/Loading.js';
import { useEthereumClaimedInfo } from '@/components/RedPacket/hooks/useEthereumClaimedInfo.js';
import { VirtualList } from '@/components/VirtualList/VirtualList.js';
import { VirtualListFooter } from '@/components/VirtualList/VirtualListFooter.js';
import type { NetworkType } from '@/constants/enum.js';
import { formatBalance } from '@/helpers/formatBalance.js';
import { RedPacketAccountItem } from '@/modals/RedPacketModal/RedPacketAccountItem.js';
import { RedPacketDetailItem } from '@/modals/RedPacketModal/RedPacketDetailItem.js';
import type { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';

function ClaimHistoryItem({ data, networkType }: { data: FireflyRedPacketAPI.ClaimList; networkType: NetworkType }) {
    const { data: ens } = useEnsName({ address: data.creator as Address });

    return (
        <div className="mt-3 flex items-center justify-between px-3 text-[14px] font-bold leading-[18px]">
            <RedPacketAccountItem
                ens={ens ?? ''}
                address={data.creator}
                shareFrom={first(data.claim_platform)?.platform_handle}
                networkType={networkType}
                platform={first(data.claim_platform)?.platform}
                platformId={first(data.claim_platform)?.platform_id}
            />
            <div className="flex gap-1">
                {formatBalance(data.token_amounts, data.token_decimal, {
                    significant: 6,
                    isPrecise: true,
                })}
                {data.token_symbol}
            </div>
        </div>
    );
}

function getClaimHistoryListItem(networkType: NetworkType, data?: FireflyRedPacketAPI.ClaimList) {
    return data ? <ClaimHistoryItem networkType={networkType} key={data.creator} data={data} /> : null;
}

function HistoryDetail() {
    const { rpid, networkType } = useLocation().search as {
        rpid: string;
        networkType: NetworkType;
    };

    const { claimInfo, claimList, onEndReached } = useEthereumClaimedInfo(rpid);

    return (
        <div className="flex w-[600px] flex-grow flex-col overflow-auto px-4 py-3">
            {claimInfo ? <RedPacketDetailItem history={{ ...claimInfo, redpacket_id: rpid }} isDetail /> : null}
            {claimList.length ? (
                <VirtualList
                    data={claimList}
                    endReached={onEndReached}
                    components={{ Footer: VirtualListFooter }}
                    className="no-scrollbar box-border h-full min-h-0 flex-1"
                    listKey={`redpacket_${rpid}`}
                    computeItemKey={(index, item) => item?.creator || 'Unknown User'}
                    itemContent={(index, item) => getClaimHistoryListItem(networkType, item)}
                />
            ) : (
                <div />
            )}
        </div>
    );
}

export default memo(function HistoryDetailView() {
    return (
        <Suspense fallback={<Loading className="!min-h-52" />}>
            <HistoryDetail />
        </Suspense>
    );
});
