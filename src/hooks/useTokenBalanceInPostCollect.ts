import type { Hex } from 'viem';
import { useAccount, useBalance } from 'wagmi';

import { type SocialSource, Source } from '@/constants/enum.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { ETH_ZERO_ADDRESS } from '@/helpers/isZeroAddress.js';
import { useTokenBalanceForLoggedInLensProfile } from '@/hooks/useTokenBalanceForCurrentProfile.js';

export function useTokenBalanceInPostCollect(source: SocialSource, tokenAddress?: string) {
    const account = useAccount();

    const isLens = source === Source.Lens;
    const lensBalance = useTokenBalanceForLoggedInLensProfile(tokenAddress, isLens);

    const verifiedAssetAddress = !!tokenAddress && !isSameEthereumAddress(tokenAddress, ETH_ZERO_ADDRESS);
    const { data: balanceData, isLoading: queryBalanceLoading } = useBalance({
        address: account.address,
        token: verifiedAssetAddress ? (tokenAddress as Hex) : undefined,
        query: {
            enabled: !!account.address && !!tokenAddress && !isLens,
        },
    });

    return {
        balance: isLens ? lensBalance.data : Number.parseFloat(balanceData?.formatted || '0'),
        isLoading: isLens ? lensBalance.isLoading : queryBalanceLoading,
    };
}
