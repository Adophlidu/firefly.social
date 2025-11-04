import { compose } from '@dimensiondev/utils';
import { ImageResponse } from 'next/og.js';
import type { NextRequest } from 'next/server.js';

import { SparksAccountOgImage } from '@/app/api/og/sparks_account/[accountId]/image/SparksAccountOgImage.js';
import { CACHE_AGE_INDEFINITE_ON_DISK } from '@/constants/index.js';
import { createProxyImageResponse } from '@/helpers/createProxyImageResponse.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { fireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { FansStatus, OgStatus } from '@/providers/types/Firefly.js';
import { getSatoriFonts } from '@/services/getSatoriFonts.js';
import type { NextRequestContext } from '@/types/utility.js';

const sparksDefaultOgImage = 'https://media.firefly.land/og/genesis_sparks.png';

export const GET = compose(
    withRequestErrorHandler(),
    async (
        request: NextRequest,
        context?: NextRequestContext<{
            accountId?: string;
        }>,
    ) => {
        const params = await context?.params;
        if (!params?.accountId) return createProxyImageResponse(sparksDefaultOgImage);

        const accountInfo = await runInSafeAsync(() =>
            fireflyEndpointProvider.getSparksAccountDetails(params.accountId!),
        );

        const isNotBoundX =
            accountInfo?.isOg === OgStatus.isNotBoundX && accountInfo?.isFans === FansStatus.isNotBoundX;
        const isOgUser = !!accountInfo?.OgList?.length;
        const isFansUser = !!accountInfo?.FansList?.length;

        if (!accountInfo || !isOgUser || (isOgUser && !accountInfo.ogActive) || !isFansUser || isNotBoundX)
            return createProxyImageResponse(sparksDefaultOgImage);

        return new ImageResponse(<SparksAccountOgImage account={accountInfo} />, {
            width: 1200,
            height: 630,
            fonts: await getSatoriFonts(['Bedstead']),
            headers: {
                'Cache-Control': CACHE_AGE_INDEFINITE_ON_DISK,
            },
            emoji: 'twemoji',
        });
    },
);
