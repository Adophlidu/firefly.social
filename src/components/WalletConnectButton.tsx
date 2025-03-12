import { Trans } from '@lingui/react/macro';
import { delay } from '@masknet/kit';
import { ChainId as EVMChainId } from '@masknet/web3-shared-evm';
import { ChainId as SolanaChainId } from '@masknet/web3-shared-solana';
import { compact } from 'lodash-es';
import { memo } from 'react';

import WalletIcon from '@/assets/wallet.svg';
import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { Image } from '@/components/Image.js';
import { NetworkPluginID, NetworkType } from '@/constants/enum.js';
import { classNames } from '@/helpers/classNames.js';
import { getNetworkDescriptor } from '@/helpers/getNetworkDescriptor.js';
import { useWalletAccountAll } from '@/hooks/useAccountByNetwork.js';
import { ConnectModalRef, MyWalletsModalRef } from '@/modals/controls.js';
import { useNavigatorState } from '@/store/useNavigatorStore.js';

interface WalletConnectButtonProps extends ClickableButtonProps {}

const evmNetworkDescriptor = getNetworkDescriptor(NetworkPluginID.PLUGIN_EVM, EVMChainId.Mainnet);
const solanaNetworkDescriptor = getNetworkDescriptor(NetworkPluginID.PLUGIN_SOLANA, SolanaChainId.Mainnet);

const IconMap: Record<NetworkType, string | undefined> = {
    [NetworkType.Ethereum]: evmNetworkDescriptor?.icon,
    [NetworkType.Solana]: solanaNetworkDescriptor?.icon,
};

export const WalletConnectButton = memo<WalletConnectButtonProps>(function WalletConnectButton({ className, ...rest }) {
    const { ethereum, solana } = useWalletAccountAll();
    const { sidebarOpen, updateSidebarOpen } = useNavigatorState();

    const connectedNetworks = compact([
        ethereum.isConnected ? NetworkType.Ethereum : null,
        solana.isConnected ? NetworkType.Solana : null,
    ]);

    return (
        <ClickableButton
            className={classNames(
                'flex h-10 items-center gap-3 rounded-lg bg-lightBg px-4 text-lg leading-6 text-main',
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
                    ConnectModalRef.open();
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
                                    className={classNames('h-5 w-5 rounded-full', {
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
