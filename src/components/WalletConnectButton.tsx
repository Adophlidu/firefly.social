import { Trans } from '@lingui/react/macro';
import { ChainId as EVMChainId } from '@masknet/web3-shared-evm';
import { ChainId as SolanaChainId } from '@masknet/web3-shared-solana';
import { useAppKitAccount } from '@reown/appkit/react';
import { memo } from 'react';

import WalletIcon from '@/assets/wallet.svg';
import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { Image } from '@/components/Image.js';
import { NetworkPluginID } from '@/constants/enum.js';
import { classNames } from '@/helpers/classNames.js';
import { getNetworkDescriptor } from '@/helpers/getNetworkDescriptor.js';
import { useAppKitAllAccounts } from '@/hooks/useAppKitAllAccounts.js';
import { ConnectModalRef, MyWalletsModalRef } from '@/modals/controls.js';
import type { ChainNamespace } from '@/types/index.js';

interface WalletConnectButtonProps extends ClickableButtonProps {}

const evmNetworkDescriptor = getNetworkDescriptor(NetworkPluginID.PLUGIN_EVM, EVMChainId.Mainnet);
const solanaNetworkDescriptor = getNetworkDescriptor(NetworkPluginID.PLUGIN_SOLANA, SolanaChainId.Mainnet);

const IconMap: Record<ChainNamespace, string | undefined> = {
    eip155: evmNetworkDescriptor?.icon,
    solana: solanaNetworkDescriptor?.icon,
    polkadot: undefined,
    bip122: undefined,
};

export const WalletConnectButton = memo<WalletConnectButtonProps>(function WalletConnectButton({ className, ...rest }) {
    const { address } = useAppKitAccount();
    const accounts = useAppKitAllAccounts();

    return (
        <ClickableButton
            className={classNames(
                'flex h-10 items-center gap-3 rounded-lg bg-lightBg px-4 text-lg leading-6 text-main',
                className,
            )}
            onClick={() => {
                if (address) {
                    MyWalletsModalRef.open();
                } else {
                    ConnectModalRef.open();
                }
            }}
            {...rest}
        >
            {!address ? (
                <>
                    <WalletIcon width={20} height={20} />
                    <Trans>Connect Wallet</Trans>
                </>
            ) : (
                <>
                    <Trans>My Wallets</Trans>
                    <div className="flex">
                        {accounts.map((account, index) => {
                            const iconUrl = IconMap[account.chain];
                            return iconUrl ? (
                                <Image
                                    className={classNames('h-5 w-5 rounded-full', {
                                        '-ml-1': index > 0,
                                    })}
                                    style={{ zIndex: accounts.length - index }}
                                    width={20}
                                    height={20}
                                    src={iconUrl}
                                    alt={account.chain}
                                />
                            ) : null;
                        })}
                    </div>
                </>
            )}
        </ClickableButton>
    );
});
