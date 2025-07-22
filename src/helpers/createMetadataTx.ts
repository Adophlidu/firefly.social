import urlcat from 'urlcat';

import { getMaintainAccountInfo } from '@/components/Tips/TipsDetail.js';
import { TipsDetailViewType, TipsNotificationType } from '@/constants/enum.js';
import { SITE_URL } from '@/constants/index.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { isValidTxId } from '@/helpers/isValidTxId.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { SwapActivity, TipsDetail } from '@/providers/types/Firefly.js';

function generateSwapMetadata(pathname: string, hash: string, chainId: number, swap: SwapActivity) {
    const title =
        swap.from_token?.symbol && swap.to_token?.symbol
            ? `View ${swap.from_token?.symbol} - ${swap.to_token?.symbol} swap transaction on Firefly`
            : `View Swap on Firefly`;
    const description =
        'Stay ahead of the curve with real-time on-chain activity: token swaps, NFT trades, Polymarket bets, and more.';

    const images = [
        {
            url: urlcat(SITE_URL, 'api/og/swap/:chainId/:hash/image', {
                chainId,
                hash,
            }),
        },
    ];
    return createSiteMetadata(pathname, {
        title,
        description,
        openGraph: {
            title,
            description,
            images,
            url: RouteResolver.tx(chainId, hash),
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images,
        },
    });
}

function generateTipsMetadata(pathname: string, hash: string, chainId: number, tips: TipsDetail) {
    const accountInfo = getMaintainAccountInfo(tips, TipsDetailViewType.Sender);
    const title = `${accountInfo?.maintainAccountInfo.displayName} sent a tip to ${accountInfo?.targetAccountInfo.displayName} on Firefly`;
    const description = 'Looking to grow your influence? Firefly offers tools to engage your community.';
    const images = [
        {
            url: urlcat(SITE_URL, 'api/og/tip/:hash/image', {
                hash,
            }),
        },
    ];
    return createSiteMetadata(pathname, {
        title,
        description,
        openGraph: {
            title,
            description,
            images,
            url: RouteResolver.tx(chainId, hash),
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images,
        },
    });
}

export async function createMetadataTx(pathname: string, hash: string, chainId: number) {
    if (!isValidTxId(hash)) return createSiteMetadata(pathname);

    const tipsData = await runInSafeAsync(() =>
        FireflyEndpointProvider.getTipsTransactionDetail(hash, TipsNotificationType.Tip),
    );

    const swapData = await runInSafeAsync(() => FireflyEndpointProvider.getSwapActivityByHash(hash, chainId));
    if (swapData) return generateSwapMetadata(pathname, hash, chainId, swapData);

    if (tipsData) return generateTipsMetadata(pathname, hash, chainId, tipsData);

    return createSiteMetadata(pathname);
}
