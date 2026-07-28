import { TipsDetailViewType } from '@dimensiondev/enums';
import { SITE_URL } from '@dimensiondev/envs/web';
import urlcat from 'urlcat';

import type { Metadata } from '@/compat/nextMetadata.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { getMaintainAccountInfo } from '@/helpers/getMaintainAccountInfo.js';
import type { SwapActivity, TipsDetail } from '@/providers/types/Firefly.js';

export function createTipsTransactionMetadata(
    pathname: string,
    hash: string,
    chainId: number,
    tips: TipsDetail,
): Metadata {
    const accountInfo = getMaintainAccountInfo(tips, TipsDetailViewType.Sender);
    const title = `${accountInfo?.maintainAccountInfo.displayName} sent a tip to ${accountInfo?.targetAccountInfo.displayName} on Firefly`;
    const description = 'Looking to grow your influence? Firefly offers tools to engage your community.';
    const images = [{ url: urlcat(SITE_URL, `/api/og/tip/${hash}/image`) }];

    return createSiteMetadata(pathname, {
        title,
        description,
        openGraph: {
            title,
            description,
            images,
            url: urlcat(SITE_URL, `/tx/${chainId}/${hash}`),
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images,
        },
    });
}

export function createSwapTransactionMetadata(
    pathname: string,
    hash: string,
    chainId: number,
    swap: SwapActivity,
): Metadata {
    const title = `View ${swap.from_token?.symbol || ''}-${swap.to_token?.symbol || ''} swap transaction on Firefly`;
    const description = `Stay ahead of the curve with real-time on-chain activity: token swaps, trades, bets, and more.`;
    const images = [{ url: urlcat(SITE_URL, `/api/og/swap/${chainId}/${hash}/image`) }];

    return createSiteMetadata(pathname, {
        title,
        description,
        openGraph: {
            title,
            description,
            images,
            url: urlcat(SITE_URL, `/tx/${chainId}/${hash}`),
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images,
        },
    });
}
