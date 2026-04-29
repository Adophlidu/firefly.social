import { useCallback, useEffect, useRef } from 'react';

import { usePrivyWallet } from '@/hooks/usePrivyWallet.js';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useWaitForPrivyLogin() {
    const { isPrivyReady } = usePrivyWallet();
    const readyRef = useRef(isPrivyReady);

    useEffect(() => {
        readyRef.current = isPrivyReady;
    }, [isPrivyReady]);

    return useCallback(async ({ timeout = 10000 }: { timeout?: number } = {}) => {
        const startTime = Date.now();
        while (!readyRef.current) {
            if (Date.now() - startTime > timeout) {
                throw new Error('Timeout waiting for Privy to be ready');
            }
            await delay(100);
        }
    }, []);
}
