import type { Metadata } from 'next';

import { TipsNotificationType } from '@/constants/enum.js';
import { notFound } from '@/esm/navigation/server.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { isValidTxId } from '@/helpers/isValidTxId.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { getSwapActivityByHash } from '@/providers/firefly/endpoints/getSwapActivityByHash.js';
import { getTipsTransactionDetail } from '@/providers/firefly/endpoints/getTipsTransactionDetail.js';

export async function generateMetadata({ params }: { params: { chain_id: string; hash: string } }): Promise<Metadata> {
    const { chain_id, hash } = params;
    const chainId = Number(chain_id);

    if (!isValidTxId(hash)) notFound();

    // Try to get Tip transaction details
    const tipsData = await runInSafeAsync(() => getTipsTransactionDetail(hash, TipsNotificationType.Tip));

    // Try to get Swap transaction details
    const swapData = await runInSafeAsync(() => getSwapActivityByHash(hash, chainId));

    // If both transaction types don't exist, return 404
    if (!tipsData && !swapData) {
        notFound();
    }

    let title = 'Transaction Details | Firefly';
    let description = 'View transaction details on Firefly';

    if (tipsData) {
        title = `Tip Transaction | ${tipsData.token_symbol} | Firefly`;
        description = `${formatAddress(tipsData.from_address)} sent ${tipsData.amount} ${tipsData.token_symbol} to ${formatAddress(tipsData.to_address)} on Firefly`;
    } else if (swapData) {
        title = `Swap Transaction | ${swapData.from_token?.symbol || ''} to ${swapData.to_token?.symbol || ''} | Firefly`;
        if (swapData.from_token && swapData.to_token) {
            description = `Swapped ${swapData.from_token.amount_num} ${swapData.from_token.symbol} for ${swapData.to_token.amount_num} ${swapData.to_token.symbol} on Firefly`;
        }
    }

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'article',
            url: `https://firefly.social/tx/${chain_id}/${hash}`,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
    };
}
