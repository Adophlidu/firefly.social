import { unreachable } from '@masknet/kit';
import { memo, useCallback, useContext } from 'react';

import { Tab, Tabs } from '@/components/Tabs/index.js';
import { NetworkType } from '@/constants/enum.js';
import { useWalletAccountAll } from '@/hooks/useAccountByNetwork.js';
import { RedPacketContext, redPacketTypeTabs } from '@/modals/RedPacketModal/RedPacketContext.js';

export const TypeTabs = memo(function TypeTabs() {
    const { networkType, setNetworkType, setToken, setRawAmount } = useContext(RedPacketContext);
    const { ethereum, solana } = useWalletAccountAll();

    const onTypeChange = useCallback(
        (newType: NetworkType) => {
            switch (newType) {
                case NetworkType.Solana:
                    if (!solana.address) {
                        solana.connect();
                        return;
                    }
                    break;
                case NetworkType.Ethereum:
                    if (!ethereum.address) {
                        ethereum.connect();
                        return;
                    }
                    break;
                default:
                    unreachable(newType);
            }
            setToken(undefined);
            setRawAmount('');
            setNetworkType(newType);
        },
        [ethereum, solana, setNetworkType, setToken, setRawAmount],
    );

    return (
        <Tabs value={networkType} onChange={onTypeChange} variant="solid" className="self-start">
            {redPacketTypeTabs.map((tab) => (
                <Tab value={tab.value} key={tab.value}>
                    {tab.label}
                </Tab>
            ))}
        </Tabs>
    );
});
