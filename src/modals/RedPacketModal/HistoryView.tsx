import { Trans } from '@lingui/react/macro';
import { memo, Suspense, useContext, useState } from 'react';

import { Loading } from '@/components/Loading.js';
import { Tab, Tabs } from '@/components/Tabs/index.js';
import { NetworkType } from '@/constants/enum.js';
import { useChainContext } from '@/hooks/useChainContext.js';
import { EvmHistoryList } from '@/modals/RedPacketModal/EvmHistoryList.js';
import { RedPacketContext } from '@/modals/RedPacketModal/RedPacketContext.js';
import { SolanaHistoryList } from '@/modals/RedPacketModal/SolanaHistoryList.js';
import { TypeTabs } from '@/modals/RedPacketModal/TypeTabs.js';
import { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';

export default memo(function HistoryView() {
    const { networkType } = useContext(RedPacketContext);
    const [historyType, setHistoryType] = useState<FireflyRedPacketAPI.ActionType>(
        FireflyRedPacketAPI.ActionType.Claim,
    );
    const { account } = useChainContext({ networkType });

    return (
        <div className="flex flex-1 grow flex-col bg-primaryBottom px-4 py-2">
            <div className="flex gap-2">
                <Tabs value={historyType} onChange={setHistoryType} variant="solid" className="self-start">
                    <Tab value={FireflyRedPacketAPI.ActionType.Claim} key="claimed">
                        <Trans>Claimed</Trans>
                    </Tab>
                    <Tab value={FireflyRedPacketAPI.ActionType.Send} key="sent">
                        <Trans>Sent</Trans>
                    </Tab>
                </Tabs>
                <TypeTabs />
            </div>

            <div className="no-scrollbar box-border flex grow flex-col gap-1 overflow-auto p-3">
                <Suspense fallback={<Loading className="!min-h-52" />}>
                    {networkType === NetworkType.Solana ? (
                        <SolanaHistoryList address={account} historyType={historyType} />
                    ) : (
                        <EvmHistoryList address={account} historyType={historyType} />
                    )}
                </Suspense>
            </div>
        </div>
    );
});
