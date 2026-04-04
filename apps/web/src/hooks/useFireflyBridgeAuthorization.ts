import { nativeBridgeProvider, SupportedMethod } from '@dimensiondev/native-bridge';
import { timeout } from '@dimensiondev/utils';
import { useQuery } from '@tanstack/react-query';

import { useFireflyBridgeSupported } from '@/hooks/useFireflyBridgeSupported.js';

export function useFireflyBridgeAuthorization() {
    const { data: supported = false } = useFireflyBridgeSupported();
    return useQuery({
        enabled: supported,
        queryKey: ['firefly-bridge-authorization', supported],
        queryFn() {
            return timeout(nativeBridgeProvider.request(SupportedMethod.GET_AUTHORIZATION, {}), 500);
        },
        staleTime: 0,
        gcTime: 0,
        refetchInterval: 1000,
    });
}
