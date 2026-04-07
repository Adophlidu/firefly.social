import { createFileRoute } from '@tanstack/react-router';

import { LoadingPanel } from '@/components/LoadingPanel.js';
import { NFTs } from '@/components/NFTs/index.js';
import { useCachedEvmAddress } from '@/hooks/useCachedWalletAddresses.js';

export const Route = createFileRoute('/_home/nfts')({
    component: NFTsPage,
    pendingComponent: LoadingPanel,
});

function NFTsPage() {
    const evmAddress = useCachedEvmAddress();

    if (!evmAddress) return <LoadingPanel />;

    return <NFTs address={evmAddress} />;
}
