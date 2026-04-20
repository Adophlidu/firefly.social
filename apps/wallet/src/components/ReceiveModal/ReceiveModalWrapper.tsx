import { isSolanaChain } from '@dimensiondev/web3/chains';
import { useMemo } from 'react';

import { ReceiveModal } from '@/components/ReceiveModal/index.js';
import type { ReceiveChainItemProps } from '@/components/ReceiveModal/ReceiveChainItem.js';
import type { RouteModalProps } from '@/configs/modalRoutes.js';
import { useSwapSupportedChains } from '@/hooks/swap/useSwapSupportedChains.js';
import { useEmbeddedWalletAddresses } from '@/hooks/useCachedWalletAddresses.js';

export function ReceiveModalWrapper({ modalType: typeId, open, onClose }: RouteModalProps) {
    const { evmAddress, solanaAddress, isLoading } = useEmbeddedWalletAddresses();
    const { data: supportedChains } = useSwapSupportedChains();

    const receiveItems = useMemo(() => {
        if (!evmAddress || !solanaAddress) return [];
        return supportedChains.map<ReceiveChainItemProps>((chain) => ({
            name: chain.chainName,
            chainId: chain.chainId,
            address: isSolanaChain(chain.chainId) ? solanaAddress : evmAddress,
        }));
    }, [evmAddress, solanaAddress, supportedChains]);

    return <ReceiveModal loading={isLoading} open={open} onClose={() => onClose(typeId)} items={receiveItems} />;
}
