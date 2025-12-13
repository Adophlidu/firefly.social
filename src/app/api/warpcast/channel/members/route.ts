import { compose } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';
import { z } from 'zod';

import { WARPCAST_ROOT_URL } from '@/constants/static.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { getFarcasterProfilesByIds } from '@/providers/farcaster/getFarcasterProfilesByIds.js';
import type { ChannelMembersResponse } from '@/providers/types/Warpcast.js';

const Schema = z.object({
    channelId: z.string(),
    limit: z.string().optional(),
    cursor: z.string().optional(),
    fid: z.string().optional(),
});

export const GET = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { channelId, fid, limit, cursor } = getSearchParamsWithZodSchema(request, Schema);

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

    const profiles = await getFarcasterProfilesByIds(fids, fid);

    return createSuccessResponseJson({
        members: profiles,
        cursor: response.next?.cursor,
    });
});
