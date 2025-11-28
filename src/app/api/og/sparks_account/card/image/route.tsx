import { compose } from '@dimensiondev/utils';
import { ImageResponse } from 'next/og.js';
import type { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';
import { z } from 'zod';

import { SparkCardOgImage } from '@/app/api/og/sparks_account/card/image/SparkCardOgImage.js';
import { CACHE_AGE_INDEFINITE_ON_DISK, FIREFLY_S3_URL } from '@/constants/index.js';
import { createProxyImageResponse } from '@/helpers/createProxyImageResponse.js';
import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { getSatoriFonts } from '@/services/getSatoriFonts.js';
import type { NextRequestContext } from '@/types/utility.js';

const sparksDefaultOgImage = urlcat(FIREFLY_S3_URL, '/og/genesis_sparks.png');

const ParamsSchema = z.object({
    avatar: z.string().optional(),
    rank: z.string().optional(),
    name: z.string().optional(),
});

export const GET = compose(withRequestErrorHandler(), async (request: NextRequest, context?: NextRequestContext) => {
    const { avatar, rank, name } = getSearchParamsWithZodSchema(request, ParamsSchema);
    if (!avatar || !rank || !name) return createProxyImageResponse(sparksDefaultOgImage);

    return new ImageResponse(<SparkCardOgImage avatar={avatar} rank={rank} name={name} />, {
        width: 368,
        height: 512,
        fonts: await getSatoriFonts(['Bedstead']),
        headers: {
            'Cache-Control': CACHE_AGE_INDEFINITE_ON_DISK,
        },
        emoji: 'twemoji',
    });
});
