import DisconnectIcon from '@dimensiondev/assets/disconnect.svg';
import { formatAddress, isValidAddressEthereum } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';

import { CopyTextButton } from '@/components/CopyTextButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { useEnsName } from '@/hooks/useEnsName.js';
import { ConfirmModalRef } from '@/modals/ConfirmModal/refs.js';

interface WalletItemProps {
    address: string;
    isDeleting?: boolean;
    onDisconnect?: (address: string) => void;
}

export function WalletItem({ address, isDeleting, onDisconnect }: WalletItemProps) {
    const isEthereumAddress = isValidAddressEthereum(address);
    const { data: ensName } = useEnsName(isEthereumAddress ? address : undefined, isEthereumAddress);
    const handleDisconnect = async () => {
        if (!onDisconnect || isDeleting) return;
        const confirmed = await ConfirmModalRef.openAndWaitForClose({
            title: <Trans>Remove Address</Trans>,
            content: (
                <div className="text-medium text-main md:text-base">
                    <Trans>Confirm to remove this verified address from your Farcaster profile?</Trans>
                </div>
            ),
            variant: 'danger',
            confirmButtonText: <Trans>Confirm</Trans>,
        });
        if (confirmed) onDisconnect(address);
    };

    return (
        <div className="border-line flex items-center gap-2 rounded-lg border px-3 py-2">
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                {ensName ? (
                    <div className="flex items-center gap-1">
                        <span className="text-main text-base font-bold leading-[19.36px]">{ensName}</span>
                    </div>
                ) : null}
                <div className="flex items-center gap-1">
                    <span
                        className={`text-[15px] leading-[18.15px] ${ensName ? 'text-second' : 'text-main font-bold'}`}
                    >
                        {formatAddress(address, 8)}
                    </span>
                    <CopyTextButton text={address} size={14} />
                </div>
            </div>
            <button
                type="button"
                disabled={isDeleting}
                className="flex shrink-0 items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleDisconnect}
            >
                {isDeleting ? (
                    <LoadingIcon size={20} />
                ) : (
                    <DisconnectIcon width={20} height={20} className="text-second" />
                )}
            </button>
        </div>
    );
}
