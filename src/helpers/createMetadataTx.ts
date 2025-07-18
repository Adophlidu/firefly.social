import urlcat from 'urlcat';

import { getMaintainAccountInfo } from '@/components/Tips/TipsDetail.js';
import { TipsDetailViewType, TipsNotificationType } from '@/constants/enum.js';
import { SITE_URL } from '@/constants/index.js';
import { createPageTitleOG } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { isValidTxId } from '@/helpers/isValidTxId.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { SwapActivity, TipsDetail } from '@/providers/types/Firefly.js';

function generateSwapMetadata(pathname: string, hash: string, chainId: number, swap: SwapActivity) {
    const title = createPageTitleOG(`${swap.from_token?.symbol} - ${swap.to_token?.symbol}`);
    const description = swap.from_token?.name;
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

function generateTipsMetadata(
    pathname: string,
    hash: string,
    chainId: number,
    tips: TipsDetail,
    view = TipsDetailViewType.Sender,
) {
    const accountInfo = getMaintainAccountInfo(tips, view);
    const title = createPageTitleOG(
        `${accountInfo?.maintainAccountInfo?.displayName} - ${accountInfo?.targetAccountInfo.displayName}`,
    );
    const description = `${accountInfo?.maintainAccountInfo?.displayName} sent ${tips.amount} ${tips.token_symbol} to ${accountInfo?.targetAccountInfo.displayName}`;
    const images = [
        {
            url: urlcat(SITE_URL, 'api/og/tip/:hash/image', {
                hash,
                view,
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

export async function createMetadataTx(pathname: string, hash: string, chainId: number, view?: TipsDetailViewType) {
    if (!isValidTxId(hash)) return createSiteMetadata(pathname);

    const tipsData = await runInSafeAsync(() =>
        FireflyEndpointProvider.getTipsTransactionDetail(hash, TipsNotificationType.Tip),
    );

    const swapData = await runInSafeAsync(() => FireflyEndpointProvider.getSwapActivityByHash(hash, chainId));
    if (swapData) return generateSwapMetadata(pathname, hash, chainId, swapData);

    if (tipsData) return generateTipsMetadata(pathname, hash, chainId, tipsData, view);

    return createSiteMetadata(pathname);
}
