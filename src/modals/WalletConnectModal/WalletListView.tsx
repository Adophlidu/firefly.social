import { useAppkitWalletList } from '@/hooks/appkit/useAppkitWalletList.js';
import { AllWalletsEntry } from '@/modals/WalletConnectModal/AllWalletsEntry.js';
import { AppkitConnector } from '@/modals/WalletConnectModal/AppkitConnector.js';
import { AppkitWallet } from '@/modals/WalletConnectModal/AppkitWallet.js';

export function WalletListView() {
    const appkitWallets = useAppkitWalletList();

    return (
        <div className="space-y-2">
            {appkitWallets.map((item) =>
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
