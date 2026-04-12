import { useCallback } from 'react';

import { usePathname, useRouter, useSearchParams } from '@/esm/navigation.js';
import type { Contract } from '@/providers/types/Trending.js';

export function useUpdateContractParams() {
    const search = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    return useCallback(
        ({ chainId, address }: Contract) => {
            const params = new URLSearchParams(search);
            if (chainId) {
                params.set('chainId', String(chainId));
            } else {
                params.delete('chainId');
            }
            params.set('address', address);
            router.replace(`${pathname}?${params.toString()}`);
        },
        [pathname, router, search],
    );
}
