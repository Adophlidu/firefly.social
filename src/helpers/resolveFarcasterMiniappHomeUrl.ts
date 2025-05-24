import { nth } from 'lodash-es';
import urlcat from 'urlcat';

import { WARPCAST_CLIENT_URL_V1 } from '@/constants/index.js';
import { MINIAPPS_ID_REGEXP } from '@/constants/regexp.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';

interface MiniAppsResponse {
    result: {
        frame: {
            homeUrl: string;
        };
    };
}

export async function resolveFarcasterMiniappHomeUrl(url: string, signal?: AbortSignal) {
    const id = nth(url.match(MINIAPPS_ID_REGEXP) ?? [null, null], 1);
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
