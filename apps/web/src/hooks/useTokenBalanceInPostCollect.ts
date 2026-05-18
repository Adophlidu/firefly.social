import { Source } from '@dimensiondev/enums';
import type { SocialSource } from '@/constants/enum.js';
import { useTokenBalanceForLoggedInLensProfile } from '@/hooks/useTokenBalanceForCurrentProfile.js';

export function useTokenBalanceInPostCollect(source: SocialSource, tokenAddress?: string) {
    const isLens = source === Source.Lens;
    const lensBalance = useTokenBalanceForLoggedInLensProfile(tokenAddress, isLens);

    return {
        balance: isLens ? lensBalance.data : 0,
        isLoading: isLens ? lensBalance.isLoading : false,
    };
}
