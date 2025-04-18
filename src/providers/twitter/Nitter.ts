import urlcat from 'urlcat';

import { FIREFLY_NITTER_URL } from '@/constants/index.js';
import { LimitConcurrency } from '@/decorators/LimitConcurrency.js';
import { MemoizePromise } from '@/decorators/MemoizePromise.js';
import { bom } from '@/helpers/bom.js';
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

@LimitConcurrency(2, {
    disabled: () => !bom?.window,
    priority: ['getUserTimelineByHandle', 'search', 'getTweetStatus'],
})
export class NitterAPI {
    @MemoizePromise((name, id, options) => `${name}-${id}-${options?.cursor}`)
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
            {
                next: {
                    revalidate: 5,
                },
            },
        );
        return resolveNitterJsonResponse(res);
    }

    @MemoizePromise((id) => id)
    async convertUserIdToHandle(id: string) {
        const res = await fetchJSON<Response<{ username: string }>>(
            urlcat(FIREFLY_NITTER_URL, '/api/i/user/:id', {
                id,
            }),
            {
                cache: 'force-cache',
            },
        );
        return resolveNitterJsonResponse(res);
    }

    @MemoizePromise((handle) => handle)
    async getProfileByHandle(handle: string) {
        const res = await fetchJSON<GetProfileResponse>(
            urlcat(FIREFLY_NITTER_URL, '/api/:handle/profile', {
                handle,
            }),
            {
                next: {
                    revalidate: 5,
                },
            },
        );
        return resolveNitterJsonResponse(res);
    }

    @MemoizePromise((handle, options) => `${handle}-${options?.tab}-${options?.cursor}`)
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
        const res = await fetchJSON<GetUserTimelineResponse>(url, {
            next: {
                revalidate: 1,
            },
        });
        return resolveNitterJsonResponse(res);
    }

    @MemoizePromise((query, options) => `${query}-${options?.cursor}`)
    async search(
        query: string,
        options?: {
            cursor?: string;
            type?: 'users';
        },
    ) {
        const url = urlcat(FIREFLY_NITTER_URL, `/api/search`, {
            q: query,
            cursor: options?.cursor,
            f: options?.type,
        });
        const res = await fetchJSON<SearchResponse>(url, {
            next: {
                revalidate: 1,
            },
        });
        return resolveNitterJsonResponse(res);
    }
}

export const NitterAPIProvider = new NitterAPI();
