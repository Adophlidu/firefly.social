import { FansStatus, OgStatus } from '@dimensiondev/enums';
import type { NextRequestContext } from '@dimensiondev/types';
import { compose, runInSafeAsync } from '@dimensiondev/utils';
import { ImageResponse } from 'next/og.js';
import type { NextRequest } from 'next/server.js';
import { z } from 'zod';

import { SparksAccountOgImage } from '@/app/api/og/sparks_account/[accountId]/image/SparksAccountOgImage.js';
import { CACHE_AGE_INDEFINITE_ON_DISK } from '@/constants/static.js';
import { createProxyImageResponse } from '@/helpers/createProxyImageResponse.js';
import { getParamsWithZodSchema } from '@/helpers/getParamsWithZodSchema.js';
import { getPublicS3Url } from '@/helpers/getPublicUrl.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { getSparksAccountDetails } from '@/providers/firefly/endpoint/getSparksAccountDetails.js';
import { getSatoriFonts } from '@/services/getSatoriFonts.js';

const sparksDefaultOgImage = getPublicS3Url('/og/genesis_sparks.png');

const ParamsSchema = z.object({
    accountId: z.string().optional(),
});

export const GET = compose(
    withRequestErrorHandler(),
    async (
        request: NextRequest,
        context?: NextRequestContext<{
            accountId?: string;
        }>,
    ) => {
        const { accountId } = await getParamsWithZodSchema(ParamsSchema, context);
        if (!accountId) return createProxyImageResponse(sparksDefaultOgImage);

        const accountInfo = await runInSafeAsync(() => getSparksAccountDetails(accountId));

        const isNotBoundX =
            accountInfo?.isOg === OgStatus.isNotBoundX && accountInfo?.isFans === FansStatus.isNotBoundX;
        const isOgUser = !!accountInfo?.OgList?.length;
        const isFansUser = !!accountInfo?.FansList?.length;

        if (!accountInfo || !isOgUser || (isOgUser && !accountInfo.ogActive) || !isFansUser || isNotBoundX) {
            return createProxyImageResponse(sparksDefaultOgImage);
        }

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
