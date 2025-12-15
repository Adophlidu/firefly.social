import { useMemo } from 'react';

import { PRIVY_CONNECTOR_ID } from '@/connectors/PrivyConnector.js';
import { useAppkitWalletList } from '@/hooks/appkit/useAppkitWalletList.js';
import { AllWalletsEntry } from '@/modals/WalletConnectModal/AllWalletsEntry.js';
import { AppkitConnector } from '@/modals/WalletConnectModal/AppkitConnector.js';
import { AppkitWallet } from '@/modals/WalletConnectModal/AppkitWallet.js';
import { sortWallets } from '@/modals/WalletConnectModal/sortWallets.js';

export function WalletListView() {
    const appkitWallets = useAppkitWalletList();
    const sortedWallets = useMemo(
        () =>
            sortWallets(
                appkitWallets.filter((x) => !(x.kind === 'connector' && x.connector.id === PRIVY_CONNECTOR_ID)),
            ),
        [appkitWallets],
    );

    return (
        <div className="space-y-2">
            {sortedWallets.map((item) =>
                item.kind === 'connector' ? (
                    <AppkitConnector item={item} key={`${item.kind}-${item.subtype}-${item.connector.id}`} />
                ) : item.kind === 'wallet' ? (
                    <AppkitWallet item={item} key={`${item.kind}-${item.subtype}-${item.wallet.id}`} />
                ) : null,
            )}
            <AllWalletsEntry />
        </div>
    );
}
