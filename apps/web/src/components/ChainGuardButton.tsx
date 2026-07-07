'use client';

import { NetworkType } from '@dimensiondev/enums';
import { unreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo, type MouseEvent } from 'react';
import { useAsyncFn } from 'react-use';
import { switchChain } from 'wagmi/actions';

import { ActionButton, type ActionButtonProps } from '@/components/ActionButton.js';
import { loadWagmiClient } from '@/configs/wagmiClientLoader.js';
import { openWalletConnectModal } from '@/controllers/openWalletConnectModal.js';
import { useAccountByNetwork } from '@/hooks/useAccountByNetwork.js';

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
                        // Loaded on demand: this button renders on read-only pages
                        // (collect / vote / red packet), and switching chains implies a
                        // connected wallet, i.e. the wallet stack is already loaded.
                        const { wagmiConfig } = await loadWagmiClient();
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
                            openWalletConnectModal({ networkType });
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
