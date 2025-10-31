import { compose } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';
import { z } from 'zod';

import { WARPCAST_ROOT_URL } from '@/constants/index.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { getSearchParamsFromRequestWithZodObject } from '@/helpers/getSearchParamsFromRequestWithZodObject.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { FarcasterSocialMediaProvider } from '@/providers/farcaster/SocialMedia.js';
import type { ChannelMembersResponse } from '@/providers/types/Warpcast.js';

const Schema = z.object({
    channelId: z.string(),
    limit: z.string().optional(),
    cursor: z.string().optional(),
    fid: z.string().optional(),
});

export const GET = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { channelId, fid, limit, cursor } = getSearchParamsFromRequestWithZodObject(request, Schema);

    const response = await fetchJson<ChannelMembersResponse>(
        urlcat(WARPCAST_ROOT_URL, '/fc/channel-members', {
            channelId,
            limit,
            cursor,
        }),
    );
    if (response.errors?.length) {
        throw new Error(`Warpcast API error: ${response.errors[0].message}`);
    }

    const fids = response.result?.members?.map((user) => `${user.fid}`);
    if (!fids?.length) {
        return createSuccessResponseJson({
            members: [],
        });
    }

    const profiles = await FarcasterSocialMediaProvider.getProfilesByIds(fids, fid);

    return createSuccessResponseJson({
        members: profiles,
        cursor: response.next?.cursor,
    });
});
