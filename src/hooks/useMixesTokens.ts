import { useMemo } from 'react';
import type { Address } from 'viem';

import { EMPTY_LIST } from '@/constants/index.js';
import { isZero } from '@/helpers/number.js';
import { useEvmTokens } from '@/hooks/useEvmTokens.js';
import { useSolanaTokens } from '@/hooks/useSolanaTokens.js';

export function useMixesTokens({ evmAddress, solanaAddress }: { evmAddress?: Address; solanaAddress?: string }) {
    const { tokens: evmTokens = EMPTY_LIST, isLoading: isLoadingEvmTokens } = useEvmTokens(evmAddress);
    const { data: solanaTokens = EMPTY_LIST, isLoading: isLoadingSolanaTokens } = useSolanaTokens(solanaAddress);
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
