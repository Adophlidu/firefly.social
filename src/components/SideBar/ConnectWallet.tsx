'use client';

import { Trans } from '@lingui/react/macro';
import { useAppKitAccount } from '@reown/appkit/react';

import WalletIcon from '@/assets/wallet.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { classNames } from '@/helpers/classNames.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { AccountModalRef, ConnectModalRef } from '@/modals/controls.js';

export function ConnectWallet() {
    const { address } = useAppKitAccount();
    return (
        <ClickableButton
            className={classNames(
                'flex w-full flex-grow-0 items-center gap-x-3 rounded-lg px-2 py-2 text-lg leading-6 outline-none hover:bg-bg md:w-auto md:px-4',
            )}
            onClick={() => {
                if (address) {
                    AccountModalRef.open();
                } else {
                    ConnectModalRef.open();
                }
            }}
        >
            <WalletIcon width={20} height={20} />
            <span className="inline-block w-full truncate">
                {address ? formatAddress(address, 4) : <Trans>Connect Wallet</Trans>}
            </span>
        </ClickableButton>
    );
}
