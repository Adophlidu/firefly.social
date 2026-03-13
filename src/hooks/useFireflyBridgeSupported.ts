import { nativeBridgeProvider } from '@dimensiondev/native-bridge';
import { useQuery } from '@tanstack/react-query';

export function useFireflyBridgeSupported() {
    return useQuery({
        queryKey: ['firefly-bridge-supported'],
        queryFn: () => nativeBridgeProvider.supported,
        retry: 5,
        retryDelay: 300,
        staleTime: Infinity,
    });
}
