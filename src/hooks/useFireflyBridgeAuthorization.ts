import { nativeBridgeProvider, SupportedMethod } from '@firefly/native-bridge';
import { timeout } from '@firefly/utils';
import { useQuery } from '@tanstack/react-query';

import { useFireflyBridgeSupported } from '@/hooks/useFireflyBridgeSupported.js';

export function useFireflyBridgeAuthorization() {
    const { value: supported = false } = useFireflyBridgeSupported();
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
