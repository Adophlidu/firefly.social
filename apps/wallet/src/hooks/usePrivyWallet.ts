import { isSameEthereumAddress, isSameSolanaAddress } from '@dimensiondev/web3/utils';
import { useAppKitAccount } from '@reown/appkit/react';
import { useAtomValue } from 'jotai';

import { evmWalletAddressAtom, solanaWalletAddressAtom } from '@/store/embeddedWallets.js';

export function usePrivyWallet() {
    const evmAddress = useAtomValue(evmWalletAddressAtom);
    const solanaAddress = useAtomValue(solanaWalletAddressAtom);

    const { address: appkitEvmAddress, isConnected: isEvmConnected } = useAppKitAccount({ namespace: 'eip155' });
    const { address: appkitSolanaAddress, isConnected: isSolanaConnected } = useAppKitAccount({ namespace: 'solana' });

    const isPrivyReady =
        !!evmAddress &&
        !!solanaAddress &&
        !!appkitEvmAddress &&
        !!appkitSolanaAddress &&
        isEvmConnected &&
        isSolanaConnected &&
        isSameEthereumAddress(evmAddress, appkitEvmAddress) &&
        isSameSolanaAddress(solanaAddress, appkitSolanaAddress);

    return {
        isLoading: !isPrivyReady,
        isPrivyReady,
        evmAddress: isPrivyReady ? evmAddress : null,
        solanaAddress: isPrivyReady ? solanaAddress : null,
    };
}
