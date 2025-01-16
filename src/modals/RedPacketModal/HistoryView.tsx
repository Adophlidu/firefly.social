import { Trans } from '@lingui/react/macro';
import { useCallback, useContext, useState } from 'react';

import { Tab, Tabs } from '@/components/Tabs/index.js';
import { NetworkType } from '@/constants/enum.js';
import { useChainContext } from '@/hooks/useChainContext.js';
import { EvmHistoryList } from '@/modals/RedPacketModal/EvmHistoryList.js';
import { RedPacketContext } from '@/modals/RedPacketModal/RedPacketContext.js';
import { SolanaHistoryList } from '@/modals/RedPacketModal/SolanaHistoryList.js';
import { TypeTabs } from '@/modals/RedPacketModal/TypeTabs.js';
import { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';

export function HistoryView() {
    const { networkType } = useContext(RedPacketContext);
    const [historyType, setHistoryType] = useState<FireflyRedPacketAPI.ActionType>(
        networkType === NetworkType.Ethereum
            ? FireflyRedPacketAPI.ActionType.Claim
            : FireflyRedPacketAPI.ActionType.Send,
    );
    const { account } = useChainContext({ networkType });

    const onNetworkTypeChange = useCallback((newType: NetworkType) => {
        if (newType === NetworkType.Solana) {
            setHistoryType(FireflyRedPacketAPI.ActionType.Send);
        }
    }, []);

    return (
        <div className="flex flex-1 flex-grow flex-col bg-primaryBottom px-4 py-2">
            <div className="flex gap-2">
                <Tabs value={historyType} onChange={setHistoryType} variant="solid" className="self-start">
                    {networkType === NetworkType.Ethereum ? (
                        <Tab value={FireflyRedPacketAPI.ActionType.Claim} key="claimed">
                            <Trans>Claimed</Trans>
                        </Tab>
                    ) : null}
                    <Tab value={FireflyRedPacketAPI.ActionType.Send} key="sent">
                        <Trans>Sent</Trans>
                    </Tab>
                </Tabs>
                <TypeTabs onChange={onNetworkTypeChange} />
            </div>

            <div className="no-scrollbar box-border flex flex-grow flex-col gap-1 overflow-auto p-3">
                {networkType === NetworkType.Solana ? (
                    <SolanaHistoryList address={account} historyType={historyType} />
                ) : (
                    <EvmHistoryList address={account} historyType={historyType} />
                )}
            </div>
        </div>
    );
}
