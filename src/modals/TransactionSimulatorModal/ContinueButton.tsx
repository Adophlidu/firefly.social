import { Trans } from '@lingui/react/macro';
import { useMemo } from 'react';
import { useAccount } from 'wagmi';

import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { NetworkType, SimulateStatus } from '@/constants/enum.js';
import { classNames } from '@/helpers/classNames.js';
import { WalletConnectModalRef } from '@/modals/controls.js';

interface ContinueButtonProps extends Omit<ClickableButtonProps, 'children'> {
    status: SimulateStatus;
}

export function ContinueButton({ status, className, onClick, ref, ...rest }: ContinueButtonProps) {
    const account = useAccount();

    const isUnConnected = !account.isConnected || !account.address;
    const isUnSafe = status === SimulateStatus.Unsafe;

    const buttonLabel = useMemo(() => {
        if (isUnConnected) return <Trans>Connect Wallet</Trans>;
        if (isUnSafe) return <Trans>Ignore the warnings to continue</Trans>;
        return <Trans>Continue</Trans>;
    }, [isUnConnected, isUnSafe]);

    return (
        <ClickableButton
            className={classNames(
                'mt-6 h-10 w-full rounded-lg text-sm font-bold',
                {
                    'bg-lightMain text-primaryBottom': !isUnSafe,
                    'bg-danger text-white': isUnSafe,
                },
                className,
            )}
            onClick={(event) => {
                if (isUnConnected) {
                    WalletConnectModalRef.open({ networkType: NetworkType.Ethereum });
                    return;
                }
                onClick?.(event);
            }}
            {...rest}
        >
            {buttonLabel}
        </ClickableButton>
    );
}
