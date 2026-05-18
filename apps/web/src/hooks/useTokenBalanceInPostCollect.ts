import type { SocialSource } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';

import { useTokenBalanceForLoggedInLensProfile } from '@/hooks/useTokenBalanceForCurrentProfile.js';

export function useTokenBalanceInPostCollect(source: SocialSource, tokenAddress?: string) {
    const isLens = source === Source.Lens;
    const lensBalance = useTokenBalanceForLoggedInLensProfile(tokenAddress, isLens);

    return {
        balance: isLens ? lensBalance.data : 0,
        isLoading: isLens ? lensBalance.isLoading : false,
    };
}
