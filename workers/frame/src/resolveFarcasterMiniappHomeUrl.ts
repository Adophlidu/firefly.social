import { fetchJson } from '@dimensiondev/workers-shared/helpers/fetchJson.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import type { Context } from 'hono';

const WARPCAST_CLIENT_URL_V1 = 'https://client.warpcast.com/v1';
const MINIAPPS_ID_REGEXP = /^https?:\/\/(?:www\.)?(?:farcaster\.xyz|warpcast\.com)\/miniapps\/([a-zA-Z0-9_-]+)\/.+/;

interface MiniAppsResponse {
    result: {
        frame: {
            homeUrl: string;
        };
    };
}

export async function resolveFarcasterMiniappHomeUrl(url: string, c: Context) {
    const [, id] = url.match(MINIAPPS_ID_REGEXP) ?? [null, null];
    if (!id) return url;

    try {
        const { result } = await fetchJson<MiniAppsResponse>(
            urlcat(WARPCAST_CLIENT_URL_V1, '/frame', {
                id,
            }),
            {
                context: c,
            },
        );
        return result.frame.homeUrl;
    } catch (error) {
        console.error(`Error resolving Warpcast miniapp home URL: url=${url}`, error);
        return url;
    }
}
