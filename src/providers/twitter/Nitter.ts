import urlcat from 'urlcat';

import { FIREFLY_NITTER_URL } from '@/constants/index.js';
import { LimitConcurrency } from '@/decorators/LimitConcurrency.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import {
    type GetProfileResponse,
    type GetTweetStatusResponse,
    type GetUserTimelineResponse,
    type Response,
    type SearchResponse,
    UserTimelineTab,
} from '@/providers/types/Nitter.js';

function resolveNitterJsonResponse<T>({ data, error }: Response<T>): T {
    if (error) throw new Error(error);
    return data as T;
}

@LimitConcurrency(2)
export class NitterAPI {
    async getTweetStatus(
        name: string,
        id: string,
        options?: {
            cursor?: string;
        },
    ) {
        const res = await fetchJSON<GetTweetStatusResponse>(
            urlcat(FIREFLY_NITTER_URL, '/api/:name/status/:id', {
                name,
                id,
                cursor: options?.cursor,
            }),
        );
        return resolveNitterJsonResponse(res);
    }

    async convertUserIdToHandle(id: string) {
        const res = await fetchJSON<Response<{ username: string }>>(
            urlcat(FIREFLY_NITTER_URL, '/api/i/user/:id', {
                id,
            }),
        );
        return resolveNitterJsonResponse(res);
    }

    async getProfileByHandle(handle: string) {
        const res = await fetchJSON<GetProfileResponse>(
            urlcat(FIREFLY_NITTER_URL, '/api/:handle/profile', {
                handle,
            }),
        );
        return resolveNitterJsonResponse(res);
    }

    async getUserTimelineByHandle(
        handle: string,
        options?: {
            tab?: UserTimelineTab;
            cursor?: string;
        },
    ) {
        const url = options?.tab
            ? urlcat(FIREFLY_NITTER_URL, '/api/:handle/:tab', {
                  handle,
                  tab: options.tab,
                  cursor: options?.cursor,
              })
            : urlcat(FIREFLY_NITTER_URL, '/api/:handle', {
                  handle,
                  cursor: options?.cursor,
              });
        const res = await fetchJSON<GetUserTimelineResponse>(url);
        return resolveNitterJsonResponse(res);
    }

    async search(
        query: string,
        options?: {
            cursor?: string;
        },
    ) {
        const url = urlcat(`/api/search`, {
            q: query,
            cursor: options?.cursor,
        });
        const res = await fetchJSON<SearchResponse>(url);
        return resolveNitterJsonResponse(res);
    }
}

export const NitterAPIProvider = new NitterAPI();
