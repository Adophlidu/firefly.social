import { WARPCAST_ROOT_URL } from '@dimensiondev/constants/static';
import type { ApiContext } from '@dimensiondev/ssr';
import { compose } from '@dimensiondev/utils';
import urlcat from 'urlcat';
import { z } from 'zod';

import type { NextRequest } from '@/compat/next-server.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { getFarcasterProfilesByIds } from '@/providers/farcaster/getFarcasterProfilesByIds.js';
import type { ChannelMembersResponse } from '@/providers/types/Warpcast.js';

const Schema = z.object({
    channelId: z.string(),
    limit: z.string().optional(),
    cursor: z.string().optional(),
    fid: z.string().optional(),
});

const getHandler = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { channelId, fid, limit, cursor } = Schema.parse(Object.fromEntries(new URL(request.url).searchParams));

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

export function GET({ request }: ApiContext) {
    return getHandler(request as NextRequest);
}
