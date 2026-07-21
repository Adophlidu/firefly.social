import { WARPCAST_ROOT_URL_V1 } from '@dimensiondev/constants/static';
import type { ApiContext } from '@dimensiondev/ssr';
import { compose } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';
import { z } from 'zod';

import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';

const Schema = z.object({
    channelId: z.string(),
    fid: z.string(),
});

const getHandler = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { channelId, fid } = Schema.parse(Object.fromEntries(new URL(request.url).searchParams));

    const response = await fetchJson<{ result: { following: boolean } }>(
        urlcat(WARPCAST_ROOT_URL_V1, '/user-channel', {
            fid,
            channelId,
        }),
    );

    return createSuccessResponseJson({
        following: response?.result?.following ?? false,
    });
});

export function GET({ request }: ApiContext) {
    return getHandler(request as NextRequest);
}
