import { compose } from '@firefly/utils';
import type { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';
import { z } from 'zod';

import { WARPCAST_ROOT_URL_V1 } from '@/constants/index.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { getSearchParamsFromRequestWithZodObject } from '@/helpers/getSearchParamsFromRequestWithZodObject.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { FarcasterSocialMediaProvider } from '@/providers/farcaster/SocialMedia.js';
import type { ChannelFollowersResponse } from '@/providers/types/Warpcast.js';

const Schema = z.object({
    channelId: z.string(),
    limit: z.string().optional(),
    cursor: z.string().optional(),
    fid: z.string().optional(),
});

export const GET = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { channelId, fid, limit, cursor } = getSearchParamsFromRequestWithZodObject(request, Schema);

    const response = await fetchJson<ChannelFollowersResponse>(
        urlcat(WARPCAST_ROOT_URL_V1, '/channel-followers', {
            channelId,
            limit,
            cursor,
        }),
    );
    if (response.errors?.length) {
        throw new Error(`Warpcast API error: ${response.errors[0].message}`);
    }

    const fids = response.result?.users?.map((user) => `${user.fid}`);
    if (!fids?.length) {
        return createSuccessResponseJson({
            followers: [],
        });
    }

    const profiles = await FarcasterSocialMediaProvider.getProfilesByIds(fids, fid);

    return createSuccessResponseJson({
        followers: profiles,
        cursor: response.next?.cursor,
    });
});
