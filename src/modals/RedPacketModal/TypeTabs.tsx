import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { memo, useCallback, useContext } from 'react';

import { Tab, Tabs } from '@/components/Tabs/index.js';
import { NetworkType } from '@/constants/enum.js';
import { RedPacketContext, redPacketTypeTabs } from '@/modals/RedPacketModal/RedPacketContext.js';

export const TypeTabs = memo(function TypeTabs() {
    const { networkType, setNetworkType, setToken, setRawAmount } = useContext(RedPacketContext);
    const wallet = useWallet();
    const solanaModal = useWalletModal();

    const onTypeChange = useCallback(
        (newType: NetworkType) => {
            if (newType === NetworkType.Solana && !wallet.connected) {
                solanaModal.setVisible(true);
                return;
            }
            setToken(undefined);
            setRawAmount('');
            setNetworkType(newType);
        },
        [wallet.connected, solanaModal, setNetworkType, setToken, setRawAmount],
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
