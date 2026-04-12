import { CoreAssetUtil, CoreConnectionController, CoreRouterController } from '@reown/appkit';
import { memo } from 'react';
import urlcat from 'urlcat';

import { WalletChainConfig, walletConnectId, type WalletId } from '@/constants/reown.js';
import type { AppkitWalletItem } from '@/hooks/appkit/useAppkitWalletList.js';
import { findConnectorByWallet } from '@/modals/WalletConnectModal/findConnectorByWallet.js';
import { walletRouter } from '@/modals/WalletConnectModal/routes.js';
import { selectWallet } from '@/modals/WalletConnectModal/selectWallet.js';
import { WalletItem } from '@/modals/WalletConnectModal/WalletItem.js';

interface AppkitWalletProps {
    item: AppkitWalletItem;
}

function onWalletClick(item: AppkitWalletItem) {
    const { subtype, wallet } = item;
    const walletName = wallet.name ? encodeURIComponent(wallet.name) : undefined;

    if (subtype === 'featured' || subtype === 'recent') {
        selectWallet(wallet);
        return;
    }

    if (subtype === 'custom') {
        CoreRouterController.state.data = { wallet, redirectView: undefined };
        walletRouter.navigate({
            to: urlcat('/connecting-wc', { name: walletName }),
        });
        return;
    }

    const connector = findConnectorByWallet(wallet);
    if (connector) {
        CoreRouterController.state.data = { connector, redirectView: undefined };
        walletRouter.navigate({ to: urlcat('/connecting', { name: walletName }) });
    } else {
        CoreRouterController.state.data = { wallet, redirectView: undefined };
        walletRouter.navigate({
            to: urlcat('/connecting-wc', { name: walletName }),
        });
    }
}

export const AppkitWallet = memo<AppkitWalletProps>(function AppkitWallet({ item }) {
    const wallet = item.wallet;
    const imageSrc = CoreAssetUtil.getWalletImage(wallet);
    const hasWcConnection = CoreConnectionController.hasAnyConnection(walletConnectId);

    return (
        <WalletItem
            data-wallet-type={`wallet-${item.subtype}`}
            installed={false}
            disabled={hasWcConnection}
            name={wallet.name}
            icon={imageSrc}
            chains={WalletChainConfig[wallet.id as WalletId] || []}
            onClick={() => onWalletClick(item)}
        />
    );
});
