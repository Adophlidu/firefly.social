import { useQuery } from '@tanstack/react-query';

import { timeout } from '@/helpers/timeout.js';
import { useFireflyBridgeSupported } from '@/hooks/useFireflyBridgeSupported.js';
import { fireflyBridgeProvider } from '@/providers/firefly/Bridge.js';
import { SupportedMethod } from '@/types/bridge.js';

export function useFireflyBridgeAuthorization() {
    const { value: supported } = useFireflyBridgeSupported();
    return useQuery({
        enabled: supported,
        queryKey: ['firefly-bridge-authorization', supported],
        queryFn() {
            return timeout(fireflyBridgeProvider.request(SupportedMethod.GET_AUTHORIZATION, {}), 500);
        },
        staleTime: 0,
        gcTime: 0,
        refetchInterval: 1000,
    });
}
