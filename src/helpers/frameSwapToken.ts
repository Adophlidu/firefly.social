import { delay } from '@dimensiondev/utils';
import type { MiniAppHost } from '@farcaster/miniapp-host';

import { SOLANA_CHAIN_ID_IN_FIREFLY } from '@/constants/debank.js';
import { OkxProviderType } from '@/constants/enum.js';
import { logger } from '@/libs/Logger.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { parseCAIP19 } from '@/helpers/parseCAIP19.js';
import { SwapModalRef } from '@/modals/SwapModal/SwapModal.js';

export const frameSwapToken: MiniAppHost['swapToken'] = async function frameSwapToken(options) {
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
    const address = buyTokenAddress || sellTokenAddress;

    const providerType =
        chainId !== SOLANA_CHAIN_ID_IN_FIREFLY || isValidAddressEthereum(address)
            ? OkxProviderType.EVM
            : OkxProviderType.SOLANA;

    // await for modal to register
    await delay(1000);
    SwapModalRef.open({
        providerType,
        chainId,
        fromToken: sellTokenAddress || undefined,
        toToken: buyTokenAddress,
    });

    // TODO We can't get the result of the swap from OKX widget yet.
    return {
        success: true,
        swap: {
            transactions: [],
        },
    };
};
