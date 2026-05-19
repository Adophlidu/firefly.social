'use client';

import { NetworkType } from '@dimensiondev/enums';
import { unreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo, type MouseEvent } from 'react';
import { useAsyncFn } from 'react-use';
import { switchChain } from 'wagmi/actions';

import { ActionButton, type ActionButtonProps } from '@/components/ActionButton.js';
import { wagmiConfig } from '@/configs/wagmiClient.js';
import { useAccountByNetwork } from '@/hooks/useAccountByNetwork.js';
import { WalletConnectModalRef } from '@/modals/WalletConnectModal/refs.js';

interface ChainGuardButtonProps extends ActionButtonProps {
    targetChainId?: number;
    networkType?: NetworkType;
}

export const ChainGuardButton = memo<ChainGuardButtonProps>(function ChainBoundary({
    targetChainId,
    networkType = NetworkType.Ethereum,
    children,
    onClick,
    ...props
}) {
    const account = useAccountByNetwork(networkType);

    const [{ loading }, handleClick] = useAsyncFn(
        async (event: MouseEvent<HTMLButtonElement>) => {
            switch (networkType) {
                case NetworkType.Ethereum:
                    if (targetChainId && account.chainId !== targetChainId) {
                        await switchChain(wagmiConfig, { chainId: targetChainId });
                    }
                    onClick?.(event);
                    break;
                case NetworkType.Solana:
                    onClick?.(event);
                    break;
                default:
                    unreachable(networkType);
            }
        },
        [targetChainId, account.chainId, networkType, onClick],
    );

    if (!account.isConnected) {
        return (
            <ActionButton
                {...props}
                disabled={false}
                onClick={() => {
                    switch (networkType) {
                        case NetworkType.Ethereum:
                        case NetworkType.Solana:
                            WalletConnectModalRef.open({ networkType });
                            break;
                        default:
                            unreachable(networkType);
                    }
                }}
            >
                <Trans>Connect Wallet</Trans>
            </ActionButton>
        );
    }

    return (
        <ActionButton {...props} loading={loading || props.loading} onClick={handleClick}>
            {children}
        </ActionButton>
    );
});
