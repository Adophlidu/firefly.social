import { useAtomValue } from 'jotai';
import { useMemo } from 'react';

import { isSolanaChain } from '@/helpers/isSolanaChain.js';
import { useSwapContextWalletAddresses } from '@/hooks/useCachedWalletAddresses.js';
import {
    accessPathAtom,
    externalEvmAddressAtom,
    externalSolanaAddressAtom,
    selectedPayWalletAtom,
    selectedReceiveWalletAtom,
    SwapAccessPath,
} from '@/store/swap/swapState.js';

/**
 * Returns the effective wallet address for swap, considering:
 * - User's selected wallet override
 * - Entry mode (internal WalletGUI vs external)
 * - Chain type and available addresses
 */
export function useEffectiveSwapWalletAddress(side: 'pay' | 'receive', chainId: number | null): string | null {
    const accessPath = useAtomValue(accessPathAtom);
    const externalEvmAddress = useAtomValue(externalEvmAddressAtom);
    const externalSolanaAddress = useAtomValue(externalSolanaAddressAtom);
    const selectedPayWallet = useAtomValue(selectedPayWalletAtom);
    const selectedReceiveWallet = useAtomValue(selectedReceiveWalletAtom);

    const { evmAddress, solanaAddress } = useSwapContextWalletAddresses();

    return useMemo(() => {
        // Selected wallet override takes precedence
        const selectedOverride = side === 'pay' ? selectedPayWallet : selectedReceiveWallet;
        if (selectedOverride) return selectedOverride;

        const isInternalMode = accessPath === SwapAccessPath.WalletGUI;

        // Internal mode: use embedded wallets, prefer chain-matching address
        if (isInternalMode) {
            if (chainId && isSolanaChain(chainId)) {
                return solanaAddress;
            }
            return evmAddress ?? solanaAddress ?? null;
        }

        // External mode: prefer external wallet matching chain > any external > embedded
        const isCurrentSolanaChain = chainId && isSolanaChain(chainId);

        if (isCurrentSolanaChain && externalSolanaAddress) {
            return externalSolanaAddress;
        }
        if (externalEvmAddress) {
            return externalEvmAddress;
        }
        if (externalSolanaAddress) {
            return externalSolanaAddress;
        }
        if (isCurrentSolanaChain) {
            return solanaAddress;
        }
        return evmAddress ?? solanaAddress ?? null;
    }, [
        side,
        selectedPayWallet,
        selectedReceiveWallet,
        accessPath,
        chainId,
        evmAddress,
        solanaAddress,
        externalEvmAddress,
        externalSolanaAddress,
    ]);
}
