import { useCallback } from 'react';

import { usePathname, useRouter, useSearchParams } from '@/esm/navigation.js';
import { resolveCoinGeckoChainId } from '@/helpers/resolveCoinGeckoChainId.js';
import type { Contract } from '@/providers/types/Trending.js';

export function useUpdateContractParams() {
    const search = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    return useCallback(
        (contract: Contract) => {
            const chainId = resolveCoinGeckoChainId(contract.runtime);
            const params = new URLSearchParams(search);
            if (chainId) {
                params.set('chainId', String(chainId));
            } else {
                params.delete('chainId');
            }
            params.set('address', contract.address);
            router.replace(`${pathname}?${params.toString()}`);
        },
        [pathname, router, search],
    );
}
