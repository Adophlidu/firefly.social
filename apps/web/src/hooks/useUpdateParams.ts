import { useCallback } from 'react';

import { useRouter } from '@/esm/navigation.js';

export function useUpdateParams() {
    const router = useRouter();

    return useCallback(
        (patch: URLSearchParams, pathname?: string) => {
            const params = new URLSearchParams(location.search);
            patch.forEach((value, key) => params.set(key, value));
            router.replace(`${pathname ?? location.pathname}?${params.toString()}`);
        },
        [router],
    );
}
