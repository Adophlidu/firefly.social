import { nativeBridgeProvider } from '@dimensiondev/native-bridge';
import { useAsyncRetry } from 'react-use';

import { InvalidResultError } from '@/constants/error.js';
import { retry } from '@/helpers/retry.js';

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
