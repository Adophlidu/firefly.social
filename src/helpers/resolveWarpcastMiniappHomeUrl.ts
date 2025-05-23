import urlcat from 'urlcat';

import { WARPCAST_CLIENT_URL_V1 } from '@/constants/index.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';

const PREFIX = 'https://warpcast.com/miniapps/';

interface MiniAppsResponse {
    result: {
        frame: {
            homeUrl: string;
        };
    };
}

function getWarpcastMiniappId(url: string) {
    if (!url.startsWith(PREFIX)) return null;

    const path = url.slice(PREFIX.length);
    return path.split('/')[0];
}

export async function resolveWarpcastMiniappHomeUrl(url: string, signal?: AbortSignal) {
    const id = getWarpcastMiniappId(url);
    if (!id) return url;

    try {
        const { result } = await fetchJSON<MiniAppsResponse>(
            urlcat(WARPCAST_CLIENT_URL_V1, '/frame', {
                id,
            }),
            {
                signal,
            },
        );
        return result.frame.homeUrl;
    } catch (error) {
        console.error(`Error resolving Warpcast miniapp home URL: url=${url}`, error);
        return url;
    }
}
