import type { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';
import { z } from 'zod';

import { WARPCAST_ROOT_URL } from '@/constants/index.js';
import { compose } from '@/helpers/compose.js';
import { createSuccessResponseJSON } from '@/helpers/createResponseJSON.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import { getSearchParamsFromRequestWithZodObject } from '@/helpers/getSearchParamsFromRequestWithZodObject.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import type { ChannelFollowersResponse } from '@/providers/types/Warpcast.js';
import { fetchProfilesFromNeynar } from '@/services/fetchProfilesFromNeynar.js';

const Schema = z.object({
    channelId: z.string(),
    limit: z.string().optional(),
    cursor: z.string().optional(),
    fid: z.string().optional(),
});

export const GET = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { channelId, fid, limit, cursor } = getSearchParamsFromRequestWithZodObject(request, Schema);

    const response = await fetchJSON<ChannelFollowersResponse>(
        urlcat(WARPCAST_ROOT_URL, '/v1/channel-followers', {
            channelId,
            limit,
            cursor,
        }),
    );
    if (response.errors?.length) {
        throw new Error(`Warpcast API error: ${response.errors[0].message}`);
    }

    const fids = response.result?.users?.map((user) => user.fid);
    if (!fids?.length) {
        return createSuccessResponseJSON({
            followers: [],
        });
    }

    const profiles = await fetchProfilesFromNeynar(fids, fid);

    return createSuccessResponseJSON({
        followers: profiles,
        cursor: response.next?.cursor,
    });
});
