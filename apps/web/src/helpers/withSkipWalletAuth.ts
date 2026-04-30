import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';

export async function withSkipWalletAuth<T>(fn: () => Promise<T>): Promise<T> {
    try {
        iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_SKIP_WALLET_AUTH, {
            skip: true,
        });

        return await fn();
    } finally {
        iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_SKIP_WALLET_AUTH, {
            skip: false,
        });
    }
}
