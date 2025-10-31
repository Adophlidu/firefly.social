import { classNames, delay } from '@firefly/utils';
import { Trans } from '@lingui/react/macro';
import { compact } from 'lodash-es';
import { memo } from 'react';
import { useEffectOnce } from 'react-use';
import { mainnet } from 'viem/chains';
import { useConnections } from 'wagmi';

import WalletIcon from '@/assets/wallet.svg';
import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { Image } from '@/components/Image.js';
import { queryClient } from '@/configs/queryClient.js';
import { ClickOrigin, NetworkPluginID, NetworkType } from '@/constants/enum.js';
import { getNetworkDescriptor } from '@/helpers/getNetworkDescriptor.js';
import { useWalletAccountAll } from '@/hooks/useAccountByNetwork.js';
import { fetchEnsName } from '@/hooks/useEnsNameCached.js';
import { MyWalletsModalRef } from '@/modals/MyWalletsModal/index.js';
import { WalletConnectModalRef } from '@/modals/WalletConnectModal/index.js';
import { useNavigatorState } from '@/store/useNavigatorStore.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

interface WalletConnectButtonProps extends ClickableButtonProps {}

const evmNetworkDescriptor = getNetworkDescriptor(NetworkPluginID.PLUGIN_EVM, EthereumChainId.Mainnet);
const solanaNetworkDescriptor = getNetworkDescriptor(NetworkPluginID.PLUGIN_SOLANA, SolanaChainId.Mainnet);

const IconMap: Record<NetworkType, string | undefined> = {
    [NetworkType.Ethereum]: evmNetworkDescriptor?.icon,
    [NetworkType.Solana]: solanaNetworkDescriptor?.icon,
};

export const WalletConnectButton = memo<WalletConnectButtonProps>(function WalletConnectButton({ className, ...rest }) {
    const { ethereum, solana } = useWalletAccountAll();
    const { sidebarOpen, updateSidebarOpen } = useNavigatorState();
    const connections = useConnections();

    const connectedNetworks = compact([
        ethereum.isConnected ? NetworkType.Ethereum : null,
        solana.isConnected ? NetworkType.Solana : null,
    ]);

    useEffectOnce(() => {
        if (!connections.length) return;

        connections.forEach((connection) => {
            queryClient.prefetchQuery({
                queryKey: ['ensName', connection.accounts[0], mainnet.id],
                queryFn: () =>
                    fetchEnsName({
                        address: connection.accounts[0],
                    }),
            });
        });
    });

    return (
        <ClickableButton
            className={classNames(
                'flex h-10 items-center gap-3 whitespace-nowrap rounded-lg bg-lightBg px-4 text-lg leading-6 text-main',
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
