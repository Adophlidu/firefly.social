import { Trans } from '@lingui/react/macro';
import {
    AccountController,
    type ChainAdapter,
    useAppKit,
    useAppKitAccount,
    useAppKitNetwork,
} from '@reown/appkit/react';
import { first } from 'lodash-es';
import { memo, useCallback, useEffect } from 'react';
import type { Address } from 'viem';
import { useEnsName } from 'wagmi';

import EvmIcon from '@/assets/evm.svg';
import PlusIcon from '@/assets/plus.svg';
import SolanaIcon from '@/assets/solana.svg';
import WalletIcon from '@/assets/wallet.svg';
import { CircleCheckboxIcon } from '@/components/CircleCheckboxIcon.js';
import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { useAppKitAllAccounts } from '@/hooks/useAppKitAllAccounts.js';
import { ConnectModalRef } from '@/modals/controls.js';
import { restoreDisconnectMethod, rewriteDisconnectMethod } from '@/modals/MyWalletsModal/rewriteDisconnectMethod.js';
import type { ChainNamespace } from '@/types/index.js';

const IconMap = {
    eip155: EvmIcon,
    solana: SolanaIcon,
    polkadot: undefined,
    bip122: undefined,
};

interface ConnectedItemProps extends ClickableButtonProps {
    namespace: 'eip155' | 'solana' | 'polkadot' | 'bip122';
    address: string;
    selected?: boolean;
}

function ConnectedItem({ namespace, address, selected, ...rest }: ConnectedItemProps) {
    const { data: ensName } = useEnsName({
        address: address as Address,
        query: { enabled: namespace === 'eip155' },
    });

    const Icon = IconMap[namespace] || WalletIcon;

    return (
        <ClickableButton
            key={address}
            className="flex h-10 w-full items-center justify-between gap-2 px-2 text-main"
            {...rest}
        >
            <Icon className="shrink-0" width={20} height={20} />
            <span className="min-w-0 flex-1 truncate text-left">{ensName || formatAddress(address, 4)}</span>
            {selected ? <CircleCheckboxIcon checked size={20} /> : null}
        </ClickableButton>
    );
}

function resetWalletProfile(namespace: ChainNamespace) {
    if (namespace !== 'eip155') {
        AccountController.setProfileName(undefined, namespace);
        AccountController.setProfileImage(undefined, namespace);
    }
}

export const ConnectedWallets = memo(function ConnectedWallets() {
    const { open } = useAppKit();
    const { address: activeAddress } = useAppKitAccount();
    const { switchNetwork } = useAppKitNetwork();
    const accounts = useAppKitAllAccounts();

    const openAccountModal = useCallback(
        (adapter: ChainAdapter, namespace: ChainNamespace) => {
            if (!isSameAddress(adapter.accountState?.address, activeAddress)) {
                const network = first(adapter.caipNetworks);
                if (!network) {
                    enqueueErrorMessage('Failed to switch network, no network found.');
                    return;
                }
                switchNetwork(network);
            }
            rewriteDisconnectMethod(namespace);
            resetWalletProfile(namespace);
            open({ view: 'Account' });
        },
        [activeAddress, switchNetwork, open],
    );

    useEffect(() => restoreDisconnectMethod, []);

    return (
        <div className="overflow-hidden rounded-lg border border-secondaryLine">
            <ClickableButton
                className="flex h-10 w-full items-center justify-between gap-2 border-b border-secondaryLine bg-lightBg px-2 text-main"
                onClick={() => {
                    ConnectModalRef.open();
                }}
            >
                <WalletIcon width={20} height={20} />
                <span className="min-w-0 flex-1 truncate text-left text-sm">
                    <Trans>Connecting wallets</Trans>
                </span>
                <PlusIcon width={20} height={20} />
            </ClickableButton>
            {!accounts.length ? (
                <div className="flex h-10 items-center justify-center text-sm text-secondary">
                    <Trans>No connected wallet.</Trans>
                </div>
            ) : null}
            {accounts.map((account) => {
                return (
                    <ConnectedItem
                        key={account.address}
                        namespace={account.chain}
                        address={account.address}
                        selected
                        onClick={() => {
                            openAccountModal(account.adapter, account.chain);
                        }}
                    />
                );
            })}
        </div>
    );
});
