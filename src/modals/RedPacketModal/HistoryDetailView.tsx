import { useLocation } from '@tanstack/react-router';
import type { Address } from 'viem';
import { useEnsName } from 'wagmi';

import { useClaimedInfo } from '@/components/RedPacket/hooks/useClaimedInfo.js';
import { VirtualList } from '@/components/VirtualList/VirtualList.js';
import { VirtualListFooter } from '@/components/VirtualList/VirtualListFooter.js';
import { NetworkType } from '@/constants/enum.js';
import { formatBalance } from '@/helpers/formatBalance.js';
import { useChainContext } from '@/hooks/useChainContext.js';
import { RedPacketAccountItem } from '@/modals/RedPacketModal/RedPacketAccountItem.js';
import { RedPacketDetailItem } from '@/modals/RedPacketModal/RedPacketDetailItem.js';
import type { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';

function ClaimHistoryItem({ data, chainId }: { data: FireflyRedPacketAPI.ClaimList; chainId?: number }) {
    const { data: ens } = useEnsName({ address: data.creator as Address });

    return (
        <div className="mt-3 flex items-center justify-between px-3 text-[14px] font-bold leading-[18px]">
            <RedPacketAccountItem ens={ens ?? ''} address={data.creator} chainId={chainId} />
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

function getClaimHistoryListItem(data?: FireflyRedPacketAPI.ClaimList, chainId?: number) {
    return data ? <ClaimHistoryItem key={data.creator} data={data} chainId={chainId} /> : null;
}

export function HistoryDetailView() {
    const { rpid, networkType } = useLocation().search as {
        rpid: string;
        networkType: NetworkType;
    };
    const { account } = useChainContext({ networkType });

    const { claimInfo, claimList, onEndReached } = useClaimedInfo(rpid, account, networkType);

    return (
        <div className="flex flex-grow flex-col overflow-auto px-4 py-3">
            {claimInfo ? <RedPacketDetailItem history={{ ...claimInfo, redpacket_id: rpid }} isDetail /> : null}
            {claimList.length ? (
                <VirtualList
                    data={claimList}
                    endReached={onEndReached}
                    components={{ Footer: VirtualListFooter }}
                    className="no-scrollbar box-border h-full min-h-0 flex-1"
                    listKey={`redpacket_${rpid}`}
                    computeItemKey={(index, item) => item?.creator || 'Unknown User'}
                    itemContent={(index, item) => getClaimHistoryListItem(item, claimInfo?.chain_id)}
                />
            ) : (
                <div />
            )}
        </div>
    );
}
