import { fetchAccountBalances } from '@lens-protocol/client/actions';
import { useQuery } from '@tanstack/react-query';
import { first } from 'lodash-es';

import { Source } from '@/constants/enum.js';
import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { lensSessionClientHolder } from '@/providers/lens/LensSessionClientHolder.js';

export function useTokenBalanceForLoggedInLensProfile(tokenAddress?: string, enabled = true) {
    const profile = useCurrentProfile(Source.Lens);

    return useQuery({
        queryKey: ['token-balance', Source.Lens, profile?.profileId, tokenAddress],
        enabled: !!profile?.profileId && !!tokenAddress && enabled,
        queryFn: async () => {
            if (!lensSessionClientHolder.sessionClient || !tokenAddress) return;

            const balanceResult = await ensureLensResult(
                fetchAccountBalances(lensSessionClientHolder.sessionClient, {
                    tokens: [safeEvmAddress(tokenAddress)],
                }),
            );
            const balance = first(balanceResult);

            return balance?.__typename === 'Erc20Amount' ? Number.parseFloat(balance.value) : 0;
        },
    });
}
