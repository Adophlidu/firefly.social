import { useMemo } from 'react';
import type { Address } from 'viem';

import { isZero } from '@/helpers/number.js';
import { useSolanaTokens } from '@/hooks/useSolanaTokens.js';
import { useTipsTokens } from '@/hooks/useTipsTokens.js';

export function useMixesTokens({ evmAddress, solanaAddress }: { evmAddress?: Address; solanaAddress?: string }) {
    const { tokens: evmTokens = [], isLoading: isLoadingEvmTokens } = useTipsTokens(evmAddress);
    const { data: solanaTokens = [], isLoading: isLoadingSolanaTokens } = useSolanaTokens(solanaAddress);
    const isLoading = isLoadingEvmTokens && isLoadingSolanaTokens;
    const tokens = useMemo(
        () => [...evmTokens, ...solanaTokens.filter((x) => !isZero(x.balance))],
        [evmTokens, solanaTokens],
    );
    return {
        isLoading,
        tokens,
    };
}
