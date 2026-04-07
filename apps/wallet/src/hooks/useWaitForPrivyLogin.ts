import { usePrivy } from '@privy-io/react-auth';
import { useCallback, useEffect, useRef } from 'react';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useWaitForPrivyLogin() {
    const privy = usePrivy();
    const readyRef = useRef(privy.ready);
    useEffect(() => {
        readyRef.current = privy.ready;
    }, [privy.ready]);
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
