'use client';

import WalletIcon from '@dimensiondev/assets/wallet.svg';
import { ClickOrigin, NetworkType } from '@dimensiondev/enums';
import { classNames, delay } from '@dimensiondev/utils';
import { getChainIcon, solana as solanaMainnetChain } from '@dimensiondev/web3/chains';
import { Trans } from '@lingui/react/macro';
import { compact } from 'lodash-es';
import { memo, useMemo } from 'react';
import { mainnet } from 'viem/chains';

import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { Image } from '@/components/Image.js';
import { useWalletAccountAll } from '@/hooks/useAccountByNetwork.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { MyWalletsModalRef } from '@/modals/MyWalletsModal/refs.js';
import { WalletConnectModalRef } from '@/modals/WalletConnectModal/refs.js';
import { useFireflyWalletStore } from '@/store/useFireflyWalletStore.js';
import { useNavigatorState } from '@/store/useNavigatorStore.js';

interface WalletConnectButtonProps extends ClickableButtonProps {}

const IconMap: Record<NetworkType, string | undefined> = {
    [NetworkType.Ethereum]: getChainIcon(mainnet.id),
    [NetworkType.Solana]: getChainIcon(solanaMainnetChain.id),
};

export const WalletConnectButton = memo<WalletConnectButtonProps>(function WalletConnectButton({ className, ...rest }) {
    const { ethereum, solana } = useWalletAccountAll();
    const { sidebarOpen, updateSidebarOpen } = useNavigatorState();
    const isLoginFirefly = useIsLoginFirefly();
    const { isAuthorized, wallets } = useFireflyWalletStore();

    const privyConnected = isLoginFirefly && isAuthorized;
    const connectedNetworks = useMemo(
        () =>
            compact([
                ethereum.isConnected || (privyConnected && wallets.ethereum.length > 0) ? NetworkType.Ethereum : null,
                solana.isConnected || (privyConnected && wallets.solana.length > 0) ? NetworkType.Solana : null,
            ]),
        [privyConnected, solana.isConnected, ethereum.isConnected, wallets.solana.length, wallets.ethereum.length],
    );

    return (
        <ClickableButton
            className={classNames(
                'bg-lightBg text-main flex h-10 items-center gap-3 whitespace-nowrap rounded-lg px-4 text-lg leading-6',
                className,
            )}
            onClick={async () => {
                if (sidebarOpen) {
                    updateSidebarOpen(false);
                    await delay(300);
                }
                if (connectedNetworks.length) {
                    MyWalletsModalRef.open();
                } else {
                    WalletConnectModalRef.open({
                        origin: ClickOrigin.NavBar,
                    });
                }
            }}
            {...rest}
        >
            {!connectedNetworks.length ? (
                <>
                    <WalletIcon width={20} height={20} />
                    <Trans>Connect Wallet</Trans>
                </>
            ) : (
                <>
                    <Trans>My Wallets</Trans>
                    <div className="flex">
                        {connectedNetworks.map((networkType, index) => {
                            const iconUrl = IconMap[networkType];
                            return iconUrl ? (
                                <Image
                                    key={networkType}
                                    className={classNames('size-5 rounded-full', {
                                        '-ml-1': index > 0,
                                    })}
                                    style={{ zIndex: connectedNetworks.length - index }}
                                    width={20}
                                    height={20}
                                    src={iconUrl}
                                    alt={networkType}
                                />
                            ) : null;
                        })}
                    </div>
                </>
            )}
        </ClickableButton>
    );
});
