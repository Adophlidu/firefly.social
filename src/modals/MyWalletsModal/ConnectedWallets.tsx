import { Trans } from '@lingui/react/macro';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { memo } from 'react';
import type { Address } from 'viem';
import { useEnsName } from 'wagmi';

import EvmIcon from '@/assets/evm.svg';
import PlusIcon from '@/assets/plus.svg';
import SolanaIcon from '@/assets/solana.svg';
import WalletIcon from '@/assets/wallet.svg';
import { CircleCheckboxIcon } from '@/components/CircleCheckboxIcon.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { ConnectModalRef } from '@/modals/controls.js';

const IconMap = {
    eip155: EvmIcon,
    solana: SolanaIcon,
    polkadot: undefined,
    bip122: undefined,
};

function ConnectedItem({
    namespace,
    address,
    selected,
}: {
    namespace: 'eip155' | 'solana' | 'polkadot' | 'bip122';
    address: string;
    selected?: boolean;
}) {
    const { open } = useAppKit();
    const { data: ensName } = useEnsName({
        address: address as Address,
        query: { enabled: namespace === 'eip155' },
    });

    const Icon = IconMap[namespace] || WalletIcon;

    return (
        <ClickableButton
            key={address}
            className="flex h-10 w-full items-center justify-between gap-2 px-2 text-main"
            onClick={() => {
                open({ view: 'Account' });
            }}
        >
            <Icon className="shrink-0" width={20} height={20} />
            <span className="min-w-0 flex-1 truncate text-left">{ensName || formatAddress(address, 4)}</span>
            {selected ? <CircleCheckboxIcon checked size={20} /> : null}
        </ClickableButton>
    );
}

export const ConnectedWallets = memo(function ConnectedWallets() {
    const { allAccounts, address: currentAddress } = useAppKitAccount();

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
            {allAccounts.map((account) => {
                const address = account.address || account.publicKey;

                return address ? (
                    <ConnectedItem
                        key={address}
                        namespace={account.namespace}
                        address={address}
                        selected={isSameAddress(address, currentAddress)}
                    />
                ) : null;
            })}
        </div>
    );
});
