import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import { type MiniAppHost } from '@farcaster/miniapp-host';

import { parseCAIP19 } from '@/helpers/parseCAIP19.js';
import { logger } from '@/libs/Logger.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

export const frameSwapToken = async function frameSwapToken(options) {
    const buyToken = options.buyToken ? parseCAIP19(options.buyToken) : undefined;
    const sellToken = options.sellToken ? parseCAIP19(options.sellToken) : undefined;
    if (!buyToken && !sellToken) {
        logger.warn('[frame host]: swapToken', options);
        return { success: false, reason: 'swap_failed' };
    }
    const originChainId = buyToken?.chainReference || sellToken?.chainReference;
    if (!originChainId) {
        logger.warn('No chain id', options);
        return { success: false, reason: 'swap_failed' };
    }
    const chainId = Number.parseInt(originChainId, 10);
    const buyTokenAddress = buyToken?.reference;
    const sellTokenAddress = sellToken?.reference;

    const params = new URLSearchParams();
    params.set('chain', chainId.toString());
    if (sellTokenAddress) params.set('from', sellTokenAddress);
    if (buyTokenAddress) params.set('to', buyTokenAddress);

    const swapPath = `/swap?${params.toString()}`;

    useGlobalState.getState().updateFireflyWalletIsOpen(true);
    iframeBridgeProvider.request(IframeBridgeMethod.NAVIGATE, { path: swapPath });

    // TODO We can't get the result of the swap yet.
    return {
        success: true,
        swap: {
            transactions: [],
        },
    };
} as MiniAppHost['swapToken'];
