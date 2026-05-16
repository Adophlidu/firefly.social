import { createSiteMetadata } from '@dimensiondev/workers-shared/helpers/createSiteMetadata.js';
import { resolveSiteUrl } from '@dimensiondev/workers-shared/helpers/resolveSiteUrl.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import type { Context } from 'hono';

import { getMaintainAccountInfo } from '@/metadata/src/transaction/getMaintainAccountInfo.js';
import type { TipsDetail } from '@/metadata/src/transaction/types.js';
import { TipsDetailViewType } from '@/metadata/src/transaction/types.js';

export function generateTipsMetadata(pathname: string, hash: string, chainId: number, tips: TipsDetail, c: Context) {
    const accountInfo = getMaintainAccountInfo(tips, TipsDetailViewType.Sender, c);
    const title = `${accountInfo?.maintainAccountInfo.displayName} sent a tip to ${accountInfo?.targetAccountInfo.displayName} on Firefly`;
    const description = 'Looking to grow your influence? Firefly offers tools to engage your community.';
    const images = [
        {
            url: urlcat(resolveSiteUrl(c), `/api/og/tip/${hash}/image`),
        },
    ];
    return createSiteMetadata(pathname, {
        title,
        description,
        openGraph: {
            title,
            description,
            images,
            url: urlcat(resolveSiteUrl(c), `/tx/${chainId}/${hash}`),
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images,
        },
    });
}
