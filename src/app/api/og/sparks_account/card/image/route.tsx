import { ImageResponse } from 'next/og.js';
import type { NextRequest } from 'next/server.js';

import { SparkCardOgImage } from '@/app/api/og/sparks_account/card/image/SparkCardOgImage.js';
import { CACHE_AGE_INDEFINITE_ON_DISK } from '@/constants/index.js';
import { compose } from '@/helpers/compose.js';
import { createProxyImageResponse } from '@/helpers/createProxyImageResponse.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { getSatoriFonts } from '@/services/getSatoriFonts.js';
import type { NextRequestContext } from '@/types/utility.js';

const sparksDefaultOgImage = 'https://media.firefly.land/og/genesis_sparks.png';

export const GET = compose(withRequestErrorHandler(), async (request: NextRequest, context?: NextRequestContext) => {
    const searchParams = new URL(request.url).searchParams;
    const avatar = searchParams.get('avatar');
    const rank = searchParams.get('rank');
    const name = searchParams.get('name');

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
