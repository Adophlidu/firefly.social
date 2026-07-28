import type { Metadata } from '@/compat/nextMetadata.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { isValidTxId } from '@/helpers/isValidTxId.js';
import {
    createSwapTransactionMetadata,
    createTipsTransactionMetadata,
} from '@/providers/firefly/metadata/createTransactionMetadataFromData.js';
import { getTransactionPageData } from '@/providers/firefly/metadata/getTransactionPageData.js';

export async function getTransactionPageMetadata(chainId: number, hash: string, pathname: string): Promise<Metadata> {
    if (!isValidTxId(hash)) {
        return createSiteMetadata(pathname, {
            description: `Stay ahead of the curve with real-time on-chain activity: token swaps, trades, bets, and more.`,
        });
    }

    const pageData = await getTransactionPageData(chainId, hash);
    if (pageData?.kind === 'tips') {
        return createTipsTransactionMetadata(pathname, hash, chainId, pageData.data);
    }
    if (pageData?.kind === 'swap') {
        return createSwapTransactionMetadata(pathname, hash, chainId, pageData.data);
    }

    return createSiteMetadata(pathname, {
        description: `Stay ahead of the curve with real-time on-chain activity: token swaps, trades, bets, and more.`,
    });
}
