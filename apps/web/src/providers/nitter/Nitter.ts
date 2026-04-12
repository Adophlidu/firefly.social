import { bom, NotFoundError } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { Source } from '@/constants/enum.js';
import { AccountSuspendedError, NitterError } from '@/constants/error.js';
import { FIREFLY_NITTER_URL } from '@/constants/static.js';
import { LimitConcurrency } from '@/decorators/LimitConcurrency.js';
import { MemoizePromise } from '@/decorators/MemoizePromise.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import type {
    GetProfileResponse,
    GetTweetStatusResponse,
    GetUserTimelineResponse,
    Response,
    SearchResponse,
    UserTimelineTab,
} from '@/providers/types/Nitter.js';

function resolveNitterJsonResponse<T>(url: string, { data, error }: Response<T>): T {
    if (error) throw new NitterError(url, error);
    return data as T;
}

@LimitConcurrency(2, {
    disabled: () => !bom?.window,
    priority: ['getUserTimelineByHandle', 'search', 'getTweetStatus'],
})
class NitterAPI {
    @MemoizePromise((name, id, options) => `${name}-${id}-${options?.cursor}`)
    async getTweetStatus(
        name: string,
        id: string,
        options?: {
            cursor?: string;
        },
    ) {
        const url = urlcat(FIREFLY_NITTER_URL, '/api/:name/status/:id', {
            name,
            id,
            cursor: options?.cursor,
        });
        const response = await fetchJson<GetTweetStatusResponse>(
            url,
            {
                next: {
                    revalidate: 5,
                },
            },
            { noStrictOK: true },
        );

        if (response.error_type === 'not_found') {
            throw new NotFoundError(`The tweet not found with id: ${id}`);
        }

        return resolveNitterJsonResponse(url, response);
    }

    @MemoizePromise((handle) => handle)
    async getProfileByHandle(handle: string) {
        const url = urlcat(FIREFLY_NITTER_URL, '/api/:handle/profile', {
            handle,
        });
        const response = await fetchJson<GetProfileResponse>(
            url,
            {
                next: {
                    revalidate: 5,
                },
            },
            { noStrictOK: true },
        );

        if (response.error_type === 'not_found') {
            throw new NotFoundError(`The twitter profile not found with handle: ${handle}`);
        }

        const data = resolveNitterJsonResponse(url, response);
        if (data.user.suspended) throw new AccountSuspendedError(handle, Source.Twitter);
        return data;
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
        const response = await fetchJson<GetUserTimelineResponse>(url, {
            next: {
                revalidate: 1,
            },
        });
        return resolveNitterJsonResponse(url, response);
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
        const response = await fetchJson<SearchResponse>(url, {
            next: {
                revalidate: 1,
            },
        });
        return resolveNitterJsonResponse(url, response);
    }
}

export const NitterAPIProvider = new NitterAPI();
