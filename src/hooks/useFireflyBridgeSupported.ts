import { nativeBridgeProvider } from '@dimensiondev/native-bridge';
import { InvalidResultError, retry } from '@dimensiondev/utils';
import { useAsyncRetry } from 'react-use';

export function useFireflyBridgeSupported(signal?: AbortSignal) {
    return useAsyncRetry(async () => {
        return retry(
            async () => {
                if (!nativeBridgeProvider.supported) throw new InvalidResultError();
                return true;
            },
            {
                times: 5,
                interval: 300,
                signal,
            },
        );
    }, [signal]);
}
