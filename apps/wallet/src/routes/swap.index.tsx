import { isNativeTokenAddress } from '@dimensiondev/web3/utils';
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';

import { SwapNavigationBar } from '@/components/SwapUI/SwapNavigationBar.js';
import { SwapPanel } from '@/components/SwapUI/SwapPanel.js';
import { getDefaultSwapToken } from '@/providers/swap/defaultTokens.js';
import {
    accessPathAtom,
    externalEvmAddressAtom,
    externalSolanaAddressAtom,
    fromChainIdAtom,
    setFromTokenAtom,
    setToTokenAtom,
    type SwapAccessPath,
    toChainIdAtom,
} from '@/store/swap/swapState.js';

interface SwapSearch {
    chain?: string;
    toChain?: string;
    from?: string;
    to?: string;
    entry?: SwapAccessPath;
    externalEvm?: string;
    externalSolana?: string;
}

export const Route = createFileRoute('/swap/')({
    component: SwapPage,
});

function SwapPage() {
    const search = useSearch({ from: '/swap/' }) as SwapSearch;
    const navigate = useNavigate();
    const [isInitialized, setIsInitialized] = useState(false);

    const setFromToken = useSetAtom(setFromTokenAtom);
    const setToToken = useSetAtom(setToTokenAtom);
    const setFromChainId = useSetAtom(fromChainIdAtom);
    const setToChainId = useSetAtom(toChainIdAtom);
    const setAccessPath = useSetAtom(accessPathAtom);
    const setExternalEvmAddress = useSetAtom(externalEvmAddressAtom);
    const setExternalSolanaAddress = useSetAtom(externalSolanaAddressAtom);

    // Sync URL params into atoms, then clear URL — allows new navigation to override
    useEffect(() => {
        const hasParams =
            search.chain ||
            search.from ||
            search.to ||
            search.toChain ||
            search.entry ||
            search.externalEvm ||
            search.externalSolana;

        if (hasParams) {
            const fromChainId = search.chain ? Number.parseInt(search.chain, 10) : NaN;
            const toChainRaw = search.toChain || search.chain;
            const toChainId = toChainRaw ? Number.parseInt(toChainRaw, 10) : NaN;

            // Use combined setter atoms for conflict resolution
            if (search.from && !isNaN(fromChainId)) {
                setFromToken({ address: search.from, chainId: fromChainId });
            } else if (!isNaN(fromChainId)) {
                setFromChainId(fromChainId);
            }

            if (search.to && !isNaN(toChainId)) {
                setToToken({ address: search.to, chainId: toChainId });
            } else if (!isNaN(toChainId)) {
                setToChainId(toChainId);
            }

            // Handle native token: when only `to` is set to native with no `from`,
            // use setFromToken with the stablecoin default so conflict resolution triggers
            if (search.to && !search.from && !isNaN(fromChainId) && isNativeTokenAddress(search.to)) {
                const defaults = getDefaultSwapToken(fromChainId);
                if (defaults) setFromToken({ address: defaults.second.contractAddress, chainId: fromChainId });
            }

            if (search.entry) setAccessPath(search.entry);
            if (search.externalEvm) setExternalEvmAddress(search.externalEvm);
            if (search.externalSolana) setExternalSolanaAddress(search.externalSolana);

            // Clear URL params after setting atoms
            navigate({ to: '/swap', search: {}, replace: true });
        }

        // Mark as initialized after atoms are set (or if there were no params)
        setIsInitialized(true);
    }, [
        search,
        navigate,
        setFromToken,
        setToToken,
        setFromChainId,
        setToChainId,
        setAccessPath,
        setExternalEvmAddress,
        setExternalSolanaAddress,
    ]);

    // Don't render SwapPanel until atoms are initialized to prevent wrong wallet selection
    if (!isInitialized) {
        return (
            <div className="relative mx-auto flex min-h-0 w-full max-w-[800px] grow flex-col">
                <SwapNavigationBar />
                <div className="min-h-0 grow p-4" />
            </div>
        );
    }

    return (
        <div className="relative mx-auto flex min-h-0 w-full max-w-[800px] grow flex-col">
            <SwapNavigationBar />
            <SwapPanel className="min-h-0 grow p-4" />
        </div>
    );
}
