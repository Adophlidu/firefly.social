import { delay } from '@dimensiondev/utils';

import { logger } from '@/lib/Logger.js';
import type { SwapEndpoint } from '@/providers/swap/swapEndpoint.js';

const UPLOAD_MAX_RETRIES = 3;
const UPLOAD_RETRY_DELAY_MS = 3000;
const DETAIL_MAX_RETRIES = 5;
const DETAIL_RETRY_DELAY_MS = 2000;

export async function uploadSwapTx(endpoint: SwapEndpoint, chainId: number, hash: string, isBridge: boolean) {
    // Step 1: Retry upload
    for (let attempt = 1; attempt <= UPLOAD_MAX_RETRIES; attempt += 1) {
        try {
            const ok = await endpoint.uploadSwap({
                chain_id: chainId,
                hash,
                is_bridge: isBridge,
            });
            if (ok) break;
        } catch (err) {
            logger.error(`Swap upload attempt ${attempt}/${UPLOAD_MAX_RETRIES} failed`, err);
        }

        if (attempt < UPLOAD_MAX_RETRIES) {
            await delay(UPLOAD_RETRY_DELAY_MS);
        }
    }

    // Step 2: Poll swap detail to confirm data is available
    for (let attempt = 1; attempt <= DETAIL_MAX_RETRIES; attempt += 1) {
        try {
            const ready = await endpoint.getSwapDetail({
                chain_id: chainId,
                hash,
                is_bridge: isBridge,
            });
            if (ready) return;
        } catch (err) {
            logger.error(`Swap detail poll attempt ${attempt}/${DETAIL_MAX_RETRIES} failed`, err);
        }

        if (attempt < DETAIL_MAX_RETRIES) {
            await delay(DETAIL_RETRY_DELAY_MS);
        }
    }

    logger.error(`Swap detail not available after ${DETAIL_MAX_RETRIES} polls for tx: ${hash}`);
}
